import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  type UserCredential,
  type AuthError
} from 'firebase/auth';
import { auth } from '@/config/firebase';

// Sign Up with Email and Password
export const signUpWithEmail = async (email: string, password: string): Promise<UserCredential | AuthError> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error) {
    return error as AuthError;
  }
};

// Sign In with Email and Password
export const signInWithEmail = async (email: string, password: string): Promise<UserCredential | AuthError> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error) {
    return error as AuthError;
  }
};

// Sign In with Google
const googleProvider = new GoogleAuthProvider();
export const signInWithGoogle = async (): Promise<UserCredential | AuthError> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (error) {
    return error as AuthError;
  }
};

// Sign Out
export const logout = async (): Promise<void | AuthError> => {
  try {
    await signOut(auth);
  } catch (error) {
    return error as AuthError;
  }
};

// TODO: Implement Apple Sign In if needed - requires additional setup
// export const signInWithApple = async () => { ... };
