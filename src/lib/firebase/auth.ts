import {
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  type UserCredential,
  type AuthError,
} from 'firebase/auth';
import { auth } from '@/config/firebase';

// Sign In with Google
const googleProvider = new GoogleAuthProvider();
export const signInWithGoogle = async (): Promise<UserCredential | AuthError> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // This gives you a Google Access Token. You can use it to access the Google API.
    // const credential = GoogleAuthProvider.credentialFromResult(result);
    // const token = credential?.accessToken;
    // The signed-in user info.
    // const user = result.user;
    return result;
  } catch (error) {
    // Handle Errors here.
    // const errorCode = (error as AuthError).code;
    // const errorMessage = (error as AuthError).message;
    // The email of the user's account used.
    // const email = (error as any).customData?.email;
    // The AuthCredential type that was used.
    // const credential = GoogleAuthProvider.credentialFromError(error as AuthError);
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
