import React, { useState } from 'react';
import { Sun, Pill, Calendar, Phone } from 'lucide-react';
import { AccessibleButton } from './ui/AccessibleButton';

interface DashboardProps {
  userName: string;
  onLogout: () => void;
}

export const DashboardPlaceholder: React.FC<DashboardProps> = ({ userName, onLogout }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E6F5F3] via-[#F2FAF9] to-white">
      {/* Top Bar */}
      <div className="bg-white shadow-sm p-6 flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold text-warmGray">Hello, {userName}</h1>
           <p className="text-xl text-gray-600 mt-1">It's a beautiful day today.</p>
        </div>
        <div className="w-auto">
          <AccessibleButton onClick={onLogout} variant="secondary">
            Log Out
          </AccessibleButton>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-8 mt-4">
        
        {/* Today's Schedule Card */}
        <section className="bg-white rounded-2xl shadow-lg p-8 border-l-8 border-gentleGreen">
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-3xl font-bold text-warmGray flex items-center gap-3">
              <Sun className="text-orange-400" size={32} />
              Morning Medications
            </h2>
            <span className="text-xl font-bold text-gentleGreen bg-green-50 px-4 py-2 rounded-lg">
              8:00 AM
            </span>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-xl border-2 border-transparent hover:border-blue-200 transition-colors cursor-pointer">
              <div className="bg-blue-100 p-4 rounded-full">
                <Pill size={32} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-warmGray">Lisinopril</h3>
                <p className="text-xl text-gray-600">10mg - Take with food</p>
              </div>
              <div className="ml-auto">
                 <div className="w-10 h-10 rounded-full border-4 border-gray-300"></div>
              </div>
            </div>

            <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-xl border-2 border-transparent hover:border-blue-200 transition-colors cursor-pointer">
              <div className="bg-yellow-100 p-4 rounded-full">
                <Pill size={32} className="text-yellow-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-warmGray">Vitamin D</h3>
                <p className="text-xl text-gray-600">1000 IU</p>
              </div>
              <div className="ml-auto">
                 <div className="w-10 h-10 rounded-full border-4 border-gray-300"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button className="bg-white p-8 rounded-2xl shadow-md flex items-center gap-4 hover:shadow-lg transition-shadow border-2 border-transparent focus:border-blue-400 focus:outline-none">
            <Calendar size={40} className="text-blue-500" />
            <span className="text-2xl font-bold text-warmGray">My Calendar</span>
          </button>
          
          <button className="bg-white p-8 rounded-2xl shadow-md flex items-center gap-4 hover:shadow-lg transition-shadow border-2 border-transparent focus:border-blue-400 focus:outline-none">
            <Phone size={40} className="text-gentleGreen" />
            <span className="text-2xl font-bold text-warmGray">Doctor Contacts</span>
          </button>
        </div>

      </div>
    </div>
  );
};