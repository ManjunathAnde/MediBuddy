import React, { useState, useEffect } from 'react';
import { User as UserIcon, Phone, Mail, Stethoscope, Store, Save, ArrowLeft, Camera, Loader2 } from 'lucide-react';
import { AccessibleInput } from './ui/AccessibleInput';
import { AccessibleButton } from './ui/AccessibleButton';
import { UserProfile, DoctorInfo, PharmacistInfo } from '../types';
import { db, auth } from '../firebase';

interface ProfileScreenProps {
  onBack: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBack }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  // Personal Info
  const [name, setName] = useState(auth.currentUser?.displayName || '');
  const [email] = useState(auth.currentUser?.email || '');
  
  // Doctor Info
  const [doctorName, setDoctorName] = useState('');
  const [doctorEmail, setDoctorEmail] = useState('');
  const [doctorPhone, setDoctorPhone] = useState('');
  const [doctorSpecialty, setDoctorSpecialty] = useState('');

  // Pharmacist Info
  const [pharmName, setPharmName] = useState(''); // Pharmacist Name
  const [pharmEmail, setPharmEmail] = useState('');
  const [pharmacyName, setPharmacyName] = useState('');
  const [pharmPhone, setPharmPhone] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!auth.currentUser) return;
      try {
        const docRef = db.collection("users").doc(auth.currentUser.uid);
        const docSnap = await docRef.get();
        
        if (docSnap.exists) {
          const data = docSnap.data() as UserProfile;
          if (data.doctorInfo) {
            setDoctorName(data.doctorInfo.name || '');
            setDoctorEmail(data.doctorInfo.email || '');
            setDoctorPhone(data.doctorInfo.phone || '');
            setDoctorSpecialty(data.doctorInfo.specialty || '');
          }
          if (data.pharmacistInfo) {
            setPharmName(data.pharmacistInfo.name || '');
            setPharmEmail(data.pharmacistInfo.email || '');
            setPharmacyName(data.pharmacistInfo.pharmacyName || '');
            setPharmPhone(data.pharmacistInfo.phone || '');
          }
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setIsLoading(true);
    setSuccessMsg('');

    try {
      // Update Auth Profile
      if (name !== auth.currentUser.displayName) {
        await auth.currentUser.updateProfile({ displayName: name });
      }

      // Prepare Firestore Data - Nested Maps
      const doctorInfo: DoctorInfo = {
        name: doctorName,
        email: doctorEmail,
        phone: doctorPhone,
        specialty: doctorSpecialty
      };

      const pharmacistInfo: PharmacistInfo = {
        name: pharmName,
        email: pharmEmail,
        pharmacyName: pharmacyName,
        phone: pharmPhone
      };

      // Merge with existing user doc
      await db.collection("users").doc(auth.currentUser.uid).set({
        doctorInfo: doctorInfo,
        pharmacistInfo: pharmacistInfo,
        updatedAt: Date.now() // Optional tracking
      }, { merge: true });

      setSuccessMsg('Profile saved successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error("Error saving profile:", error);
      setSuccessMsg('Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E6F5F3] via-[#F2FAF9] to-white pb-24">
      {/* Header */}
      <div className="bg-white px-6 py-6 shadow-sm sticky top-0 z-10 flex items-center gap-4">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:text-warmGray rounded-full hover:bg-gray-100">
          <ArrowLeft size={32} />
        </button>
        <h1 className="text-3xl font-bold text-warmGray">Profile Settings</h1>
      </div>

      <div className="p-6 max-w-2xl mx-auto space-y-8">
        
        {/* Personal Info */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-warmGray mb-6 flex items-center gap-2">
            <UserIcon className="text-gentleGreen" /> Personal Info
          </h2>
          
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center border-4 border-white shadow-lg relative">
              {auth.currentUser?.photoURL ? (
                 <img src={auth.currentUser.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
              ) : (
                 <UserIcon size={40} className="text-gray-400" />
              )}
              <button className="absolute bottom-0 right-0 bg-gentleGreen p-2 rounded-full text-white shadow-sm">
                <Camera size={16} />
              </button>
            </div>
          </div>

          <AccessibleInput
            id="myName"
            label="My Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          
          <div className="opacity-60 pointer-events-none">
            <AccessibleInput
                id="myEmail"
                label="My Email"
                type="text"
                value={email}
                onChange={() => {}}
            />
          </div>
        </section>

        {/* Doctor Info */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border-l-8 border-blue-400">
          <h2 className="text-2xl font-bold text-warmGray mb-6 flex items-center gap-2">
            <Stethoscope className="text-blue-500" /> Your Doctor
          </h2>

          <AccessibleInput
            id="docName"
            label="Doctor's Name"
            type="text"
            value={doctorName}
            onChange={(e) => setDoctorName(e.target.value)}
            placeholder="e.g. Dr. Smith"
          />

          <AccessibleInput
            id="docSpecialty"
            label="Specialty (Optional)"
            type="text"
            value={doctorSpecialty}
            onChange={(e) => setDoctorSpecialty(e.target.value)}
            placeholder="e.g. Cardiologist"
          />

          <AccessibleInput
            id="docPhone"
            label="Doctor's Phone"
            type="text"
            value={doctorPhone}
            onChange={(e) => setDoctorPhone(e.target.value)}
            icon={Phone}
          />

          <AccessibleInput
            id="docEmail"
            label="Doctor's Email"
            type="email"
            value={doctorEmail}
            onChange={(e) => setDoctorEmail(e.target.value)}
            icon={Mail}
          />
        </section>

        {/* Pharmacist Info */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border-l-8 border-orange-400">
          <h2 className="text-2xl font-bold text-warmGray mb-6 flex items-center gap-2">
            <Store className="text-orange-500" /> Your Pharmacist
          </h2>

          <AccessibleInput
            id="pharmName"
            label="Pharmacist's Name"
            type="text"
            value={pharmName}
            onChange={(e) => setPharmName(e.target.value)}
            placeholder="e.g. Jane Doe"
          />

          <AccessibleInput
            id="pharmacyName"
            label="Pharmacy Name"
            type="text"
            value={pharmacyName}
            onChange={(e) => setPharmacyName(e.target.value)}
            placeholder="e.g. CVS on Main St"
          />

           <AccessibleInput
            id="pharmPhone"
            label="Pharmacy Phone"
            type="text"
            value={pharmPhone}
            onChange={(e) => setPharmPhone(e.target.value)}
            icon={Phone}
          />

          <AccessibleInput
            id="pharmEmail"
            label="Pharmacist's Email"
            type="email"
            value={pharmEmail}
            onChange={(e) => setPharmEmail(e.target.value)}
            icon={Mail}
          />
        </section>

        <div className="pt-4">
            {successMsg && (
                <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-lg text-lg font-bold text-center animate-in fade-in">
                    {successMsg}
                </div>
            )}
            
            <AccessibleButton onClick={handleSave} fullWidth disabled={isLoading}>
                {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                        <Loader2 className="animate-spin" /> Saving...
                    </div>
                ) : 'Save Profile'}
            </AccessibleButton>
        </div>

      </div>
    </div>
  );
};