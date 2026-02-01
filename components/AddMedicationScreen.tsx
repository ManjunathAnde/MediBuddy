import React, { useState } from 'react';
import { ArrowLeft, Clock, Plus, Minus, Loader2, AlertCircle } from 'lucide-react';
import { Medication, TimeSlot, TimeOfDay } from '../types';
import { AccessibleInput } from './ui/AccessibleInput';
import { AccessibleButton } from './ui/AccessibleButton';
import firebase, { db, auth } from '../firebase';
import { getMedicationExplanation } from '../services/medicationExplanationService';

interface AddMedicationScreenProps {
  onSave: () => void;
  onCancel: () => void;
  initialData?: Medication;
}

const defaultTimeSlots: TimeSlot[] = [
  { id: 'morning', label: 'Morning', defaultTime: '08:00', enabled: false },
  { id: 'afternoon', label: 'Afternoon', defaultTime: '14:00', enabled: false },
  { id: 'evening', label: 'Evening', defaultTime: '18:00', enabled: false },
  { id: 'night', label: 'Night', defaultTime: '22:00', enabled: false },
];

export const AddMedicationScreen: React.FC<AddMedicationScreenProps> = ({
  onSave,
  onCancel,
  initialData,
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [dosage, setDosage] = useState(initialData?.dosage || '');
  const [specialInstructions, setSpecialInstructions] = useState(initialData?.specialInstructions || '');
  const [stock, setStock] = useState(initialData?.stock ?? 30);
  const [lowStockThreshold, setLowStockThreshold] = useState(initialData?.lowStockThreshold ?? 10);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize timeslots based on existing data if editing
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(() => {
    if (initialData && initialData.times) {
      return defaultTimeSlots.map(slot => {
        // Find if any time in the saved array belongs to this bucket (Morning/Afternoon/etc)
        const matchingTime = initialData.times.find(t => {
            const h = parseInt(t.split(':')[0]);
            if (slot.id === 'morning' && h >= 4 && h < 12) return true;
            if (slot.id === 'afternoon' && h >= 12 && h < 17) return true;
            if (slot.id === 'evening' && h >= 17 && h < 21) return true;
            if (slot.id === 'night' && (h >= 21 || h < 4)) return true;
            return false;
        });

        if (matchingTime) {
            return { ...slot, enabled: true, customTime: matchingTime };
        }
        // Return a fresh copy of the default slot to prevent reference issues
        return { ...slot };
      });
    }
    // Always return fresh copies of default slots
    return defaultTimeSlots.map(s => ({ ...s }));
  });

  const toggleTimeSlot = (id: TimeOfDay) => {
    setTimeSlots(slots =>
      slots.map(slot =>
        slot.id === id ? { ...slot, enabled: !slot.enabled } : slot
      )
    );
    setError(null);
  };

  const updateTimeSlotTime = (id: TimeOfDay, time: string) => {
    setTimeSlots(slots =>
      slots.map(slot =>
        slot.id === id ? { ...slot, customTime: time } : slot
      )
    );
  };

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setError(null);

    // Validation
    if (!name.trim()) {
        setError("Please enter the medication name.");
        return;
    }
    if (!dosage.trim()) {
        setError("Please enter the dosage.");
        return;
    }

    const enabledSlots = timeSlots.filter(slot => slot.enabled);
    if (enabledSlots.length === 0) {
        setError("Please select at least one time to take this medication.");
        return;
    }

    setIsSaving(true);

    try {
        // Convert UI slots to string array for Firestore
        // Use custom time if set, otherwise default.
        // Fallback to defaultTime if customTime is empty (user cleared it but didn't pick new one)
        const times = enabledSlots.map(slot => {
             if (slot.customTime && slot.customTime.trim() !== "") {
                 return slot.customTime;
             }
             return slot.defaultTime;
        });
        
        // Sort chronologically for better UX
        times.sort();

        const medData = {
            name,
            dosage,
            times, // e.g. ["08:30", "20:00"]
            specialInstructions,
            stockcount: stock, // Database field name
            alertThreshhold: lowStockThreshold, // Database field name
            prescribedBy: "", // Placeholder as per prompt
            addedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (initialData && initialData.id) {
            // Update
            const medRef = db.collection("users").doc(auth.currentUser.uid).collection("medications").doc(initialData.id);
            await medRef.update(medData);
        } else {
            // Create
            await db.collection("users").doc(auth.currentUser.uid).collection("medications").add(medData);
        }

        // --- BACKGROUND TRIGGER ---
        // Trigger explanation generation without awaiting it
        if (name) {
            getMedicationExplanation(name).catch(err => console.error("Background gen error:", err));
        }
        // --------------------------

        onSave();
    } catch (error) {
        console.error("Error saving medication:", error);
        setError("Failed to save. Please try again.");
    } finally {
        setIsSaving(false);
    }
  };

  // Helper for counter inputs
  const CounterInput = ({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) => (
    <div className="mb-8">
      <label className="text-xl font-semibold text-warmGray mb-3 block">{label}</label>
      <div className="flex items-center gap-6 bg-white p-2 rounded-xl border-2 border-gray-200 w-fit">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-[60px] h-[60px] flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg active:bg-blue-100 touch-manipulation"
        >
          <Minus size={32} />
        </button>
        <span className="text-3xl font-bold text-warmGray min-w-[3ch] text-center">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-[60px] h-[60px] flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg active:bg-blue-100 touch-manipulation"
        >
          <Plus size={32} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E6F5F3] via-[#F2FAF9] to-white pb-32">
      {/* Header */}
      <div className="bg-white p-6 shadow-sm sticky top-0 z-10 flex items-center justify-between">
        <button onClick={onCancel} className="p-2 -ml-2 text-gray-600 hover:text-warmGray">
          <ArrowLeft size={32} />
        </button>
        <h1 className="text-2xl font-bold text-warmGray">
          {initialData ? 'Edit Medication' : 'Add Medication'}
        </h1>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="text-xl font-bold text-gentleGreen hover:text-[#388E3C] disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="animate-spin" /> : 'Save'}
        </button>
      </div>

      <div className="max-w-2xl mx-auto p-6">
        
        {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-alertRed rounded-r flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="text-alertRed flex-shrink-0" size={24} />
                <p className="text-lg font-bold text-alertRed">{error}</p>
            </div>
        )}

        <AccessibleInput
          id="medName"
          label="Medication Name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Metformin"
        />

        <AccessibleInput
          id="dosage"
          label="Dosage"
          type="text"
          value={dosage}
          onChange={(e) => setDosage(e.target.value)}
          placeholder="e.g. 500mg"
        />

        {/* Time Slots */}
        <div className="mb-10">
          <label className="text-xl font-semibold text-warmGray mb-4 block">Times to Take</label>
          <div className="space-y-4">
            {timeSlots.map((slot) => (
              <div 
                key={slot.id}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  slot.enabled 
                    ? 'bg-white border-gentleGreen shadow-md' 
                    : 'bg-gray-50 border-gray-200 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between min-h-[60px]">
                  <div 
                    className="flex items-center gap-4 flex-1 cursor-pointer"
                    onClick={() => toggleTimeSlot(slot.id)}
                  >
                    <div 
                      className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-colors ${
                        slot.enabled ? 'bg-gentleGreen border-gentleGreen' : 'border-gray-400 bg-white'
                      }`}
                    >
                      {slot.enabled && <div className="w-4 h-4 bg-white rounded-sm" />}
                    </div>
                    <span className={`text-2xl font-medium ${slot.enabled ? 'text-warmGray' : 'text-gray-500'}`}>
                      {slot.label}
                    </span>
                  </div>
                  
                  {slot.enabled && (
                    <div className="flex items-center gap-2 bg-blue-50 pl-4 pr-2 py-2 rounded-xl border border-blue-100 animate-in fade-in zoom-in duration-200">
                      <Clock size={24} className="text-blue-500" />
                      <input
                        type="time"
                        // Key fix: Use explicit check or default to allow typing empty strings
                        value={slot.customTime !== undefined ? slot.customTime : slot.defaultTime}
                        onChange={(e) => updateTimeSlotTime(slot.id, e.target.value)}
                        className="bg-transparent text-2xl font-bold text-warmGray focus:outline-none min-w-[140px] h-[48px] cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <AccessibleInput
          id="instructions"
          label="Special Instructions (Optional)"
          type="text"
          value={specialInstructions}
          onChange={(e) => setSpecialInstructions(e.target.value)}
          placeholder="e.g. Take with food"
        />

        <CounterInput 
          label="Current Stock Count" 
          value={stock} 
          onChange={setStock} 
        />

        <CounterInput 
          label="Alert Me When Stock Below" 
          value={lowStockThreshold} 
          onChange={setLowStockThreshold} 
        />

        <div className="mt-8">
          <AccessibleButton onClick={handleSave} fullWidth disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Medication'}
          </AccessibleButton>
        </div>
      </div>
    </div>
  );
};