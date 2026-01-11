// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA20eF-3eOwxewwoyI_EqUGPyI3tM6bZeA",
  authDomain: "kisaansaathi-68309.firebaseapp.com",
  projectId: "kisaansaathi-68309",
  storageBucket: "kisaansaathi-68309.firebasestorage.app",
  messagingSenderId: "299188248424",
  appId: "1:299188248424:web:0f841f87dd6b54d28040dd",
  measurementId: "G-ZGQYPXMKX8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;