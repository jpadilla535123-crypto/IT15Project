import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyChXt0efXuSE8Sf8oyzK8n68f3o1l1h-6I",
  authDomain: "eventsphere-516ab.firebaseapp.com",
  projectId: "eventsphere-516ab",
  storageBucket: "eventsphere-516ab.firebasestorage.app",
  messagingSenderId: "125931347571",
  appId: "1:125931347571:web:38bf90c03304c1c498d406",
  measurementId: "G-LNPXB2SKJT"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
