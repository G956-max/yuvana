import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDzwUghiMA_McKiWfrSbDfy0MadtUNZaXY",
  authDomain: "ayurveda-c7883.firebaseapp.com",
  projectId: "ayurveda-c7883",
  storageBucket: "ayurveda-c7883.firebasestorage.app",
  messagingSenderId: "655168847700",
  appId: "1:655168847700:web:f3dbda79d739c3b802d2c1",
  measurementId: "G-SCTTBVJ99Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
