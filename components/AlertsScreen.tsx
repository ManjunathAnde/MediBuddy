import React, { useState } from 'react';
import { Bell, Check, Plus, AlertCircle } from 'lucide-react';
import { Medication } from '../types';

interface AlertsScreenProps {
  medications: Medication[];
  onRefill: (id: string, amount: number) => void;
}

export const AlertsScreen: React.FC<AlertsScreenProps> = ({ medications, onRefill }) => {
  const lowStockMeds = medications.filter(med => med.stock <= med.lowStockThreshold);
  const [refillingId, setRefillingId] = useState<string | null>(null);
  const [refillAmount, setRefillAmount] = useState(30);

  const handleRefillSubmit = () => {
    if (refillingId) {
      onRefill(refillingId, refillAmount);
      setRefillingId(null);
      setRefillAmount(30);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E6F5F3] via-[#F2FAF9] to-white pb-24">
      <div className="bg-white px-6 py-6 shadow-sm flex items-center gap-3">
        <Bell className="text-warmGray" size={32} />
        <h1 className="text-3xl font-bold text-warmGray">Stock Alerts</h1>
      </div>

      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {lowStockMeds.map(med => (
          <div key={med.id} className="bg-white rounded-2xl p-6 shadow-md border-l-8 border-alertRed animate-in slide-in-from-bottom-2">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold text-warmGray">{med.name}</h3>
              <div className="flex items-center gap-2 text-alertRed bg-red-50 px-3 py-1 rounded-lg">
                <AlertCircle size={20} />
                <span className="font-bold">Low Stock</span>
              </div>
            </div>
            
            <p className="text-xl text-gray-700 mb-6">
              Only <span className="font-bold text-alertRed">{med.stock} pills</span> left.
              <br />
              <span className="text-base text-gray-500">Refill recommended soon.</span>
            </p>

            <button 
              onClick={() => setRefillingId(med.id)}
              className="w-full py-4 bg-gentleGreen text-white text-xl font-bold rounded-xl hover:bg-[#43A047] shadow-sm active:scale-[0.98] transition-transform"
            >
              Mark as Refilled
            </button>
          </div>
        ))}

        {lowStockMeds.length === 0 && (
          <div className="text-center py-20">
             <div className="bg-white w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-6 shadow-md">
               <Check size={48} className="text-gentleGreen" />
             </div>
             <h3 className="text-2xl font-bold text-warmGray">All Good!</h3>
             <p className="text-xl text-gray-500 mt-2">All your medications are well-stocked.</p>
          </div>
        )}
      </div>

      {/* Refill Modal */}
      {refillingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl p-8 shadow-2xl">
            <h3 className="text-2xl font-bold text-warmGray mb-6">Add Stock</h3>
            
            <div className="flex items-center justify-center gap-6 mb-8">
               <button onClick={() => setRefillAmount(Math.max(1, refillAmount - 10))} className="p-2 bg-gray-100 rounded-lg">
                  <span className="text-2xl font-bold">-10</span>
               </button>
               <span className="text-4xl font-bold text-gentleGreen w-[3ch] text-center">{refillAmount}</span>
               <button onClick={() => setRefillAmount(refillAmount + 10)} className="p-2 bg-gray-100 rounded-lg">
                  <span className="text-2xl font-bold">+10</span>
               </button>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setRefillingId(null)}
                className="flex-1 py-4 bg-gray-100 text-gray-700 text-xl font-bold rounded-xl"
              >
                Cancel
              </button>
              <button 
                onClick={handleRefillSubmit}
                className="flex-1 py-4 bg-gentleGreen text-white text-xl font-bold rounded-xl"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};