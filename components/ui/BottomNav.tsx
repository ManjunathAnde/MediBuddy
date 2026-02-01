import React from 'react';
import { Home, Pill, Calendar, BookOpen, FileText } from 'lucide-react';
import { ScreenView } from '../../types';

interface BottomNavProps {
  currentView: ScreenView;
  onChange: (view: ScreenView) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onChange }) => {
  const navItems: { id: ScreenView; label: string; icon: React.ElementType }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'medications', label: 'Meds', icon: Pill },
    { id: 'prescriptions', label: 'Rx', icon: FileText },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'learn', label: 'Learn', icon: BookOpen },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe pt-2 px-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
      <div className="flex justify-between items-center max-w-lg mx-auto h-[80px]">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className="flex flex-col items-center justify-center w-full h-full space-y-1"
            >
              <div
                className={`p-2 rounded-xl transition-all duration-200 ${
                  isActive ? 'bg-blue-50 text-gentleGreen' : 'text-gray-400'
                }`}
              >
                <item.icon size={28} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span
                className={`text-xs md:text-sm font-semibold ${
                  isActive ? 'text-gentleGreen' : 'text-gray-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};