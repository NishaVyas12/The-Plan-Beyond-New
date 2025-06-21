import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBOUGncPZXELd2C5pUdvmmEVHZTzvBRMNo",
  authDomain: "sync-contact-8d70b.firebaseapp.com",
  projectId: "sync-contact-8d70b",
  storageBucket: "sync-contact-8d70b.firebasestorage.app",
  messagingSenderId: "850697863641",
  appId: "1:850697863641:web:e2a3a97ce73c8a74c3d9c8",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("https://www.googleapis.com/auth/contacts.readonly");
export const db = getFirestore(app);