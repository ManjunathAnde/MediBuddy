import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { db, auth } from '../firebase';

export const CalendarScreen: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthlyStats, setMonthlyStats] = useState<Record<number, 'full' | 'partial' | 'missed' | 'future'>>({});
  const [isLoading, setIsLoading] = useState(false);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    fetchMonthData();
  }, [currentDate]);

  const fetchMonthData = async () => {
    if (!auth.currentUser) return;
    setIsLoading(true);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Create date strings for query range
    // Padded month/day
    const startStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    // End date calculation
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const endStr = `${year}-${String(month + 1).padStart(2, '0')}-${lastDayOfMonth}`;

    try {
        // 1. Get logs for this month
        const logsRef = db.collection("users").doc(auth.currentUser.uid).collection("medicationLogs");
        const qLogs = logsRef
            .where("date", ">=", startStr)
            .where("date", "<=", endStr);
            
        const logsSnap = await qLogs.get();
        
        const logsByDate: Record<string, number> = {}; // Count taken
        logsSnap.forEach(doc => {
            const data = doc.data();
            if (data.taken) {
                logsByDate[data.date] = (logsByDate[data.date] || 0) + 1;
            }
        });

        // 2. Get active medications to know how many *should* be taken
        const medsRef = db.collection("users").doc(auth.currentUser.uid).collection("medications");
        const medsSnap = await medsRef.get();
        let dailyTotalExpected = 0;
        
        // Count total doses per day across all meds
        medsSnap.forEach(doc => {
            const m = doc.data();
            if (m.times && Array.isArray(m.times)) {
                dailyTotalExpected += m.times.length;
            }
        });

        // 3. Build Stats
        const stats: Record<number, 'full' | 'partial' | 'missed' | 'future'> = {};
        const todayStr = new Date().toISOString().split('T')[0];

        for (let i = 1; i <= lastDayOfMonth; i++) {
            const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            
            if (dayStr > todayStr) {
                stats[i] = 'future';
            } else {
                const taken = logsByDate[dayStr] || 0;
                if (taken === 0) {
                    stats[i] = 'missed'; // Or 'none' if we prefer
                } else if (taken >= dailyTotalExpected && dailyTotalExpected > 0) {
                    stats[i] = 'full';
                } else {
                    stats[i] = 'partial';
                }
            }
        }
        setMonthlyStats(stats);

    } catch (error) {
        console.error("Error fetching calendar data:", error);
    } finally {
        setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'full': return 'bg-gentleGreen';
      case 'partial': return 'bg-yellow-400';
      case 'missed': return 'bg-alertRed';
      default: return 'bg-gray-200';
    }
  };

  const changeMonth = (delta: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E6F5F3] via-[#F2FAF9] to-white pb-24">
      <div className="bg-white px-6 py-6 shadow-sm">
        <h1 className="text-3xl font-bold text-warmGray">My Calendar</h1>
        
        <div className="flex items-center justify-between mt-6 mb-2">
          <button onClick={() => changeMonth(-1)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
            <ChevronLeft size={28} />
          </button>
          <span className="text-2xl font-bold text-warmGray">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={() => changeMonth(1)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
            <ChevronRight size={28} />
          </button>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto">
        {/* Calendar Grid */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="grid grid-cols-7 mb-4">
            {days.map(d => (
              <div key={d} className="text-center font-bold text-gray-400 uppercase text-sm">
                {d}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-y-6 gap-x-2">
            {/* Empty slots for start of month offset */}
            {Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} />
            ))}

            {Object.keys(monthlyStats).map((day) => {
                const d = parseInt(day);
                return (
                    <div key={d} className="flex flex-col items-center gap-1">
                        <span className={`text-lg font-medium text-warmGray`}>
                        {d}
                        </span>
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(monthlyStats[d])}`} />
                    </div>
                );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-8">
           <div className="flex items-center gap-2">
             <div className="w-4 h-4 rounded-full bg-gentleGreen" />
             <span className="text-gray-600 font-medium">All Taken</span>
           </div>
           <div className="flex items-center gap-2">
             <div className="w-4 h-4 rounded-full bg-yellow-400" />
             <span className="text-gray-600 font-medium">Some</span>
           </div>
           <div className="flex items-center gap-2">
             <div className="w-4 h-4 rounded-full bg-alertRed" />
             <span className="text-gray-600 font-medium">Missed</span>
           </div>
        </div>
      </div>
    </div>
  );
};