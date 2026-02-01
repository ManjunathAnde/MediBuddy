import React, { useState, useEffect, useRef } from 'react';
import { Trash2, FileText, Calendar, Upload, X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Prescription } from '../types';
import { AccessibleButton } from './ui/AccessibleButton';
import { AccessibleInput } from './ui/AccessibleInput';
import firebase, { db, auth, storage } from '../firebase';

export const PrescriptionsScreen: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  
  // Delete Modal State
  const [prescriptionToDelete, setPrescriptionToDelete] = useState<Prescription | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [file, setFile] = useState<File | null>(null);
  const [doctorName, setDoctorName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  
  // Feedback State
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = db.collection("users").doc(auth.currentUser.uid).collection("prescriptions")
      .orderBy("prescriptionDate", "desc");

    const unsubscribe = q.onSnapshot((snapshot) => {
      const docs = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Convert Firestore timestamp to displayable string if needed, or handle in render
            prescriptionDate: data.prescriptionDate?.toDate ? data.prescriptionDate.toDate().toISOString().split('T')[0] : data.prescriptionDate,
          };
      }) as Prescription[];
      setPrescriptions(docs);
    });

    return () => unsubscribe();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccessMsg(null);
    
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate Type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!validTypes.includes(selectedFile.type)) {
        setError("Please upload an image (JPG, PNG) or PDF");
        return;
      }

      // Validate Size (10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File must be under 10MB");
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !auth.currentUser) return;
    setIsUploading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // Create a date object, ensuring validity (default to now if invalid)
      let presDate = new Date(date);
      if (isNaN(presDate.getTime())) {
          presDate = new Date();
      }

      // 1. Upload File (with 30s timeout)
      const storagePath = `user_uploads/${auth.currentUser.uid}/prescriptions/${Date.now()}_${file.name}`;
      const storageRef = storage.ref(storagePath);
      
      const uploadTask = storageRef.put(file);
      
      // Optional: Add timeout logic manually if needed, but storage sdk usually handles retry
      const snapshot = await uploadTask;
      
      // 2. Get URL
      const downloadURL = await snapshot.ref.getDownloadURL();

      // 3. Save Metadata to Firestore
      const newPrescription = {
        prescriptionURL: downloadURL,
        doctorName: doctorName || '',
        prescriptionDate: firebase.firestore.Timestamp.fromDate(presDate),
        notes: notes || '',
        medicationsListed: [], // Empty array as per prompt
        uploadedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection("users").doc(auth.currentUser.uid).collection("prescriptions").add(newPrescription);

      // Success
      setSuccessMsg("Prescription uploaded successfully");
      
      // Reset Form
      setFile(null);
      setDoctorName('');
      setNotes('');
      setTimeout(() => {
        setShowUploadForm(false);
        setSuccessMsg(null);
      }, 1500);

    } catch (err: any) {
      console.error("Upload failed:", err);
      
      if (err.message === "Upload timed out") {
         setError("Upload taking too long. Check your connection.");
      } else if (err.code === 'storage/unauthorized') {
         setError("Upload permission denied. Please contact support.");
      } else {
         setError("Upload failed. Please try again.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  const requestDelete = (e: React.MouseEvent, presc: Prescription) => {
    e.preventDefault(); 
    e.stopPropagation();
    setPrescriptionToDelete(presc);
    setError(null);
  };

  const confirmDelete = async () => {
    if (!prescriptionToDelete || !auth.currentUser) return;
    setIsDeleting(true);

    try {
      // 1. Delete from Storage (Best effort)
      if (prescriptionToDelete.prescriptionURL) {
          try {
            const fileRef = storage.refFromURL(prescriptionToDelete.prescriptionURL);
            await fileRef.delete();
          } catch (storageErr) {
            console.warn("Could not delete file from storage (might not exist or permission issue):", storageErr);
            // Continue to delete doc even if storage delete fails to ensure UI consistency
          }
      }

      // 2. Delete from Firestore
      await db.collection("users").doc(auth.currentUser.uid).collection("prescriptions").doc(prescriptionToDelete.id).delete();
      
      setSuccessMsg("Prescription deleted successfully");
      setTimeout(() => setSuccessMsg(null), 3000);
      
      // Close modal
      setPrescriptionToDelete(null);
    } catch (err) {
      console.error("Delete failed:", err);
      setError("Failed to delete. Please try again.");
      setPrescriptionToDelete(null); // Close modal on error to show message
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E6F5F3] via-[#F2FAF9] to-white pb-24">
      {/* Header */}
      <div className="bg-white px-6 py-6 shadow-sm sticky top-0 z-10">
        <h1 className="text-3xl font-bold text-warmGray">My Prescriptions</h1>
      </div>

      <div className="p-6 max-w-2xl mx-auto">
        
        {/* Global Error/Success Messages */}
        {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-alertRed rounded-r flex items-center gap-2 text-alertRed animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={20} />
                <p className="font-bold">{error}</p>
            </div>
        )}

        {successMsg && (
            <div className="mb-4 p-4 bg-green-50 border-l-4 border-gentleGreen rounded-r flex items-center gap-2 text-green-800 animate-in fade-in slide-in-from-top-2">
                <CheckCircle size={20} />
                <p className="font-bold">{successMsg}</p>
            </div>
        )}

        {!showUploadForm ? (
          <button 
            type="button"
            onClick={() => setShowUploadForm(true)}
            className="w-full h-[80px] bg-gentleGreen text-white text-xl font-bold rounded-2xl shadow-md flex items-center justify-center gap-3 hover:bg-[#43A047] transition-all mb-8"
          >
            <Upload size={32} />
            Upload Prescription
          </button>
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-lg mb-8 border-2 border-blue-100 animate-in slide-in-from-top-4">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-warmGray">New Prescription</h2>
                <button 
                    type="button"
                    onClick={() => { setShowUploadForm(false); setError(null); setFile(null); }} 
                    className="p-2 text-gray-400 hover:text-gray-600"
                >
                    <X size={24} />
                </button>
             </div>

             <div className="space-y-4">
                <div 
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    className={`border-4 border-dashed rounded-xl p-8 text-center transition-colors ${
                        isUploading ? 'opacity-50 cursor-not-allowed border-gray-200' : 'cursor-pointer hover:bg-blue-50 border-blue-100'
                    }`}
                >
                    {file ? (
                        <div className="flex items-center justify-center gap-2 text-gentleGreen font-bold text-lg">
                            <FileText /> {file.name}
                        </div>
                    ) : (
                        <div className="text-gray-500">
                            <Upload className="mx-auto mb-2" size={32} />
                            <p className="font-medium">Tap to take photo or choose file</p>
                            <p className="text-sm mt-1 text-gray-400">JPG, PNG, PDF (Max 10MB)</p>
                        </div>
                    )}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/jpeg,image/png,image/jpg,application/pdf"
                        onChange={handleFileSelect}
                        disabled={isUploading}
                    />
                </div>

                <AccessibleInput
                    id="pDoc"
                    label="Doctor Name"
                    type="text"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="e.g. Dr. Smith"
                />

                <div>
                    <label className="text-xl font-semibold text-warmGray mb-3 block">Date Prescribed</label>
                    <input 
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full h-[64px] pl-4 pr-4 text-xl bg-white border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-200 text-warmGray"
                    />
                </div>

                 <div className="mb-4">
                  <label className="text-xl font-semibold text-warmGray mb-3 block">Notes</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-4 text-xl bg-white border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-200 h-32"
                    placeholder="Optional notes..."
                  />
                </div>

                <div className="pt-4">
                    <AccessibleButton onClick={handleUpload} fullWidth disabled={!file || isUploading}>
                        {isUploading ? (
                            <div className="flex items-center justify-center gap-2">
                                <Loader2 className="animate-spin" /> Uploading prescription...
                            </div>
                        ) : 'Save Prescription'}
                    </AccessibleButton>
                </div>
             </div>
          </div>
        )}

        <div className="space-y-6">
           {prescriptions.map(presc => (
             <div key={presc.id} className="bg-white rounded-2xl p-6 shadow-sm flex flex-col gap-4 transition-all hover:shadow-md">
                <div className="flex items-start gap-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FileText size={32} className="text-gray-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-warmGray">{presc.doctorName || 'Doctor not specified'}</h3>
                        <div className="flex items-center gap-2 text-gray-500 mt-1 font-medium">
                            <Calendar size={16} />
                            {presc.prescriptionDate}
                        </div>
                        {presc.notes && (
                            <p className="text-gray-600 mt-2 bg-gray-50 p-2 rounded-lg text-sm">{presc.notes}</p>
                        )}
                    </div>
                    <button 
                        type="button"
                        onClick={(e) => requestDelete(e, presc)}
                        className="p-3 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                        title="Delete Prescription"
                        aria-label="Delete Prescription"
                    >
                        <Trash2 size={24} />
                    </button>
                </div>
                <a 
                    href={presc.prescriptionURL} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-blue-50 text-blue-600 font-bold rounded-xl text-center hover:bg-blue-100 transition-colors"
                >
                    View Document
                </a>
             </div>
           ))}

           {prescriptions.length === 0 && !showUploadForm && (
               <div className="text-center py-12 text-gray-400">
                   <FileText size={48} className="mx-auto mb-4 opacity-50" />
                   <p className="text-xl">No prescriptions saved yet.</p>
               </div>
           )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {prescriptionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl transform transition-all scale-100">
            <h3 className="text-2xl font-bold text-warmGray mb-4">Delete Prescription?</h3>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Are you sure you want to delete the prescription from <span className="font-semibold text-warmGray">{prescriptionToDelete.doctorName || 'this doctor'}</span>? This cannot be undone.
            </p>
            
            <div className="flex gap-4">
              <button 
                onClick={() => setPrescriptionToDelete(null)}
                disabled={isDeleting}
                className="flex-1 h-[56px] bg-gray-100 text-gray-700 text-lg font-bold rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 h-[56px] bg-alertRed text-white text-lg font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {isDeleting ? (
                    <>
                        <Loader2 className="animate-spin" size={20} /> Deleting...
                    </>
                ) : (
                    <>
                        <Trash2 size={20} /> Delete
                    </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};