import firebase, { db, functions } from '../firebase';

interface ExplanationSections {
  whatitDoes: string;
  howithelps: string;
  impnotes: string;
}

export interface MedicationExplanation {
  name: string;
  Detailedsections: ExplanationSections;
  fdaDataFetched: any;
  lastUpdated: any;
}

// --- Main Public Function ---

export const getMedicationExplanation = async (medName: string): Promise<MedicationExplanation | null> => {
  if (!medName) return null;

  const docId = medName.trim();

  try {
    // 1. Check Cache
    const docRef = db.collection("medicationExplanations").doc(docId);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const data = docSnap.data() as MedicationExplanation;
      // Basic validation
      if (data.Detailedsections && 
          data.Detailedsections.whatitDoes !== "Information currently unavailable.") {
        return data;
      }
      console.log(`Cached explanation for ${docId} seems invalid. Regenerating...`);
    }

    // 2. Not found or invalid? Generate it via Cloud Function
    console.log(`Generating explanation for ${docId}...`);
    return await generateAndSaveExplanation(docId);

  } catch (error) {
    console.error("Error in getMedicationExplanation:", error);
    return null;
  }
};

// --- Internal Helper Functions ---

const generateAndSaveExplanation = async (medName: string): Promise<MedicationExplanation | null> => {
  try {
    // A. Fetch FDA Data (Public API, safe to do on client, or move to backend if desired)
    const fdaInfo = await fetchFDAData(medName);
    
    // B. Generate with Gemini via Cloud Function
    const generatedSections = await callGeminiBackend(medName, fdaInfo);
    
    if (!generatedSections) return null;

    // C. Save to Firestore
    const explanationData = {
      name: medName,
      Detailedsections: generatedSections,
      fdaDataFetched: firebase.firestore.FieldValue.serverTimestamp(),
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    };

    await db.collection("medicationExplanations").doc(medName).set(explanationData);

    return explanationData as MedicationExplanation;

  } catch (error) {
    console.error("Error generating explanation:", error);
    return null;
  }
};

const fetchFDAData = async (medName: string): Promise<string> => {
  const cleanName = medName.toLowerCase().trim();
  const queries = [
    `openfda.brand_name:"${cleanName}"`,
    `openfda.generic_name:"${cleanName}"`,
    `openfda.substance_name:"${cleanName}"`
  ];

  for (const q of queries) {
    try {
      const url = `https://api.fda.gov/drug/label.json?search=${q}&limit=1`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const res = data.results[0];
          const usage = res.indications_and_usage ? res.indications_and_usage[0] : '';
          const purpose = res.purpose ? res.purpose[0] : '';
          const dosage = res.dosage_and_administration ? res.dosage_and_administration[0] : '';
          
          const combined = `
            Indication: ${usage}
            Purpose: ${purpose}
            Dosage Info: ${dosage}
          `.trim();
          
          if (combined.length > 20) return combined;
        }
      }
    } catch (e) {
      // Continue to next query
    }
  }

  return "No specific FDA data available for this medication.";
};

const callGeminiBackend = async (medName: string, fdaData: string): Promise<ExplanationSections | null> => {
  const prompt = `
    You are a kind pharmacist explaining medication to an elderly person.
    Medication Name: ${medName}
    Official FDA Information: ${fdaData.substring(0, 1500)}

    Create a warm, simple explanation in 3 sections.
    Use headings "SECTION 1:", "SECTION 2:", "SECTION 3:" exactly.

    SECTION 1: What This Medication Does
    SECTION 2: How It Helps You
    SECTION 3: Important Things to Know

    Keep it simple, reassuring, and clear. No markdown formatting like **bold** in the headers, just text.
  `;

  try {
    // Call the Firebase Cloud Function
    const generateFn = functions.httpsCallable('generateMedicationExplanation');
    const result = await generateFn({ prompt });
    
    const data = result.data as any;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) return null;

    return parseGeminiResponse(text);

  } catch (error) {
    console.error("Cloud Function Call Failed. Ensure 'generateMedicationExplanation' is deployed.", error);
    return null;
  }
};

const parseGeminiResponse = (text: string): ExplanationSections => {
  const sections: ExplanationSections = {
    whatitDoes: "Information currently unavailable.",
    howithelps: "Please consult your doctor.",
    impnotes: "Always follow your prescription."
  };

  try {
    const s1Regex = /SECTION 1[\W\s]*(.*?)(?=SECTION 2)/is;
    const s2Regex = /SECTION 2[\W\s]*(.*?)(?=SECTION 3)/is;
    const s3Regex = /SECTION 3[\W\s]*(.*)/is;

    const s1 = text.match(s1Regex);
    const s2 = text.match(s2Regex);
    const s3 = text.match(s3Regex);

    if (s1 && s1[1]) sections.whatitDoes = s1[1].trim();
    if (s2 && s2[1]) sections.howithelps = s2[1].trim();
    if (s3 && s3[1]) sections.impnotes = s3[1].trim();

  } catch (e) {
    console.error("Parsing Error:", e);
  }

  return sections;
};