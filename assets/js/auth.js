/**
 * PDF Library — auth.js
 * Static authentication using localStorage-persisted JSON credentials
 * Session stored in localStorage (no backend required)
 */

'use strict';

const AUTH_KEY     = 'pdflibrary_session';
const USERS_KEY    = 'pdflibrary_users';       // mirrors users[] from pdfs.json
const PENDING_KEY  = 'pdflibrary_pending';     // pending subscription requests

/* ── Data store helpers (localStorage-backed JSON "database") ── */
const Store = {
  /** Initialise local store from fetched JSON if not already done */
  async init() {
    if (!localStorage.getItem(USERS_KEY)) {
      try {
        const data = await fetch('assets/data/pdfs.json').then(r => r.json());
        localStorage.setItem(USERS_KEY,   JSON.stringify(data.users        || []));
        localStorage.setItem(PENDING_KEY, JSON.stringify(data.pendingUsers || []));
      } catch {
        localStorage.setItem(USERS_KEY,   JSON.stringify([]));
        localStorage.setItem(PENDING_KEY, JSON.stringify([]));
      }
    }
  },

  getUsers()   { try { return JSON.parse(localStorage.getItem(USERS_KEY))   || []; } catch { return []; } },
  getPending() { try { return JSON.parse(localStorage.getItem(PENDING_KEY)) || []; } catch { return []; } },

  saveUsers(arr)   { localStorage.setItem(USERS_KEY,   JSON.stringify(arr)); },
  savePending(arr) { localStorage.setItem(PENDING_KEY, JSON.stringify(arr)); },

  findUser(username) {
    return this.getUsers().find(u => u.username === username.trim().toLowerCase());
  },

  /**
   * Register a new pending subscription.
   * Returns { success, error }
   */
  subscribe({ name, username, password, email }) {
    const users   = this.getUsers();
    const pending = this.getPending();

    const usernameLower = username.trim().toLowerCase();

    if (users.find(u => u.username === usernameLower)) {
      return { success: false, error: 'Username already exists. Please choose another.' };
    }
    if (pending.find(u => u.username === usernameLower)) {
      return { success: false, error: 'A subscription request for this username is already pending.' };
    }

    const newEntry = {
      username:  usernameLower,
      password,
      name:      name.trim(),
      email:     email.trim().toLowerCase(),
      role:      'premium',
      verified:  false,
      requestedAt: new Date().toISOString(),
    };

    pending.push(newEntry);
    this.savePending(pending);
    return { success: true };
  },

  /**
   * Admin: approve a pending user → move to users[]
   */
  approvePending(username) {
    const pending = this.getPending();
    const idx     = pending.findIndex(u => u.username === username);
    if (idx === -1) return false;

    const [user]  = pending.splice(idx, 1);
    user.verified = true;

    const users = this.getUsers();
    users.push(user);

    this.savePending(pending);
    this.saveUsers(users);
    return true;
  },

  /**
   * Admin: reject / delete a pending user
   */
  rejectPending(username) {
    const pending = this.getPending().filter(u => u.username !== username);
    this.savePending(pending);
    return true;
  },

  /**
   * Admin: revoke an already-approved premium user
   */
  revokeUser(username) {
    const users = this.getUsers().filter(u => u.username !== username || u.role === 'admin');
    this.saveUsers(users);
    return true;
  },
};

/* ── Session helpers ── */
const Auth = {

  setSession(user) {
    const session = {
      username: user.username,
      name:     user.name,
      role:     user.role,
      ts:       Date.now(),
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
  },

  getSession() {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw);
      if (Date.now() - session.ts > 86_400_000) {
        Auth.clearSession();
        return null;
      }
      return session;
    } catch {
      return null;
    }
  },

  clearSession() { localStorage.removeItem(AUTH_KEY); },

  isPremium() {
    const s = Auth.getSession();
    return s && (s.role === 'premium' || s.role === 'admin');
  },

  isAdmin() {
    const s = Auth.getSession();
    return s && s.role === 'admin';
  },

  /**
   * Attempt login against local store.
   * Checks verified flag before allowing access.
   */
  login(username, password) {
    if (!username || !password) {
      return { success: false, error: 'Please enter both username and password.' };
    }
    const user = Store.findUser(username);
    if (!user || user.password !== password) {
      return { success: false, error: 'Invalid credentials. Please try again.' };
    }
    if (user.verified === false) {
      return { success: false, error: 'Your account is pending admin verification. Please wait for approval.' };
    }
    Auth.setSession(user);
    return { success: true, user };
  },

  logout(redirectTo = 'index.html') {
    Auth.clearSession();
    if (redirectTo) window.location.href = redirectTo;
  },
};

/* ── Update nav auth state ── */
function updateNavAuthState() {
  const session   = Auth.getSession();
  const logoutBtn = document.getElementById('nav-logout');
  const loginBtn  = document.getElementById('nav-premium');
  const adminBtn  = document.getElementById('nav-admin');

  if (logoutBtn) {
    logoutBtn.style.display = session ? 'inline-flex' : 'none';
    logoutBtn.onclick = () => Auth.logout('index.html');
  }
  if (loginBtn && session) {
    loginBtn.textContent = '★ Premium';
  }
  if (adminBtn) {
    adminBtn.style.display = (session && session.role === 'admin') ? 'inline-flex' : 'none';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await Store.init();
  updateNavAuthState();
});

/* ── Expose globally ── */
window.Auth  = Auth;
window.Store = Store;
