import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, BookOpen, Heart, AlertTriangle, Pill, RefreshCw } from 'lucide-react';
import { Medication } from '../types';
import { getMedicationExplanation, MedicationExplanation } from '../services/medicationExplanationService';

interface KnowYourMedsScreenProps {
  medications: Medication[];
  onAddMed: () => void;
}

export const KnowYourMedsScreen: React.FC<KnowYourMedsScreenProps> = ({ medications, onAddMed }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<MedicationExplanation['Detailedsections'] | null>(null);
  const [loadingExpl, setLoadingExpl] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch explanation when a med is expanded
  useEffect(() => {
    if (!expandedId) {
        setExplanation(null);
        setErrorMsg(null);
        return;
    }

    const med = medications.find(m => m.id === expandedId);
    if (!med) return;

    loadExplanation(med.name);
  }, [expandedId]);

  const loadExplanation = async (medName: string) => {
    setLoadingExpl(true);
    setErrorMsg(null);
    setExplanation(null);

    try {
        const data = await getMedicationExplanation(medName);
        if (data && data.Detailedsections) {
            setExplanation(data.Detailedsections);
        } else {
            setErrorMsg("Unable to load information right now.");
        }
    } catch (err) {
        console.error("Error loading explanation:", err);
        setErrorMsg("Information temporarily unavailable.");
    } finally {
        setLoadingExpl(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E6F5F3] via-[#F2FAF9] to-white pb-24">
      {/* Header */}
      <div className="bg-white px-6 py-6 shadow-sm sticky top-0 z-10">
        <h1 className="text-3xl font-bold text-warmGray">Know Your Meds</h1>
        <p className="text-xl text-gray-600 mt-1">Understanding your medications</p>
      </div>

      <div className="p-6 max-w-3xl mx-auto space-y-4">
        {medications.map((med) => {
            const isExpanded = expandedId === med.id;
            return (
                <div 
                    key={med.id} 
                    className="bg-white rounded-2xl shadow-sm overflow-hidden transition-all duration-300"
                >
                    <button 
                        onClick={() => toggleExpand(med.id)}
                        className="w-full p-6 flex items-center justify-between text-left focus:outline-none focus:bg-gray-50"
                    >
                        <div>
                            <h3 className="text-2xl font-bold text-warmGray">{med.name}</h3>
                            <p className="text-lg text-gray-500 font-medium mt-1">{med.dosage}</p>
                        </div>
                        {isExpanded ? (
                            <ChevronUp className="text-gray-400" size={32} />
                        ) : (
                            <ChevronDown className="text-gray-400" size={32} />
                        )}
                    </button>

                    {isExpanded && (
                        <div className="border-t border-gray-100 animate-in slide-in-from-top-2 fade-in duration-300">
                            {loadingExpl ? (
                                <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                                    <RefreshCw className="animate-spin mb-4 text-gentleGreen" size={32} />
                                    <p className="text-lg">Gathering simple information...</p>
                                    <p className="text-sm mt-2 text-gray-400">Consulting FDA & Pharmacist AI</p>
                                </div>
                            ) : errorMsg ? (
                                <div className="p-8 text-center text-gray-500">
                                    <p className="mb-4">{errorMsg}</p>
                                    <button 
                                      onClick={() => loadExplanation(med.name)}
                                      className="text-gentleGreen font-bold underline"
                                    >
                                      Try Again
                                    </button>
                                </div>
                            ) : explanation ? (
                                <>
                                    {/* Section 1 */}
                                    <div className="p-6 bg-[#F0F7FF] border-b border-blue-50">
                                        <div className="flex items-start gap-4">
                                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600 flex-shrink-0">
                                                <Pill size={24} />
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-bold text-warmGray mb-2">What This Medication Does</h4>
                                                <p className="text-lg text-gray-700 leading-relaxed">
                                                    {explanation.whatitDoes}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 2 */}
                                    <div className="p-6 bg-[#F0FFF4] border-b border-green-50">
                                        <div className="flex items-start gap-4">
                                            <div className="p-2 bg-green-100 rounded-lg text-green-600 flex-shrink-0">
                                                <Heart size={24} />
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-bold text-warmGray mb-2">How It Helps You</h4>
                                                <p className="text-lg text-gray-700 leading-relaxed">
                                                    {explanation.howithelps}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 3 */}
                                    <div className="p-6 bg-[#FFFBF0]">
                                        <div className="flex items-start gap-4">
                                            <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600 flex-shrink-0">
                                                <AlertTriangle size={24} />
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-bold text-warmGray mb-2">Important Things to Know</h4>
                                                <p className="text-lg text-gray-700 leading-relaxed">
                                                    {explanation.impnotes}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-4 bg-gray-50 text-center text-sm text-gray-400">
                                      AI-generated summary based on FDA data. Always follow your doctor's specific advice.
                                    </div>
                                </>
                            ) : null}
                        </div>
                    )}
                </div>
            );
        })}

        {medications.length === 0 && (
            <div className="text-center py-20 px-6">
                <div className="bg-gray-100 w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-6">
                    <BookOpen size={48} className="text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-warmGray">Learn about your meds</h3>
                <p className="text-xl text-gray-500 mt-2 mb-8">Add your medications to see helpful information about them.</p>
                <button 
                    onClick={onAddMed}
                    className="w-full max-w-xs mx-auto h-[60px] bg-gentleGreen text-white text-xl font-bold rounded-xl hover:bg-[#43A047] shadow-md"
                >
                    Add Medication
                </button>
            </div>
        )}
      </div>
    </div>
  );
};