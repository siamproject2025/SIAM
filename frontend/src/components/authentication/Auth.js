// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  /*apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,*/
  apiKey: "AIzaSyB_Fgzd03qsPVFpzUhFYSABaKjaFeWVl-0",
  authDomain: "siam-2025.firebaseapp.com",
  projectId: "siam-2025",
  storageBucket: "siam-2025.firebasestorage.app",
  messagingSenderId: "897108097078",
  appId: "1:897108097078:web:b6264418ca62942b118097",
  measurementId: "G-G8RNZXB57T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Exporta la instancia de autenticación
export const auth = getAuth(app);

export default app;