// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDJ3Vc4XIYZRSmrv1xQWSeilUBWevW8fqw",
  authDomain: "moleai-testing.firebaseapp.com",
  projectId: "moleai-testing",
  storageBucket: "moleai-testing.firebasestorage.app",
  messagingSenderId: "1000623741758",
  appId: "1:1000623741758:web:fcf435d06a664faee72a6f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;