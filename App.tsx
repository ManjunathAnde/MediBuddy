import React, { useState, useEffect } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { HomeScreen } from './components/HomeScreen';
import { MedicationsListScreen } from './components/MedicationsListScreen';
import { CalendarScreen } from './components/CalendarScreen';
import { AddMedicationScreen } from './components/AddMedicationScreen';
import { KnowYourMedsScreen } from './components/KnowYourMedsScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { PrescriptionsScreen } from './components/PrescriptionsScreen';
import { BottomNav } from './components/ui/BottomNav';
import { Medication, Logbook, ScreenView, TimeOfDay, TimeSlot } from './types';
import firebase, { auth, db } from './firebase';

// Helper to get local date string YYYY-MM-DD
// precise to the user's current timezone
const getLocalDateStr = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().split('T')[0];
};

function App() {
  const [currentUser, setCurrentUser] = useState<firebase.User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  
  // Track the current local date to handle midnight rollovers
  const [todayDate, setTodayDate] = useState(getLocalDateStr());

  // Navigation State
  const [currentView, setCurrentView] = useState<ScreenView>('home');
  const [isAddingMed, setIsAddingMed] = useState(false);
  const [editingMedId, setEditingMedId] = useState<string | null>(null);

  // Data State
  const [medications, setMedications] = useState<Medication[]>([]);
  const [logs, setLogs] = useState<Logbook>({});

  // Auth Listener
  useEffect(() => {
    // Modular auth listener
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        if (!user.emailVerified) {
          await auth.signOut();
          setCurrentUser(null);
        } else {
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
      }
      setIsAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  // Date Watcher: Checks every minute if the day has changed
  useEffect(() => {
    const interval = setInterval(() => {
      const current = getLocalDateStr();
      if (current !== todayDate) {
        setTodayDate(current);
      }
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [todayDate]);

  // Data Listener (Meds & Today's Logs)
  useEffect(() => {
    if (!currentUser) {
        setMedications([]);
        setLogs({});
        return;
    }

    // 1. Fetch Medications
    const medsRef = db.collection("users").doc(currentUser.uid).collection("medications");
    const unsubMeds = medsRef.onSnapshot((snapshot) => {
        const fetchedMeds = snapshot.docs.map(doc => {
            const data = doc.data();
            // Map Firestore data to UI Medication type
            return {
                id: doc.id,
                name: data.name,
                dosage: data.dosage,
                times: data.times || [],
                specialInstructions: data.specialInstructions,
                stock: data.stockcount,
                lowStockThreshold: data.alertThreshhold,
                prescribedBy: data.prescribedBy,
                // Generate timeSlots helper for UI
                timeSlots: generateTimeSlotsFromTimes(data.times || [])
            } as Medication;
        });
        setMedications(fetchedMeds);
    });

    // 2. Fetch Today's Logs (Reactive to todayDate changes)
    const logsRef = db.collection("users").doc(currentUser.uid).collection("medicationLogs");
    const qLogs = logsRef.where("date", "==", todayDate);
    
    const unsubLogs = qLogs.onSnapshot((snapshot) => {
        const newLogbook: Logbook = {};
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            // Determine time slot bucket based on scheduled time
            // We use the timestamp in 'scheduledTime' to find the slot
            // E.g. "2026-01-26T09:00:00" -> extract 09:00 -> find if it matches bucket
            if (data.taken) {
                const time = data.scheduledTime.split('T')[1].substring(0, 5); // "09:00"
                const bucket = getTimeBucket(time);
                if (bucket) {
                   const key = `${data.medicationID}_${bucket}_${data.date}`;
                   newLogbook[key] = doc.id; // Store the document ID
                }
            }
        });
        setLogs(newLogbook);
    });

    return () => {
        unsubMeds();
        unsubLogs();
    };
  }, [currentUser, todayDate]); // Re-run if user OR date changes

  // Helper: Convert raw times strings ["09:00"] to TimeSlots for UI
  const generateTimeSlotsFromTimes = (times: string[]): TimeSlot[] => {
      return [
        { id: 'morning', label: 'Morning', defaultTime: '08:00', enabled: hasTimeInBucket(times, 'morning'), customTime: getTimeInBucket(times, 'morning') },
        { id: 'afternoon', label: 'Afternoon', defaultTime: '14:00', enabled: hasTimeInBucket(times, 'afternoon'), customTime: getTimeInBucket(times, 'afternoon') },
        { id: 'evening', label: 'Evening', defaultTime: '18:00', enabled: hasTimeInBucket(times, 'evening'), customTime: getTimeInBucket(times, 'evening') },
        { id: 'night', label: 'Night', defaultTime: '22:00', enabled: hasTimeInBucket(times, 'night'), customTime: getTimeInBucket(times, 'night') },
      ];
  };

  const getTimeBucket = (time: string): TimeOfDay | null => {
      const h = parseInt(time.split(':')[0]);
      if (h >= 4 && h < 12) return 'morning';
      if (h >= 12 && h < 17) return 'afternoon';
      if (h >= 17 && h < 21) return 'evening';
      if (h >= 21 || h < 4) return 'night';
      return null;
  };

  const hasTimeInBucket = (times: string[], bucket: TimeOfDay): boolean => {
      return !!getTimeInBucket(times, bucket);
  };

  const getTimeInBucket = (times: string[], bucket: TimeOfDay): string | undefined => {
      return times.find(t => getTimeBucket(t) === bucket);
  };

  const handleLogout = async () => {
    await auth.signOut();
  };

  // CRUD Operations
  const handleSaveMed = () => {
    // Logic handled inside AddMedicationScreen now
    setIsAddingMed(false);
    setEditingMedId(null);
  };

  const handleDeleteMed = async (id: string) => {
    if (!currentUser) return;
    try {
        await db.collection("users").doc(currentUser.uid).collection("medications").doc(id).delete();
    } catch (e) {
        console.error("Error deleting med:", e);
    }
  };

  const handleToggleMed = async (medId: string, timeSlot: TimeOfDay) => {
    if (!currentUser) return;
    const med = medications.find(m => m.id === medId);
    if (!med) return;

    // Find the specific time string for this slot
    // We assume there's only one per bucket for this UI design
    const scheduledTimeStr = med.times.find(t => getTimeBucket(t) === timeSlot);
    if (!scheduledTimeStr) return;

    // Use LOCAL date string
    const localDateStr = getLocalDateStr();
    const fullScheduledTime = `${localDateStr}T${scheduledTimeStr}:00`;
    const key = `${medId}_${timeSlot}_${localDateStr}`;
    
    // Check if already taken (if exists in local logs, it returns the doc ID)
    const existingLogId = logs[key];

    if (existingLogId) {
        // --- UNCHECK / UNDO LOGIC ---
        try {
            // 1. Delete Log Entry
            await db.collection("users").doc(currentUser.uid).collection("medicationLogs").doc(existingLogId).delete();

            // 2. Increment Stock Back (Undo decrement)
            const medRef = db.collection("users").doc(currentUser.uid).collection("medications").doc(medId);
            await medRef.update({
                stockcount: med.stock + 1
            });
        } catch (e) {
            console.error("Error unchecking med:", e);
        }
    } else {
        // --- CHECK / TAKE LOGIC ---
        try {
            // 1. Create Log Entry
            await db.collection("users").doc(currentUser.uid).collection("medicationLogs").add({
                medicationID: medId,
                medicationName: med.name,
                scheduledTime: fullScheduledTime,
                actualTime: new Date().toISOString(), // Actual time stays UTC for audit
                taken: true,
                skipped: false,
                date: localDateStr, // Use local date for grouping
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            // 2. Decrement Stock
            const medRef = db.collection("users").doc(currentUser.uid).collection("medications").doc(medId);
            await medRef.update({
                stockcount: Math.max(0, med.stock - 1)
            });

        } catch (e) {
            console.error("Error logging med:", e);
        }
    }
  };

  // Render logic
  const renderContent = () => {
    if (isAddingMed) {
      const medToEdit = editingMedId ? medications.find(m => m.id === editingMedId) : undefined;
      return (
        <AddMedicationScreen 
          onSave={handleSaveMed} 
          onCancel={() => { setIsAddingMed(false); setEditingMedId(null); }}
          initialData={medToEdit}
        />
      );
    }

    switch (currentView) {
      case 'home':
        return (
          <HomeScreen 
            userName={currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Friend'}
            medications={medications}
            logs={logs}
            onToggleMed={handleToggleMed}
            onAddMed={() => setIsAddingMed(true)}
            onLogout={handleLogout}
            onProfileClick={() => setCurrentView('profile')}
          />
        );
      case 'medications':
        return (
          <MedicationsListScreen 
            medications={medications}
            onAdd={() => setIsAddingMed(true)}
            onEdit={(med) => {
              setEditingMedId(med.id);
              setIsAddingMed(true);
            }}
            onDelete={handleDeleteMed}
          />
        );
      case 'prescriptions':
        return <PrescriptionsScreen />;
      case 'calendar':
        return <CalendarScreen />;
      case 'learn':
        return (
          <KnowYourMedsScreen 
            medications={medications} 
            onAddMed={() => setIsAddingMed(true)}
          />
        );
      case 'profile':
        return (
          <ProfileScreen onBack={() => setCurrentView('home')} />
        );
      default:
        return null;
    }
  };

  if (isAuthChecking) {
    return <div className="min-h-screen bg-gradient-to-b from-[#E6F5F3] via-[#F2FAF9] to-white flex items-center justify-center text-xl text-warmGray">Loading...</div>;
  }

  if (!currentUser) {
    return <AuthScreen onLoginSuccess={() => {}} />;
  }

  return (
    <div className="antialiased text-warmGray min-h-screen bg-gradient-to-b from-[#E6F5F3] via-[#F2FAF9] to-white">
      {renderContent()}
      
      {!isAddingMed && currentView !== 'profile' && (
        <BottomNav 
          currentView={currentView} 
          onChange={setCurrentView} 
        />
      )}
    </div>
  );
}

export default App;