import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/storage";
import "firebase/compat/functions";

const firebaseConfig = {
  apiKey: "AIzaSyC3f6XFjpoC0s_fSzY9IsN-fsL6n8_FOQA",
  authDomain: "medibuddy-61fd2.firebaseapp.com",
  projectId: "medibuddy-61fd2",
  storageBucket: "medibuddy-61fd2.firebasestorage.app",
  messagingSenderId: "271726820259",
  appId: "1:271726820259:web:cf48758aa64c10d3fef816"
};

// Initialize Firebase (check if already initialized for hot-reloading)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
} else {
  firebase.app();
}

export const auth = firebase.auth();
export const db = firebase.firestore();
export const storage = firebase.storage();
export const functions = firebase.functions();

export default firebase;