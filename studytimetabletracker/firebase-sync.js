// Firebase Auto-Sync Module
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore, doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: "AIzaSyC_MRBp_-Zhkq52OEV7W3e3JDDxjkf60dw",
  authDomain: "studytimetabletracker-f882c.firebaseapp.com",
  projectId: "studytimetabletracker-f882c",
  storageBucket: "studytimetabletracker-f882c.firebasestorage.app",
  messagingSenderId: "93337267809",
  appId: "1:93337267809:web:835f83be980310a54a0420"
};

let db = null;
let userId = null;

// Initialize Firebase
const app = initializeApp(firebaseConfig);
db = getFirestore(app);
export const auth = getAuth(app);  // ← Added for Phone Authentication
userId = localStorage.getItem('user_id');

// Auto-sync function
export async function syncToCloud() {
  if (!db || !userId) return;
  
  try {
    const data = {
      studyLog: JSON.parse(localStorage.getItem('cfa_study_log') || '[]'),
      dailyGoal: localStorage.getItem('cfa_daily_goal') || '3',
      completed: JSON.parse(localStorage.getItem('cfa_completed') || '{}'),
      customSubjects: JSON.parse(localStorage.getItem('cfa_custom_subjects') || '[]'),
      subjectOverlays: JSON.parse(localStorage.getItem('cfa_subject_overlays') || '{}'),
      lastSync: new Date().toISOString()
    };
    
    await setDoc(doc(db, 'users', userId), data);
    console.log('Data synced to cloud');
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// Sync every time localStorage changes
window.addEventListener('storage', syncToCloud);

// Sync when page loads
if (userId) {
  syncToCloud();
}