// frontend/app/firebase.ts

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// ⚠️ IMPORTANT: Niche wale hisse ko apne Firebase Console se mile code se replace karo
const firebaseConfig = {
  apiKey: "AIzaSyA1ik1A25pxivZCZPDOp6cNmwfw1_UwXPQ",
  authDomain: "techquest-pallotti.firebaseapp.com",
  projectId: "techquest-pallotti",
  storageBucket: "techquest-pallotti.firebasestorage.app",
  messagingSenderId: "86708782430",
  appId: "1:86708782430:web:c67f4d619c9b4009913bcf"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Database export kar rahe hain taaki pure app me use kar sakein
export const db = getFirestore(app);