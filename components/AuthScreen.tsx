import React, { useState } from 'react';
import { Mail, Lock, User, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import { AuthMode, ValidationErrors } from '../types';
import { AccessibleInput } from './ui/AccessibleInput';
import { AccessibleButton } from './ui/AccessibleButton';
import firebase, { auth, db } from '../firebase';

interface AuthScreenProps {
  onLoginSuccess: (name: string) => void;
}

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238989)">
      <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
      <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
      <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.734 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
      <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.799 L -6.734 42.379 C -8.804 40.449 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
    </g>
  </svg>
);

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<AuthMode>(AuthMode.SIGN_IN);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Verification & Reset State
  const [verificationSentEmail, setVerificationSentEmail] = useState<string | null>(null);
  const [resetEmailSent, setResetEmailSent] = useState<string | null>(null);

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrors({});
    if (newMode !== AuthMode.FORGOT_PASSWORD) {
        setPassword('');
        setConfirmPassword('');
    }
  };

  const validate = (): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    if (!email) {
      newErrors.email = "Please enter your email address";
      isValid = false;
    }

    if (mode !== AuthMode.FORGOT_PASSWORD) {
        if (!password) {
        newErrors.password = "Please enter a password";
        isValid = false;
        }
    }

    if (mode === AuthMode.SIGN_UP) {
      if (!name) {
        newErrors.name = "Please tell us your name";
        isValid = false;
      }
      if (password !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrors({});
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        
        if (result.user) {
            // Create user doc if not exists
            const userRef = db.collection("users").doc(result.user.uid);
            await userRef.set({
                email: result.user.email,
                name: result.user.displayName,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
        }

    } catch (error: any) {
        console.error("Google Auth Error:", error);
        if (error.code === 'auth/popup-closed-by-user') {
          return;
        }
        if (error.code === 'auth/unauthorized-domain') {
          setErrors({ general: "This domain is not authorized for Google Sign-In. Please check Firebase Console settings." });
          return;
        }
        setErrors({ general: "Failed to sign in with Google. Please try again." });
    } finally {
        setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      if (mode === AuthMode.FORGOT_PASSWORD) {
        await auth.sendPasswordResetEmail(email);
        setResetEmailSent(email);
      } else if (mode === AuthMode.SIGN_IN) {
        // Sign In Logic
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        
        // Check verification
        if (!userCredential.user?.emailVerified) {
          await auth.signOut();
          setVerificationSentEmail(email);
          return;
        }

        // Success is handled by onAuthStateChanged in App.tsx
      } else {
        // Sign Up Logic
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        if (userCredential.user) {
            // Update display name
            await userCredential.user.updateProfile({
              displayName: name
            });

            // Initialize Firestore Document
            await db.collection("users").doc(userCredential.user.uid).set({
                email: email,
                name: name,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                doctorInfo: {},
                pharmacistInfo: {}
            });
            
            // Send Verification Email
            await userCredential.user.sendEmailVerification();

            // Sign out immediately so they aren't logged in automatically
            await auth.signOut();
            
            // Show verification screen
            setVerificationSentEmail(email);
        }
      }
    } catch (error: any) {
      const errorCode = error.code;
      console.error("Auth Error:", errorCode);

      if (mode === AuthMode.FORGOT_PASSWORD) {
        if (errorCode === 'auth/user-not-found') {
            setErrors({ email: "No account found with this email" });
        } else if (errorCode === 'auth/invalid-email') {
            setErrors({ email: "Invalid email address" });
        } else {
            setErrors({ general: "Failed to send reset link. Please try again." });
        }
      } else if (mode === AuthMode.SIGN_IN) {
         // Specific error message for login
         if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password') {
            setErrors({ general: "Incorrect email or password." });
         } else if (errorCode === 'auth/too-many-requests') {
             setErrors({ general: "Too many failed attempts. Try again later." });
         } else {
             setErrors({ general: "Sign in failed. Check your connection." });
         }
      } else {
         // Specific error message for signup
         if (errorCode === 'auth/email-already-in-use') {
             setErrors({ email: "Email is already registered. Try logging in." });
         } else if (errorCode === 'auth/weak-password') {
             setErrors({ password: "Password should be at least 6 characters." });
         } else {
             setErrors({ general: "Sign up failed. Please try again." });
         }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E6F5F3] via-[#F2FAF9] to-white flex flex-col items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-gentleGreen w-20 h-20 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-md">
            <User size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-warmGray">
            {mode === AuthMode.SIGN_IN ? 'Welcome Back' : 
             mode === AuthMode.SIGN_UP ? 'Join MediBuddy' : 'Reset Password'}
          </h1>
          <p className="text-gray-500 mt-2 text-lg">
            {mode === AuthMode.SIGN_IN ? 'Sign in to access your plan' : 
             mode === AuthMode.SIGN_UP ? 'Start your wellness journey' : 'Enter email to receive reset link'}
          </p>
        </div>

        {/* Verification Sent Message */}
        {verificationSentEmail && (
          <div className="bg-green-50 border-l-4 border-gentleGreen p-4 rounded-r mb-6 flex items-start gap-3">
             <CheckCircle className="text-gentleGreen flex-shrink-0" size={24} />
             <div>
               <h3 className="font-bold text-green-800 text-lg">Verification Sent</h3>
               <p className="text-green-700">We sent an email to {verificationSentEmail}. Please check your inbox and verify to log in.</p>
               <button onClick={() => setVerificationSentEmail(null)} className="text-gentleGreen font-bold mt-2 underline">Back to Login</button>
             </div>
          </div>
        )}

        {/* Reset Email Sent Message */}
        {resetEmailSent && (
           <div className="bg-green-50 border-l-4 border-gentleGreen p-4 rounded-r mb-6 flex items-start gap-3">
             <CheckCircle className="text-gentleGreen flex-shrink-0" size={24} />
             <div>
               <h3 className="font-bold text-green-800 text-lg">Reset Link Sent</h3>
               <p className="text-green-700">Check {resetEmailSent} for password reset instructions.</p>
               <button onClick={() => switchMode(AuthMode.SIGN_IN)} className="text-gentleGreen font-bold mt-2 underline">Back to Login</button>
             </div>
           </div>
        )}

        {/* Global Error */}
        {errors.general && (
            <div className="bg-red-50 border-l-4 border-alertRed p-4 rounded-r mb-6 text-alertRed font-bold flex items-center gap-2">
                <AlertCircle size={24} />
                {errors.general}
            </div>
        )}

        {!verificationSentEmail && !resetEmailSent && (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {mode === AuthMode.SIGN_UP && (
              <AccessibleInput
                id="name"
                label="Full Name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                icon={User}
                error={errors.name}
              />
            )}

            <AccessibleInput
              id="email"
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              icon={Mail}
              error={errors.email}
            />

            {mode !== AuthMode.FORGOT_PASSWORD && (
              <AccessibleInput
                id="password"
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                icon={Lock}
                error={errors.password}
              />
            )}

            {mode === AuthMode.SIGN_UP && (
               <AccessibleInput
                id="confirmPassword"
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••"
                icon={Lock}
                error={errors.confirmPassword}
              />
            )}

            <div className="pt-4">
               <AccessibleButton type="submit" fullWidth disabled={isLoading}>
                 {isLoading ? 'Please wait...' : 
                  mode === AuthMode.SIGN_IN ? 'Sign In' : 
                  mode === AuthMode.SIGN_UP ? 'Create Account' : 'Send Reset Link'}
               </AccessibleButton>
            </div>

            {mode === AuthMode.SIGN_IN && (
                <button 
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full h-[64px] bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center gap-3 text-xl font-bold text-gray-600 hover:bg-gray-50 transition-all mt-4"
                >
                  <GoogleIcon />
                  Sign in with Google
                </button>
            )}
          </form>
        )}

        {/* Footer Links */}
        <div className="mt-8 text-center space-y-3">
          {mode === AuthMode.SIGN_IN && (
             <>
               <button onClick={() => switchMode(AuthMode.FORGOT_PASSWORD)} className="text-gray-500 font-semibold hover:text-gentleGreen">
                 Forgot Password?
               </button>
               <p className="text-gray-500 text-lg">
                 Don't have an account?{' '}
                 <button onClick={() => switchMode(AuthMode.SIGN_UP)} className="text-gentleGreen font-bold hover:underline">
                   Sign Up
                 </button>
               </p>
             </>
          )}

          {mode === AuthMode.SIGN_UP && (
             <p className="text-gray-500 text-lg">
               Already have an account?{' '}
               <button onClick={() => switchMode(AuthMode.SIGN_IN)} className="text-gentleGreen font-bold hover:underline">
                 Sign In
               </button>
             </p>
          )}

          {mode === AuthMode.FORGOT_PASSWORD && (
             <button onClick={() => switchMode(AuthMode.SIGN_IN)} className="text-gentleGreen font-bold hover:underline flex items-center justify-center gap-2 mx-auto">
               <ArrowLeft size={20} /> Back to Sign In
             </button>
          )}
        </div>

      </div>
    </div>
  );
};