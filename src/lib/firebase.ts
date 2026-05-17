import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDD2yrlpZ0KNKfpGB2aQ1HiBJnerV61XLM",
  authDomain: "essashave.firebaseapp.com",
  projectId: "essashave",
  storageBucket: "essashave.firebasestorage.app",
  messagingSenderId: "29732602466",
  appId: "1:29732602466:web:aaccbd5f9898d20b58073b",
  measurementId: "G-6LZBBHXSH7",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
