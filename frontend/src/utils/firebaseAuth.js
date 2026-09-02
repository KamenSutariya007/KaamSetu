import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  applyActionCode,
} from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured } from '../lib/firebase';
import { authAPI } from '../api/client';

export { isFirebaseConfigured };

export async function firebaseCreateUser(email, password) {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase is not configured.');
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(credential.user, {
    url: `${window.location.origin}/register`,
    handleCodeInApp: true,
  });
  return credential.user;
}

export async function firebaseResendVerification(user) {
  await sendEmailVerification(user, {
    url: `${window.location.origin}/register`,
    handleCodeInApp: true,
  });
}

export async function firebaseApplyVerificationCode(oobCode) {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase is not configured.');
  await applyActionCode(auth, oobCode);
  const user = auth.currentUser;
  if (user) {
    await user.reload();
    await user.getIdToken(true);
  }
  return user;
}

/** Refresh verification status — reload first, then re-sign-in if needed. */
export async function firebaseRefreshVerifiedUser(email, password, firebaseUser) {
  const auth = getFirebaseAuth();
  if (!auth) return null;

  let user = auth.currentUser || firebaseUser;
  if (user) {
    await user.reload();
    await user.getIdToken(true);
    user = auth.currentUser;
    if (user?.emailVerified) return user;
  }

  if (email && password) {
    if (auth.currentUser) await signOut(auth);
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    await credential.user.reload();
    await credential.user.getIdToken(true);
    if (credential.user.emailVerified) return credential.user;
  }

  return auth.currentUser;
}

export async function firebaseSignIn(email, password) {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase is not configured.');
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  return credential.user;
}

const FIREBASE_ERROR_KEYS = {
  'auth/email-already-in-use': 'firebaseEmailInUse',
  'auth/weak-password': 'firebaseWeakPassword',
  'auth/operation-not-allowed': 'firebaseAuthDisabled',
  'auth/invalid-email': 'emailVerifyInvalid',
  'auth/invalid-credential': 'firebaseLoginFailed',
  'auth/wrong-password': 'firebaseWrongPassword',
  'auth/too-many-requests': 'firebaseTooManyRequests',
  'auth/network-request-failed': 'firebaseNetworkError',
  'auth/api-key-not-valid': 'firebaseApiKeyInvalid',
  'auth/invalid-api-key': 'firebaseApiKeyInvalid',
};

export function isFirebaseUnavailableError(err) {
  const code = (err?.code || '').toLowerCase();
  const message = (err?.message || '').toLowerCase();
  if (code.includes('api-key') || message.includes('api-key-not-valid')) return true;
  return [
    'auth/invalid-api-key',
    'auth/operation-not-allowed',
    'auth/configuration-not-found',
  ].includes(code);
}

export function getFirebaseAuthErrorMessage(err, t) {
  const code = err?.code || '';
  const key = FIREBASE_ERROR_KEYS[code];
  if (key) return t(key);
  return err?.message || t('firebaseRegisterFailed');
}

/** If email exists in Firebase, sign in and continue verify/register flow. */
export async function firebaseResumeRegistration(email, password) {
  const user = await firebaseSignIn(email, password);
  return user;
}

export async function firebaseGetIdToken(user) {
  return user.getIdToken(true);
}

export async function firebaseSignOut() {
  const auth = getFirebaseAuth();
  if (auth) await signOut(auth);
}

export async function firebaseLoginWithBackend(email, password) {
  const user = await firebaseSignIn(email, password);
  if (!user.emailVerified) {
    await firebaseSignOut();
    const err = new Error('email_not_verified');
    err.code = 'email_not_verified';
    throw err;
  }
  const idToken = await firebaseGetIdToken(user);
  const { data } = await authAPI.firebaseAuth({ id_token: idToken });
  return data;
}

export async function firebaseRegisterWithBackend(formPayload, firebaseUser, password) {
  const current = await firebaseRefreshVerifiedUser(formPayload.email, password, firebaseUser);
  if (!current?.emailVerified) {
    const err = new Error('email_not_verified');
    err.code = 'email_not_verified';
    throw err;
  }
  const idToken = await firebaseGetIdToken(current);
  const { data } = await authAPI.firebaseRegister({ ...formPayload, id_token: idToken });
  return data;
}
