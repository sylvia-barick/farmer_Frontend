// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCP_k54vgtaLLrYUHkbtf2LMYqzstRoHao",
  authDomain: "airlink-6b5ca.firebaseapp.com",
  projectId: "airlink-6b5ca",
  storageBucket: "airlink-6b5ca.firebasestorage.app",
  messagingSenderId: "186039291778",
  appId: "1:186039291778:web:a9a57ec03fa3c4147b899b",
  measurementId: "G-T79V5SKJR7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;