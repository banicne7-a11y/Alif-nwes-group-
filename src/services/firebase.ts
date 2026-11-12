import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';

// User's provided Firebase configuration for Alif News 24
export const firebaseConfig = {
  apiKey: 'AIzaSyCEQNccVV1p1g8lwYwYY31kOdOtLyxQGfs',
  authDomain: 'alif-nwes-24.firebaseapp.com',
  projectId: 'alif-nwes-24',
  storageBucket: 'alif-nwes-24.firebasestorage.app',
  messagingSenderId: '15785083133',
  appId: '1:15785083133:web:6718252a43373e26ca3e94',
  measurementId: 'G-MMSG4DCC9V',
};

// Initialize Firebase App singleton
export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(firebaseApp);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Initialize Analytics safely in browser
if (typeof window !== 'undefined') {
  isAnalyticsSupported().then((supported) => {
    if (supported) {
      try {
        getAnalytics(firebaseApp);
      } catch (e) {
        console.warn('Firebase analytics initialization skipped:', e);
      }
    }
  });
}

/**
 * Sign in using Google OAuth Popup
 */
export async function signInWithGoogle(): Promise<{ success: boolean; user?: FirebaseUser; error?: string }> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { success: true, user: result.user };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    // Provide user-friendly error messages
    let message = error.message || 'Google Sign-In failed. Please try again.';
    if (error.code === 'auth/popup-closed-by-user') {
      message = 'Google sign-in popup was closed before completing. Please try again.';
    } else if (error.code === 'auth/popup-blocked') {
      message = 'Popup was blocked by your browser. Please allow popups for this site.';
    } else if (error.code === 'auth/unauthorized-domain') {
      message = `This domain is not authorized in Firebase Console yet. Please add "${typeof window !== 'undefined' ? window.location.hostname : 'your-domain'}" under Firebase Console -> Authentication -> Settings -> Authorized domains.`;
    }
    return { success: false, error: message };
  }
}

/**
 * Sign out from Firebase
 */
export async function logOutFromFirebase(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (e) {
    console.error('Firebase sign-out error:', e);
  }
}

export { onAuthStateChanged };
export type { FirebaseUser };
