
import {
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  type UserCredential,
  type AuthError,
  signInWithRedirect,
  browserLocalPersistence,
  setPersistence,
  createUserWithEmailAndPassword, // Added import
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

// Sign Up with Email and Password
export const signUpWithEmail = async (email: string, password: string): Promise<UserCredential | AuthError> => {
  try {
    await setPersistence(auth, browserLocalPersistence);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error) {
    return error as AuthError;
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

// Sign In with Email and Password (If you need this separately for a login form)
// This function was missing if LoginForm.tsx was intended to be used.
// For now, LoginForm.tsx also calls signInWithGoogle and a non-existent signInWithEmail for login.
// If you want email/password login, you'd need signInWithEmailAndPassword.
// Let's add it for completeness, in case LoginForm.tsx is re-enabled or used.

import { signInWithEmailAndPassword } from 'firebase/auth';

export const signInWithEmail = async (email: string, password: string): Promise<UserCredential | AuthError> => {
  try {
    await setPersistence(auth, browserLocalPersistence);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error) {
    return error as AuthError;
  }
};
