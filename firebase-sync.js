// Cloud sync helper for all pages (except login, which already signs in)
// Keeps localStorage data mirrored to Firestore per authenticated user.

import { initializeApp, getApp, getApps } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyC_MRBp_-Zhkq52OEV7W3e3JDDxjkf60dw",
  authDomain: "studytimetabletracker-f882c.firebaseapp.com",
  projectId: "studytimetabletracker-f882c",
  storageBucket: "studytimetabletracker-f882c.firebasestorage.app",
  messagingSenderId: "93337267809",
  appId: "1:93337267809:web:835f83be980310a54a0420"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

const SYNC_DEBOUNCE_MS = 1200;
let currentUser = null;
let syncTimer   = null;
let syncing     = false;
let pendingReason = '';
let suppressSync = false;

const rawSetItem = localStorage.setItem.bind(localStorage);
const rawRemoveItem = localStorage.removeItem.bind(localStorage);

const TRACKED_KEYS = new Set([
  'cfa_study_log',
  'cfa_daily_goal',
  'cfa_completed',
  'cfa_custom_subjects',
  'cfa_subject_overlays'
]);

let resolveAuthReady;
const authReady = new Promise((res) => { resolveAuthReady = res; });

const stampLocalUpdated = (at = new Date().toISOString()) => {
  rawSetItem('cfa_last_updated', at);
  return at;
};

const getLocalUpdatedAt = () => localStorage.getItem('cfa_last_updated');

const getLocalPayload = () => ({
  studyLog: JSON.parse(localStorage.getItem('cfa_study_log') || '[]'),
  dailyGoal: localStorage.getItem('cfa_daily_goal') || '3',
  completed: JSON.parse(localStorage.getItem('cfa_completed') || '{}'),
  customSubjects: JSON.parse(localStorage.getItem('cfa_custom_subjects') || '[]'),
  subjectOverlays: JSON.parse(localStorage.getItem('cfa_subject_overlays') || '{}'),
  updatedAt: getLocalUpdatedAt() || stampLocalUpdated()
});

const hasMeaningfulLocalData = () => {
  const studyLog = JSON.parse(localStorage.getItem('cfa_study_log') || '[]');
  const completed = JSON.parse(localStorage.getItem('cfa_completed') || '{}');
  const customSubjects = JSON.parse(localStorage.getItem('cfa_custom_subjects') || '[]');
  const subjectOverlays = JSON.parse(localStorage.getItem('cfa_subject_overlays') || '{}');
  const dailyGoal = localStorage.getItem('cfa_daily_goal') || '3';
  return (
    studyLog.length > 0
    || Object.keys(completed).length > 0
    || customSubjects.length > 0
    || Object.keys(subjectOverlays).length > 0
    || dailyGoal !== '3'
  );
};

const applyLocalData = (data) => {
  if (!data) return false;
  suppressSync = true;
  let changed = false;

  const setIfDifferent = (key, nextValue) => {
    if (localStorage.getItem(key) !== nextValue) {
      rawSetItem(key, nextValue);
      changed = true;
    }
  };

  if ('studyLog' in data) {
    const studyLog = Array.isArray(data.studyLog) ? data.studyLog : [];
    setIfDifferent('cfa_study_log', JSON.stringify(studyLog));
  }
  if ('dailyGoal' in data) {
    const dailyGoal = data.dailyGoal != null ? String(data.dailyGoal) : '3';
    setIfDifferent('cfa_daily_goal', dailyGoal);
  }
  if ('completed' in data) {
    const completed = data.completed && typeof data.completed === 'object' ? data.completed : {};
    setIfDifferent('cfa_completed', JSON.stringify(completed));
  }
  if ('customSubjects' in data) {
    const customSubjects = Array.isArray(data.customSubjects) ? data.customSubjects : [];
    setIfDifferent('cfa_custom_subjects', JSON.stringify(customSubjects));
  }
  if ('subjectOverlays' in data) {
    const subjectOverlays = data.subjectOverlays && typeof data.subjectOverlays === 'object' ? data.subjectOverlays : {};
    setIfDifferent('cfa_subject_overlays', JSON.stringify(subjectOverlays));
  }

  const updatedAt = data.updatedAt || (changed ? new Date().toISOString() : getLocalUpdatedAt());
  if (updatedAt && getLocalUpdatedAt() !== updatedAt) {
    rawSetItem('cfa_last_updated', updatedAt);
    changed = true;
  }

  suppressSync = false;
  return changed;
};

