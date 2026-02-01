import React, { useState } from 'react';
import { Plus, Check, Info, Sun, Sunset, Moon, Coffee, LogOut, Settings, AlertTriangle, X, Pill } from 'lucide-react';
import { Medication, TimeOfDay, Logbook, TimeSlot } from '../types';

interface HomeScreenProps {
  userName: string;
  medications: Medication[];
  logs: Logbook;
  onToggleMed: (medId: string, timeSlot: TimeOfDay) => void;
  onAddMed: () => void;
  onLogout: () => void;
  onProfileClick: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  userName,
  medications,
  logs,
  onToggleMed,
  onAddMed,
  onLogout,
  onProfileClick
}) => {
  const [isAlertDismissed, setIsAlertDismissed] = useState(false);

  // Helper to get local date string YYYY-MM-DD
  const getLocalDateStr = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().split('T')[0];
  };

  // Helper to check if a specific med slot is taken today (in local time)
  const isTaken = (medId: string, slotId: string) => {
    const today = getLocalDateStr();
    return !!logs[`${medId}_${slotId}_${today}`];
  };

  // Identify low stock medications
  const lowStockMeds = medications.filter(med => med.stock <= med.lowStockThreshold);

  const timeSections: { id: TimeOfDay; label: string; icon: any; color: string }[] = [
    { id: 'morning', label: 'Morning', icon: Sun, color: 'text-orange-500' },
    { id: 'afternoon', label: 'Afternoon', icon: Sun, color: 'text-yellow-600' },
    { id: 'evening', label: 'Evening', icon: Sunset, color: 'text-indigo-500' },
    { id: 'night', label: 'Night', icon: Moon, color: 'text-purple-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E6F5F3] via-[#F2FAF9] to-white pb-24">
      {/* Header */}
      <div className="bg-white px-6 py-8 shadow-sm flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-warmGray">Hello, {userName}</h1>
          <p className="text-xl text-gray-600 mt-2">Let's take care of today</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onProfileClick}
            className="w-16 h-16 bg-gray-100 text-gray-600 rounded-2xl flex items-center justify-center hover:bg-gray-200 transition-all"
            aria-label="Profile Settings"
          >
            <Settings size={28} />
          </button>
          <button 
            onClick={onAddMed}
            className="w-16 h-16 bg-gentleGreen rounded-2xl shadow-lg flex items-center justify-center text-white hover:bg-[#43A047] active:scale-95 transition-all"
            aria-label="Add Medication"
          >
            <Plus size={40} />
          </button>
        </div>
      </div>

      <div className="p-6 max-w-3xl mx-auto space-y-10">
        
        {/* Low Stock Alert Banner */}
        {lowStockMeds.length > 0 && !isAlertDismissed && (
          <div className="bg-[#FFF4E6] border-l-8 border-orange-400 rounded-2xl p-6 shadow-sm relative animate-in slide-in-from-top-4 duration-500">
            <button
                onClick={() => setIsAlertDismissed(true)}
                className="absolute top-4 right-4 p-2 -mr-2 -mt-2 text-orange-400 hover:text-orange-600 bg-white/50 rounded-full"
                aria-label="Dismiss alert"
            >
                <X size={24} />
            </button>
            <div className="flex items-center gap-3 mb-6">
                <AlertTriangle className="text-orange-500 flex-shrink-0" size={32} />
                <h2 className="text-2xl font-bold text-warmGray">Time to Refill</h2>
            </div>
            <div className="space-y-4">
                {lowStockMeds.map(med => (
                    <div key={med.id} className="flex items-start gap-4 p-3 bg-white/60 rounded-xl">
                         <div className="bg-orange-100 p-2 rounded-full mt-1 flex-shrink-0">
                            <Pill size={20} className="text-orange-500" />
                         </div>
                         <div>
                            <p className="text-xl font-bold text-warmGray">
                                {med.name} <span className="text-gray-600 font-medium">- Only {med.stock} pills left</span>
                            </p>
                            <p className="text-lg text-gray-600">Refill soon to avoid running out.</p>
                         </div>
                    </div>
                ))}
            </div>
          </div>
        )}

        {timeSections.map((section) => {
          // Filter meds that have this time slot enabled
          const sectionMeds = medications.filter(med => 
            med.timeSlots.find(slot => slot.id === section.id && slot.enabled)
          );

          if (sectionMeds.length === 0) return null;

          // Check completion
          const allTaken = sectionMeds.every(med => isTaken(med.id, section.id));

          return (
            <section key={section.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-4">
                <section.icon className={section.color} size={32} />
                <h2 className="text-2xl font-bold text-warmGray capitalize">{section.label} Medications</h2>
              </div>

              <div className="space-y-4">
                {sectionMeds.map(med => {
                  const slot = med.timeSlots.find(s => s.id === section.id)!;
                  const taken = isTaken(med.id, section.id);
                  const isLowStock = med.stock <= med.lowStockThreshold;

                  return (
                    <div 
                      key={`${med.id}-${section.id}`}
                      onClick={() => onToggleMed(med.id, section.id)}
                      className={`
                        relative p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer shadow-sm group
                        ${taken 
                          ? 'bg-[#F1F8F4] border-gentleGreen' 
                          : 'bg-white border-white hover:border-blue-200'}
                      `}
                    >
                      <div className="flex items-start gap-5">
                        {/* Large Checkbox */}
                        <div className={`
                          w-14 h-14 rounded-xl border-4 flex-shrink-0 flex items-center justify-center transition-all duration-300 shadow-sm
                          ${taken 
                            ? 'bg-gentleGreen border-gentleGreen' 
                            : 'bg-white border-gray-400 group-hover:border-gentleGreen'}
                        `}>
                          {taken && <Check size={36} className="text-white" strokeWidth={4} />}
                        </div>

                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h3 className={`text-2xl font-bold ${taken ? 'text-gray-600' : 'text-warmGray'}`}>
                              {med.name}
                            </h3>
                            <span className="text-lg font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">
                              {slot.customTime || slot.defaultTime}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1">
                            <p className="text-xl text-gray-600">{med.dosage}</p>
                            
                            {/* Low Stock Badge on Card */}
                            {!taken && isLowStock && (
                              <div className="flex items-center gap-1.5 bg-orange-100 text-orange-700 px-3 py-1 rounded-lg">
                                <AlertTriangle size={16} />
                                <span className="font-bold text-sm">Low Stock: {med.stock}</span>
                              </div>
                            )}
                          </div>
                          
                          {med.specialInstructions && (
                            <p className="text-lg text-blue-600 mt-2 font-medium flex items-center gap-2">
                              <Info size={20} />
                              {med.specialInstructions}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {allTaken && (
                <div className="mt-4 bg-green-100 border-l-4 border-gentleGreen p-4 rounded-r-lg flex items-center gap-3 animate-in zoom-in duration-300">
                   <div className="bg-gentleGreen rounded-full p-1">
                     <Check size={20} className="text-white" />
                   </div>
                   <p className="text-xl font-bold text-green-800">
                     Great job! All {section.label} medications taken.
                   </p>
                </div>
              )}
            </section>
          );
        })}

        {medications.length === 0 && (
          <div className="text-center py-20 px-4">
             <div className="bg-white w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-6 shadow-md">
               <Coffee size={48} className="text-gray-300" />
             </div>
             <h3 className="text-2xl font-bold text-gray-400">No medications yet</h3>
             <p className="text-xl text-gray-400 mt-2">Tap the + button to add your first one.</p>
          </div>
        )}
        
        {/* Logout at bottom as secondary option */}
        <div className="mt-12 text-center">
            <button 
                onClick={onLogout}
                className="text-gray-500 font-bold hover:text-alertRed flex items-center justify-center gap-2 mx-auto"
            >
                <LogOut size={20} />
                Log Out
            </button>
        </div>
      </div>
    </div>
  );
};