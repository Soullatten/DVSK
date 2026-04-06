// src/firebase.ts
import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getAnalytics } from "firebase/analytics"

const firebaseConfig = {
  apiKey: "AIzaSyCOm53Fs1xFMMCf17avgrmxsjg3o1qdLTs",
  authDomain: "dvsk-c985e.firebaseapp.com",
  projectId: "dvsk-c985e",
  storageBucket: "dvsk-c985e.firebasestorage.app",
  messagingSenderId: "756010459748",
  appId: "1:756010459748:web:cc645096aa4906a95a3571",
  measurementId: "G-W447RCWS2D"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const analytics = getAnalytics(app)