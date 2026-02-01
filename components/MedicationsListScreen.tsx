import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Sun, Moon, Sunset, Pill } from 'lucide-react';
import { Medication } from '../types';

interface MedicationsListScreenProps {
  medications: Medication[];
  onAdd: () => void;
  onEdit: (med: Medication) => void;
  onDelete: (id: string) => void;
}

export const MedicationsListScreen: React.FC<MedicationsListScreenProps> = ({
  medications,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const handleDeleteConfirm = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E6F5F3] via-[#F2FAF9] to-white pb-24">
      <div className="bg-white px-6 py-6 shadow-sm flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-3xl font-bold text-warmGray">My Medications</h1>
        <button 
          onClick={onAdd}
          className="bg-gray-100 p-3 rounded-full hover:bg-gray-200 text-warmGray"
          aria-label="Add new medication"
        >
          <Plus size={32} />
        </button>
      </div>

      <div className="p-6 space-y-6 max-w-3xl mx-auto">
        {medications.map((med) => (
          <div key={med.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-bold text-warmGray">{med.name}</h3>
                <p className="text-xl text-gray-500 font-medium">{med.dosage}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => onEdit(med)}
                  className="p-3 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                  aria-label={`Edit ${med.name}`}
                >
                  <Edit2 size={24} />
                </button>
                <button 
                  onClick={() => setDeleteId(med.id)}
                  className="p-3 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                  aria-label={`Delete ${med.name}`}
                >
                  <Trash2 size={24} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {med.timeSlots.filter(t => t.enabled).map(slot => (
                <span key={slot.id} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm font-semibold capitalize flex items-center gap-1">
                  {slot.id === 'morning' && <Sun size={14} />}
                  {slot.id === 'night' && <Moon size={14} />}
                  {slot.label}
                </span>
              ))}
            </div>

            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
              <span className="text-lg font-medium text-gray-600">Current Stock</span>
              <span className={`text-xl font-bold ${med.stock <= med.lowStockThreshold ? 'text-red-600' : 'text-gentleGreen'}`}>
                {med.stock} pills left
              </span>
            </div>
          </div>
        ))}
        
        {medications.length === 0 && (
           <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
             <div className="bg-white w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-md">
               <Pill size={48} className="text-gray-300" />
             </div>
             <h3 className="text-2xl font-bold text-warmGray">No medications yet</h3>
             <p className="text-xl text-gray-500 mt-2 mb-8 max-w-xs">
               Tap the button below to add your first medication.
             </p>
             <button 
               onClick={onAdd}
               className="w-full max-w-xs h-[64px] bg-gentleGreen text-white text-xl font-bold rounded-xl hover:bg-[#43A047] shadow-md flex items-center justify-center gap-3 active:scale-95 transition-transform"
             >
               <Plus size={28} />
               Add Medication
             </button>
           </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center">
            <h3 className="text-2xl font-bold text-warmGray mb-4">Delete Medication?</h3>
            <p className="text-xl text-gray-600 mb-8">
              Are you sure you want to remove this medication from your list?
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setDeleteId(null)}
                className="flex-1 h-[56px] bg-gray-100 text-gray-700 text-xl font-bold rounded-xl hover:bg-gray-200"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteConfirm}
                className="flex-1 h-[56px] bg-alertRed text-white text-xl font-bold rounded-xl hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};