async function pushToCloud(reason = 'change') {
  await authReady;
  if (!currentUser) return;
  if (syncing) { pendingReason = reason; return; }
  syncing = true;
  try {
    const payload = getLocalPayload();
    payload.updatedAt = stampLocalUpdated(payload.updatedAt);
    await setDoc(doc(db, 'users', currentUser.uid), payload, { merge: true });
    console.info('[cloud-sync] pushed', reason);
  } catch (err) {
    console.error('[cloud-sync] push failed', err);
  } finally {
    syncing = false;
    if (pendingReason) {
      const r = pendingReason;
      pendingReason = '';
      queueCloudSync(r);
    }
  }
}

function waitForSyncIdle() {
  return new Promise((resolve) => {
    const check = () => {
      if (!syncing && !pendingReason) { resolve(); return; }
      setTimeout(check, 150);
    };
    check();
  });
}

function queueCloudSync(reason = 'change') {
  if (!currentUser) return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => pushToCloud(reason), SYNC_DEBOUNCE_MS);
}

function shouldReloadAfterPull(reason) {
  return reason === 'page-load' || reason === 'auth-state';
}

function maybeReloadAfterPull(reason) {
  if (!shouldReloadAfterPull(reason)) return;
  const key = `cloud_sync_reload_${window.location.pathname}`;
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, '1');
  window.location.reload();
}

async function pullFromCloud(reason = 'manual') {
  await authReady;
  if (!currentUser) return;
  try {
    const snap = await getDoc(doc(db, 'users', currentUser.uid));
    if (!snap.exists()) {
      if (hasMeaningfulLocalData()) {
        queueCloudSync('bootstrap-local');
      }
      return;
    }
    const cloud = snap.data();
    const cloudUpdated = cloud.updatedAt;
    const localUpdated = getLocalUpdatedAt();
    let applied = false;

    if (!localUpdated || (cloudUpdated && cloudUpdated > localUpdated)) {
      applied = applyLocalData(cloud);
      console.info('[cloud-sync] pulled newer cloud data', reason);
    } else if (localUpdated && cloudUpdated && localUpdated > cloudUpdated) {
      queueCloudSync('local-newer');
    }

    if (applied) {
      maybeReloadAfterPull(reason);
    }
  } catch (err) {
    console.error('[cloud-sync] pull failed', err);
  }
}

// Hook localStorage writes to trigger sync
localStorage.setItem = (key, value) => {
  rawSetItem(key, value);
  if (suppressSync) return;
  if (TRACKED_KEYS.has(key)) {
    stampLocalUpdated();
    queueCloudSync('local-change');
  }
};

localStorage.removeItem = (key) => {
  rawRemoveItem(key);
  if (suppressSync) return;
  if (TRACKED_KEYS.has(key)) {
    stampLocalUpdated();
    queueCloudSync('local-remove');
  }
};

onAuthStateChanged(auth, (user) => {
  const previousUserId = localStorage.getItem('user_id');
  currentUser = user;
  if (user) {
    if (previousUserId && previousUserId !== user.uid) {
      suppressSync = true;
      rawRemoveItem('cfa_study_log');
      rawRemoveItem('cfa_daily_goal');
      rawRemoveItem('cfa_completed');
      rawRemoveItem('cfa_custom_subjects');
      rawRemoveItem('cfa_subject_overlays');
      rawRemoveItem('cfa_last_updated');
      suppressSync = false;
    }
    rawSetItem('user_id', user.uid);
    rawSetItem('user_email', user.email || '');
    if (!localStorage.getItem('user_name')) {
      const fallbackName = user.displayName || (user.email ? user.email.split('@')[0] : 'Student');
      rawSetItem('user_name', fallbackName);
    }
  } else if (previousUserId) {
    rawRemoveItem('user_id');
    rawRemoveItem('user_email');
    rawRemoveItem('user_name');
  }
  if (typeof window.initUserNav === 'function') {
    window.initUserNav();
  }
  if (resolveAuthReady) { resolveAuthReady(user); resolveAuthReady = null; }
  if (user) pullFromCloud('auth-state');
});

// Public helpers for non-module scripts
window.queueCloudSync = queueCloudSync;
window.pullCloudData  = () => pullFromCloud('manual');
window.cloudSyncReady = authReady;
window.forceCloudSync = async (reason = 'manual-save') => {
  await pushToCloud(reason);
  await waitForSyncIdle();
};
window.firebaseSignOut = async () => {
  try {
    await signOut(auth);
  } catch (err) {
    console.error('[cloud-sync] sign out failed', err);
    throw err;
  }
};

// Keep things reasonably fresh
window.addEventListener('focus', () => pullFromCloud('focus'));
window.addEventListener('storage', (e) => {
  if (e.key && e.key.startsWith('cfa_')) queueCloudSync('storage-event');
});

// Initial pull if already signed in
authReady.then((user) => { if (user) pullFromCloud('page-load'); });
