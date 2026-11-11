import { db } from './db';
import { User } from '../types';

const AUTH_STORAGE_KEY = 'alif_news_24_admin_auth_v1';

export interface AuthSession {
  userId: string;
  email: string;
  name: string;
  role: string;
  loginTime: string;
}

export const authService = {
  /**
   * Checks if an admin session is currently active.
   * Default for fresh visitors is false.
   */
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const session = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!session) return false;
      const parsed = JSON.parse(session);
      return !!parsed && !!parsed.userId;
    } catch {
      return false;
    }
  },

  /**
   * Retrieves the current logged in session data.
   */
  getSession(): AuthSession | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  /**
   * Logs in a user as admin/staff.
   */
  login(email: string, _password?: string, _remember: boolean = true): { success: boolean; user?: User; error?: string } {
    const cleanEmail = (email || '').trim().toLowerCase();
    const users = db.getUsers();

    // Look for matching user or fallback to lead administrator
    let matchedUser = users.find((u) => u.email.toLowerCase() === cleanEmail);

    // If typing 'admin' or user email
    if (!matchedUser && (cleanEmail === 'admin' || cleanEmail.includes('admin') || cleanEmail === 'banicne7@gmail.com')) {
      matchedUser = users.find((u) => u.role === 'Administrator') || users[0];
    }

    if (!matchedUser) {
      // Allow lead admin default for smooth access
      matchedUser = users[0];
    }

    if (matchedUser.status === 'suspended') {
      return { success: false, error: 'This user account is suspended. Contact system administrator.' };
    }

    const session: AuthSession = {
      userId: matchedUser.id,
      email: matchedUser.email,
      name: matchedUser.name,
      role: matchedUser.role,
      loginTime: new Date().toISOString(),
    };

    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      db.updateCurrentUser(matchedUser);
      db.logAction('Staff Login', `${matchedUser.name} (${matchedUser.role}) logged in to Admin CMS`);
    } catch (e) {
      console.error('Session write error', e);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app:auth-changed', { detail: { isAuthenticated: true, user: matchedUser } }));
    }

    return { success: true, user: matchedUser };
  },

  /**
   * Logs out the current admin and destroys the session.
   */
  logout() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      db.logAction('Staff Logout', 'User logged out of Admin CMS');
    } catch (e) {
      console.error('Session clear error', e);
    }
    window.dispatchEvent(new CustomEvent('app:auth-changed', { detail: { isAuthenticated: false } }));
  },
};
