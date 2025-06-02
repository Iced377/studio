
import {
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  type UserCredential,
  type AuthError,
  signInWithRedirect,
  browserLocalPersistence,
  setPersistence,
} from 'firebase/auth';
import { auth } from '@/config/firebase';

// Sign In with Google
export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  // A simple way to detect mobile devices. More robust detection might be needed for edge cases.
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  await setPersistence(auth, browserLocalPersistence);

  if (isMobile) {
    // For mobile, use signInWithRedirect. This navigates away and comes back.
    // The result is handled by getRedirectResult in AuthProvider.
    return signInWithRedirect(auth, provider);
  } else {
    // For desktop, signInWithPopup is generally preferred.
    // It returns a UserCredential upon successful sign-in.
    return signInWithPopup(auth, provider);
  }
};

// Sign Out
export const signOutUser = async (): Promise<void | AuthError> => {
  try {
    await signOut(auth);
  } catch (error) {
    return error as AuthError;
  }
};
