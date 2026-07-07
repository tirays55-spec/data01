import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDWhPtBwi2dMW9EDJJTLLQdv6GdI7EfAEw",
  authDomain: "data-01-69.firebaseapp.com",
  projectId: "data-01-69",
  storageBucket: "data-01-69.firebasestorage.app",
  messagingSenderId: "906967608864",
  appId: "1:906967608864:web:90e147b8c9a897b6fed645"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Custom databaseId is required because Firestore was provisioned with a custom DB ID
export const db = getFirestore(app, "ai-studio-3-51cf9e33-1b3c-4ca3-ae89-6fbef8ff49a6");

export { signInWithPopup, signInWithRedirect, signOut, onAuthStateChanged };
export default app;
