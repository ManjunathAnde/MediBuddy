# MediBuddy 💊

Your personal pharmacist, always by your side.

 --The Problem

For individuals, especially elderly, managing chronic diseases like diabetes, medication mistakes can be fatal.

--The Reality:
- Missed a dose? Blood sugar spikes. Heart conditions worsen. Consequences can be life-threatening.
- Took it twice by mistake? Overdose risks. Emergency room visits. Dangerous side effects.
- Out of pills? Treatment gaps. Health deteriorates. Preventable complications.

--What Happens at the Pharmacy:
You're at the counter. The line is long. The pharmacist is rushing.
"Take this twice daily with food. Don't take it with grapefruit. Call if you feel dizzy."
You nod. You leave. But did you catch everything? What if you forget tomorrow?
For someone managing 5, 7, or 10 different medications—this becomes impossible.

--The Effort
MediBuddy is the pharmacist who's always available.

When your real pharmacist is too busy, when you're confused at 2 AM, when you can't remember if you took your evening dose—MediBuddy is there.


-- Key Features

1. Never Miss a Dose
- Clear medication schedule with custom times
- Check off each dose as you take it
- Visual calendar shows your adherence history
- No more "Did I take this already?"

2. Never Run Out
- Track your pill count automatically
- Get alerts when you're running low
- Reorder before you run out, not after

3. Understand Your Medications
- AI-powered explanations in simple language
- FDA data translated for elderly users
- Know what you're taking and why

4. Pharmacist Integration
Your pharmacist can update your medications directly:
- Add new prescriptions
- Set correct dosages and schedules  
- Update pill quantities from your purchase
- You're instantly synced and ready to go

5. All Your Health Info in One Place
- Store prescriptions (no more lost papers)
- Keep doctor contact info
- Save pharmacist details
- One app for all your medication needs


-- Built For
Users managing chronic conditions:
- Diabetes patients tracking multiple medications
- Heart disease patients with complex regimens
- Anyone taking 3+ medications daily
- Caregivers managing medications for loved ones


--Why This Matters

MediBuddy helps prevent:
- Missed doses leading to complications
- Accidental double-dosing
- Running out of critical medications
- Confusion about what medications do


-- How It Works

1. Your pharmacist sets you up → Medications, dosages, and quantities added (You can do it too!)
2. You get reminders → Clear schedule, easy to follow
3. Check off each dose → Never wonder "did I take it?"
4. Get alerts → Low stock warnings before you run out
5. Learn about your meds → Simple AI explanations anytime

-- The Result

Peace of mind for patients. Peace of mind for families.

No more pill organizers. No more confusion. No more dangerous mistakes.

Just your medications, managed properly.

--Technical Stack

MediBuddy is a real-time web application built with modern tools focused on accessibility and reliability for elderly users.

-- Frontend
- React 18 with TypeScript for type safety and reliability
- Tailwind CSS for responsive, accessible design
- Browser-native ES modules for fast loading
- Lucide-React for clear, accessible icons

-- Backend (Firebase/Google Cloud)
- Authentication: Email/password with verification required
- Database: Cloud Firestore (NoSQL) for real-time data sync
- Storage: Cloud Storage for prescription images and PDFs

### Database Structure

users/{uid}/
├── medications/          # User's medication list
├── medicationLogs/       # Daily adherence tracking
└── prescriptions/        # Uploaded prescription metadata
medicationExplanations/     # Cached AI-generated explanations

MediBuddy combines official drug data with AI to create simple explanations:

1. Fetch drug info from FDA OpenFDA API (official government data)
2. Send to Gemini AI for translation
3. AI converts medical jargon into simple, elderly-friendly language
4. Cache results in Firestore to avoid repeated API calls

-- Security

- Firestore security rules ensure users only access their own data
- Email verification required before database access
- File uploads validated (type and size limits)
- Users can only read/write their own medications and logs

-- Key Features Implementation

- Real-time sync: Firestore listeners update UI instantly across devices
- Adherence tracking: Atomic transactions prevent duplicate logs
- Smart caching: AI explanations generated once, reused forever
- Offline-first: Data persists locally, syncs when online


--Run Locally
Prerequisites:  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
