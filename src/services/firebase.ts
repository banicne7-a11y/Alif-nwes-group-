import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  getDocFromServer,
  Firestore,
} from 'firebase/firestore';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import firebaseConfig from '../../firebase-applet-config.json';

export { firebaseConfig };

// Initialize Firebase App singleton using provisioned config
export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(firebaseApp);

// Initialize Firestore targeting the provisioned database ID with multi-tab IndexedDB persistence
function createFirestoreInstance(): Firestore {
  const dbId = firebaseConfig.firestoreDatabaseId || undefined;
  if (typeof window !== 'undefined') {
    try {
      return initializeFirestore(
        firebaseApp,
        {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
          }),
        },
        dbId
      );
    } catch {
      return dbId ? getFirestore(firebaseApp, dbId) : getFirestore(firebaseApp);
    }
  }
  return dbId ? getFirestore(firebaseApp, dbId) : getFirestore(firebaseApp);
}

export const firestoreDb = createFirestoreInstance();

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

// Boot connection test throttled to once per browser session to avoid unnecessary daily reads
async function testConnection() {
  if (typeof window === 'undefined') return;
  try {
    if (window.sessionStorage?.getItem('alif_fb_conn_checked')) return;
    window.sessionStorage?.setItem('alif_fb_conn_checked', '1');
    await getDocFromServer(doc(firestoreDb, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): void {
  const rawMessage = error instanceof Error ? error.message : String(error);
  const rawCode = (error as any)?.code ? String((error as any).code) : '';
  const isQuotaExhausted =
    rawCode.includes('resource-exhausted') ||
    /quota|resource_exhausted|429/i.test(rawMessage);

  const errInfo: FirestoreErrorInfo = {
    error: rawMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  if (isQuotaExhausted) {
    console.warn('Firestore daily read quota temporarily reached; falling back to cached data.', path);
    return;
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
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
    let message = error.message || 'Google Sign-In failed. Please try again.';
    if (error.code === 'auth/popup-closed-by-user') {
      message = 'Sign-in window was closed before completing. Please try again.';
    } else if (error.code === 'auth/popup-blocked') {
      message = 'Popup was blocked by your browser. Please allow popups for this site.';
    } else if (error.code === 'auth/unauthorized-domain') {
      message = `This domain is not authorized in Firebase Console yet. Please add "${
        typeof window !== 'undefined' ? window.location.hostname : 'your-domain'
      }" under Firebase Console -> Authentication -> Settings -> Authorized domains.`;
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
