import { db } from './db';
import { User } from '../types';
import { FirebaseUser, logOutFromFirebase } from './firebase';

const AUTH_STORAGE_KEY = 'alif_news_24_admin_auth_v1';

export interface AuthSession {
  userId: string;
  email: string;
  name: string;
  role: string;
  avatar: string;
  authProvider: 'google' | 'password' | 'quick';
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
   * Logs in a user using official Google Account (Firebase Auth).
   */
  loginWithGoogle(firebaseUser: FirebaseUser): { success: boolean; user?: User; error?: string } {
    if (!firebaseUser.email) {
      return { success: false, error: 'Google account did not return a valid email address.' };
    }

    const email = firebaseUser.email.toLowerCase().trim();
    const users = db.getUsers();

    // Check if user already exists by email
    let matchedUser = users.find((u) => u.email.toLowerCase() === email);

    const isOwner =
      email === 'alifsheenshopping@gmail.com' ||
      email === 'banicne7@gmail.com' ||
      users.length === 0 ||
      email.includes('admin') ||
      email.includes('alif');

    if (matchedUser) {
      // Update with latest Google avatar / name if available
      matchedUser.name = firebaseUser.displayName || matchedUser.name;
      if (firebaseUser.photoURL) {
        matchedUser.avatar = firebaseUser.photoURL;
      }
      if (isOwner) {
        matchedUser.role = 'Administrator';
      }
      matchedUser.lastLogin = 'Just now (Google)';
      matchedUser.loginHistory = [
        {
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          ip: 'Google Verified Auth',
          device: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 30) : 'Web Client',
        },
        ...(matchedUser.loginHistory || []).slice(0, 9),
      ];
      matchedUser = db.saveUser(matchedUser);
    } else {
      // First time Google Sign-In: create user with Administrator / Editor access
      matchedUser = db.saveUser({
        name: firebaseUser.displayName || 'Alif Sheen Admin',
        email: email,
        avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}`,
        role: isOwner ? 'Administrator' : 'Editor',
        status: 'active',
        twoFactorEnabled: true,
        bio: 'Google Verified Alif News 24 Editorial Team Member.',
      });
    }

    if (matchedUser.status === 'suspended') {
      return { success: false, error: 'This account has been suspended by the administrator.' };
    }

    const session: AuthSession = {
      userId: matchedUser.id,
      email: matchedUser.email,
      name: matchedUser.name,
      role: matchedUser.role,
      avatar: matchedUser.avatar,
      authProvider: 'google',
      loginTime: new Date().toISOString(),
    };

    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      db.updateCurrentUser(matchedUser);
      db.logAction('Google Sign-In', `${matchedUser.name} (${matchedUser.email}) authenticated via Official Google OAuth`);
    } catch (e) {
      console.error('Session write error', e);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('app:auth-changed', { detail: { isAuthenticated: true, user: matchedUser, provider: 'google' } })
      );
    }

    return { success: true, user: matchedUser };
  },

  /**
   * Logs in a user as admin/staff via standard form or demo access.
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
      avatar: matchedUser.avatar,
      authProvider: 'password',
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
      window.dispatchEvent(
        new CustomEvent('app:auth-changed', { detail: { isAuthenticated: true, user: matchedUser, provider: 'password' } })
      );
    }

    return { success: true, user: matchedUser };
  },

  /**
   * Logs out the current admin and destroys the session.
   */
  async logout(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      await logOutFromFirebase();
      db.logAction('Staff Logout', 'User logged out of Admin CMS');
    } catch (e) {
      console.error('Session clear error', e);
    }
    window.dispatchEvent(new CustomEvent('app:auth-changed', { detail: { isAuthenticated: false } }));
  },
};
