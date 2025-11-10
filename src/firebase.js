// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAWIfRD01PfVZlj0HF-2fbvjjlOS7sCdU8",
  authDomain: "mole-ai.com",
  projectId: "moleai-471412",
  storageBucket: "moleai-471412.firebasestorage.app",
  messagingSenderId: "985936770132",
  appId: "1:985936770132:web:c7dfd0c694f614550ea9c1",
  measurementId: "G-QRS5KWZTRK"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
