/**
 * PDF Library — auth.js
 * Firebase Firestore backend for real shared user data.
 * Session still stored in localStorage (per-browser login state only).
 *
 * Firestore collections:
 *   users/        — verified/admin accounts  (doc id = username)
 *   pendingUsers/ — awaiting admin approval  (doc id = username)
 */

'use strict';

/* ─────────────────────────────────────────────
   🔥 PASTE YOUR FIREBASE CONFIG HERE
   (Firebase Console → Project Settings → Your Apps → SDK setup)
───────────────────────────────────────────── */
/* ── Firebase SDK init ── */
function getDB() {
  if (_db) return _db;
  if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
  _db = firebase.firestore();
  return _db;
}

/* ─────────────────────────────────────────────
   Store — Firestore reads/writes
───────────────────────────────────────────── */
const Store = {

  /* Seed default admin + student on first ever run */
  async init() {
    const db        = getDB();
    const adminSnap = await db.collection('users').doc('admin').get();
    if (!adminSnap.exists) {
      const batch = db.batch();
      batch.set(db.collection('users').doc('admin'), {
        username: 'admin', password: 'admin123',
        name: 'Admin User', role: 'admin', verified: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      batch.set(db.collection('users').doc('student'), {
        username: 'student', password: 'student123',
        name: 'Student User', role: 'premium', verified: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      await batch.commit();
    }
  },

  async getUsers() {
    const snap = await getDB().collection('users').get();
    return snap.docs.map(d => d.data());
  },

  async getPending() {
    const snap = await getDB().collection('pendingUsers').orderBy('requestedAt', 'desc').get();
    return snap.docs.map(d => d.data());
  },

  async findUser(username) {
    const doc = await getDB().collection('users').doc(username.trim().toLowerCase()).get();
    return doc.exists ? doc.data() : null;
  },

  async subscribe({ name, username, password, email, txn }) {
    const db            = getDB();
    const usernameLower = username.trim().toLowerCase();
    const [uDoc, pDoc]  = await Promise.all([
      db.collection('users').doc(usernameLower).get(),
      db.collection('pendingUsers').doc(usernameLower).get(),
    ]);
    if (uDoc.exists)  return { success: false, error: 'Username already exists. Please choose another.' };
    if (pDoc.exists)  return { success: false, error: 'A subscription request for this username is already pending.' };

    await db.collection('pendingUsers').doc(usernameLower).set({
      username: usernameLower, password,
      name: name.trim(), email: email.trim().toLowerCase(),
      txnId: txn ? txn.trim() : '',
      role: 'premium', verified: false,
      requestedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    return { success: true };
  },

  async approvePending(username) {
    const db  = getDB();
    const doc = await db.collection('pendingUsers').doc(username).get();
    if (!doc.exists) return false;
    const batch = db.batch();
    batch.set(db.collection('users').doc(username), {
      ...doc.data(), verified: true,
      approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    batch.delete(db.collection('pendingUsers').doc(username));
    await batch.commit();
    return true;
  },

  async rejectPending(username) {
    await getDB().collection('pendingUsers').doc(username).delete();
    return true;
  },

  async revokeUser(username) {
    const doc = await getDB().collection('users').doc(username).get();
    if (!doc.exists || doc.data().role === 'admin') return false;
    await getDB().collection('users').doc(username).delete();
    return true;
  },
};

/* ─────────────────────────────────────────────
   Auth — session (localStorage, per browser)
───────────────────────────────────────────── */
const AUTH_KEY = 'pdflibrary_session';

const Auth = {
  setSession(user) {
    localStorage.setItem(AUTH_KEY, JSON.stringify({
      username: user.username, name: user.name, role: user.role, ts: Date.now(),
    }));
  },

  getSession() {
    try {
      const s = JSON.parse(localStorage.getItem(AUTH_KEY));
      if (!s) return null;
      if (Date.now() - s.ts > 86_400_000) { Auth.clearSession(); return null; }
      return s;
    } catch { return null; }
  },

  clearSession() { localStorage.removeItem(AUTH_KEY); },
  isPremium()    { const s = Auth.getSession(); return s && (s.role === 'premium' || s.role === 'admin'); },
  isAdmin()      { const s = Auth.getSession(); return s && s.role === 'admin'; },

  async login(username, password) {
    if (!username || !password) return { success: false, error: 'Please enter both username and password.' };
    let user;
    try   { user = await Store.findUser(username); }
    catch { return { success: false, error: 'Unable to reach the database. Check your connection.' }; }
    if (!user || user.password !== password) return { success: false, error: 'Invalid credentials. Please try again.' };
    if (user.verified === false)             return { success: false, error: 'Your account is pending admin verification.' };
    Auth.setSession(user);
    return { success: true, user };
  },

  logout(redirectTo = 'index.html') {
    Auth.clearSession();
    if (redirectTo) window.location.href = redirectTo;
  },
};

/* ── Navbar ── */
function updateNavAuthState() {
  const session = Auth.getSession();
  const logoutBtn = document.getElementById('nav-logout');
  const loginBtn  = document.getElementById('nav-premium');
  const adminBtn  = document.getElementById('nav-admin');
  if (logoutBtn) { logoutBtn.style.display = session ? 'inline-flex' : 'none'; logoutBtn.onclick = () => Auth.logout('index.html'); }
  if (loginBtn && session) loginBtn.textContent = '★ Premium';
  if (adminBtn) adminBtn.style.display = (session && session.role === 'admin') ? 'inline-flex' : 'none';
}

document.addEventListener('DOMContentLoaded', async () => {
  try { await Store.init(); } catch(e) { console.warn('Firebase init:', e.message); }
  updateNavAuthState();
});

window.Auth  = Auth;
window.Store = Store;
