'use client';

import { useState, useEffect, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/form-inputs';
import { LoadingButton } from '@/components/ui/LoadingButton';
import Button from '@/components/ui/Button';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { auth, isFirebaseConfigured } from '@/src/lib/firebase/config';
import Image from 'next/image';
import { 
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithCredential
} from 'firebase/auth';
import toast from 'react-hot-toast';
import bridge from '@/src/lib/react-native-bridge';

interface PhoneAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}

export function PhoneAuthModal({ isOpen, onClose, onSuccess }: PhoneAuthModalProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement | null>(null);
  
  // Feature flag to disable phone authentication
  const PHONE_AUTH_DISABLED = true;

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    if (bridge.isInReactNative()) {
      // Use native bridge in React Native WebView
      bridge.signInWithGoogle();
    } else {
      // Web-based Google Sign-In
      if (!auth || !isFirebaseConfigured) {
        toast.error('Firebase is not configured. Please check your environment variables.');
        return;
      }
      
      setIsLoading(true);
      try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        console.log('Google sign-in successful:', result.user);
        toast.success('Signed in with Google!');
        onSuccess();
      } catch (error) {
        console.error('Google sign-in error:', error);
        const firebaseError = error as { code?: string; message?: string };
        if (firebaseError.code === 'auth/popup-closed-by-user') {
          toast.error('Sign-in cancelled');
        } else if (firebaseError.code === 'auth/popup-blocked') {
          toast.error('Pop-up blocked. Please allow pop-ups for this site.');
        } else {
          toast.error(firebaseError.message || 'Failed to sign in with Google');
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle Apple Sign-In
  const handleAppleSignIn = async () => {
    if (bridge.isInReactNative()) {
      // Use native bridge in React Native WebView
      bridge.signInWithApple();
    } else {
      // Web-based Apple Sign-In
      if (!auth || !isFirebaseConfigured) {
        toast.error('Firebase is not configured. Please check your environment variables.');
        return;
      }
      
      setIsLoading(true);
      try {
        const provider = new OAuthProvider('apple.com');
        provider.addScope('email');
        provider.addScope('name');
        
        const result = await signInWithPopup(auth, provider);
        console.log('Apple sign-in successful:', result.user);
        toast.success('Signed in with Apple!');
        onSuccess();
      } catch (error) {
        console.error('Apple sign-in error:', error);
        const firebaseError = error as { code?: string; message?: string };
        if (firebaseError.code === 'auth/popup-closed-by-user') {
          toast.error('Sign-in cancelled');
        } else if (firebaseError.code === 'auth/popup-blocked') {
          toast.error('Pop-up blocked. Please allow pop-ups for this site.');
        } else {
          toast.error(firebaseError.message || 'Failed to sign in with Apple');
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Listen for authentication results from native app
  useEffect(() => {
    const handleAuthSuccess = async (payload: unknown) => {
      console.log('[Web] Received AUTH_SUCCESS from native:', payload);
      setIsLoading(true);
      try {
        // Type guard for the payload
        const authPayload = payload as { idToken?: string; accessToken?: string };
        // Assuming payload contains idToken and accessToken for Google/Apple
        // You might need to adjust this based on what your native app sends
        const credential = GoogleAuthProvider.credential(authPayload.idToken, authPayload.accessToken);
        await signInWithCredential(auth!, credential);
        toast.success('Signed in with Google/Apple!');
        onSuccess();
      } catch (error) {
        console.error('[Web] Error signing in with credential:', error);
        setError('Failed to sign in with Google/Apple. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    const handleAuthError = (payload: unknown) => {
      console.error('[Web] Received AUTH_ERROR from native:', payload);
      const errorPayload = payload as { message?: string };
      setError(errorPayload.message || 'Native authentication failed.');
      setIsLoading(false);
    };

    bridge.onMessage('AUTH_SUCCESS', handleAuthSuccess);
    bridge.onMessage('AUTH_ERROR', handleAuthError);

    // Note: No cleanup needed as bridge handles single instance
  }, [onSuccess]);

  useEffect(() => {
    if (!isOpen || !auth) {
      // Clear reCAPTCHA if modal is closed or auth is not available
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = undefined;
      }
      if (recaptchaContainerRef.current) {
        document.body.removeChild(recaptchaContainerRef.current);
        recaptchaContainerRef.current = null;
      }
      return;
    }

    // Only initialize reCAPTCHA if it hasn't been already
    if (!window.recaptchaVerifier) {
      // Create the container div if it doesn't exist
      if (!recaptchaContainerRef.current) {
        const container = document.createElement('div');
        container.id = 'recaptcha-container-modal';
        document.body.appendChild(container);
        recaptchaContainerRef.current = container;
      }

      try {
        const verifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
          size: 'invisible',
          callback: () => {
            console.log('reCAPTCHA solved');
          },
          'expired-callback': () => {
            setError('reCAPTCHA expired. Please try again.');
            window.recaptchaVerifier?.clear();
          },
        });
        window.recaptchaVerifier = verifier;
        verifier.render().catch((err) => {
            console.error("Error rendering reCAPTCHA:", err);
            if (err.code === 'auth/network-request-failed') {
              setError("Network error. Please check your connection and Firebase configuration.");
            } else if (err.message?.includes('reCAPTCHA')) {
              setError("reCAPTCHA error. Please ensure your domain is authorized in Firebase Console.");
            } else {
              setError("Failed to initialize phone authentication. Please refresh.");
            }
        });
      } catch (err) {
        console.error("Error initializing reCAPTCHA:", err);
        setError("Failed to initialize verification. Please refresh.");
      }
    }

    // Cleanup function when the modal is closed or component unmounts
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = undefined;
      }
      if (recaptchaContainerRef.current) {
        document.body.removeChild(recaptchaContainerRef.current);
        recaptchaContainerRef.current = null;
      }
    };
  }, [isOpen]);

  const handleSendOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    setError('');

    if (!window.recaptchaVerifier) {
      setError('reCAPTCHA is not ready. Please wait a moment.');
      setIsLoading(false);
      return;
    }

    try {
      const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/\D/g, '')}`;
      const confirmation = await signInWithPhoneNumber(
        auth!,
        fullPhoneNumber,
        window.recaptchaVerifier
      );
      
      setConfirmationResult(confirmation);
      setStep('otp');
      toast.success('Verification code sent!');
    } catch (err) {
      console.error('Error sending OTP:', err);
      const firebaseError = err as { code?: string; message?: string };
      
      if (firebaseError.code === 'auth/invalid-phone-number') {
        setError('Invalid phone number. Please check and try again.');
      } else if (firebaseError.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else if (firebaseError.code === 'auth/invalid-app-credential') {
        setError('App configuration error. Check Firebase settings.');
      } else {
        setError('Failed to send code. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    setIsLoading(true);
    setError('');

    if (!confirmationResult) {
      setError('Verification process was interrupted. Please start over.');
      setStep('phone');
      setIsLoading(false);
      return;
    }

    try {
      await confirmationResult.confirm(otp);
      toast.success('Welcome to Thrive!');
      onSuccess();
    } catch (err) {
      console.error('Error verifying OTP:', err);
      const firebaseError = err as { code?: string };
      if (firebaseError.code === 'auth/invalid-verification-code') {
        setError('Invalid verification code. Please try again.');
      } else if (firebaseError.code === 'auth/code-expired') {
        setError('Verification code expired. Please request a new one.');
        setStep('phone');
      } else {
        setError('Failed to verify code. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (countryCode === '+1') {
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
    return digits;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(formatPhoneNumber(e.target.value));
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
  };

  // Reset state when closing the modal
  const handleClose = () => {
    setStep('phone');
    setPhoneNumber('');
    setOtp('');
    setError('');
    setIsLoading(false);
    setConfirmationResult(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={step === 'phone' && PHONE_AUTH_DISABLED ? 'Sign In' : step === 'phone' ? 'Sign In with Phone' : 'Verify Your Number'}
      size="md"
    >
      <div className="space-y-[min(5vw,1.25rem)]">
        {!isFirebaseConfigured && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-900 mb-1">Firebase Not Configured</h4>
                <p className="text-sm text-amber-700">
                  Phone authentication requires Firebase configuration. Please add Firebase environment variables to .env.local file.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {step === 'phone' ? (
          <>
            <div className="flex flex-col items-center mb-[min(6vw,1.5rem)]">
              <div className="shadow-lg relative" style={{ width: 'min(20vw,5rem)', height: 'min(20vw,5rem)', borderRadius: 'min(6vw,1.5rem)', background: 'linear-gradient(135deg, var(--logo-pink), var(--logo-pink-dark))' }}>
                <div style={{ width: 'min(12vw,3rem)', height: 'min(12vw,3rem)', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                  <Image 
                    src="/leaf_wireframe.png" 
                    alt="Thrive" 
                    fill
                    style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
                    priority
                  />
                </div>
              </div>
              <h2 className="font-bold mt-[min(4vw,1rem)]" style={{ fontSize: 'min(7vw,1.75rem)', color: 'var(--logo-pink)' }}>
                Thrive
              </h2>
            </div>
            {!PHONE_AUTH_DISABLED && (
              <>
                <p className="text-center text-gray-600 mb-6">
                  Enter your phone number to receive a verification code.
                </p>
                <div className="flex space-x-3">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="+1">+1</option>
                    {/* Add other country codes as needed */}
                  </select>
                  <Input
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    className="flex-1"
                    inputMode="tel"
                  />
                </div>
                <LoadingButton
                  onClick={handleSendOTP}
                  isLoading={isLoading}
                  fullWidth
                  variant="gradient"
                  gradient={{ from: 'slate-600', to: 'blue-600', direction: 'to-br' }}
                  springAnimation
                  gradientOverlay
                  cardGlow
                  haptic="medium"
                >
                  Send Verification Code
                </LoadingButton>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-[min(4vw,1rem)] bg-white text-gray-500">or</span>
                  </div>
                </div>
              </>
            )}
            {PHONE_AUTH_DISABLED && (
              <p className="text-center text-gray-600 mb-[min(6vw,1.5rem)]" style={{ fontSize: 'min(4vw,1rem)' }}>
                Sign in to share your wellness journey with the community
              </p>
            )}

            <div className="flex flex-col space-y-[min(3vw,0.75rem)]">
              <Button
                onClick={handleGoogleSignIn}
                fullWidth
                variant="outline"
                className="flex items-center justify-center space-x-[min(2vw,0.5rem)]"
                springAnimation
                gradientOverlay
                cardGlow
                haptic="medium"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/google-icon.svg" alt="Google" style={{ width: 'min(5vw,1.25rem)', height: 'min(5vw,1.25rem)' }} loading="lazy" />
                <span style={{ fontSize: 'min(4vw,1rem)' }}>Sign in with Google</span>
              </Button>
              <Button
                onClick={handleAppleSignIn}
                fullWidth
                variant="outline"
                className="flex items-center justify-center space-x-[min(2vw,0.5rem)]"
                springAnimation
                gradientOverlay
                cardGlow
                haptic="medium"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/apple-icon.svg" alt="Apple" style={{ width: 'min(5vw,1.25rem)', height: 'min(5vw,1.25rem)' }} loading="lazy" />
                <span style={{ fontSize: 'min(4vw,1rem)' }}>Sign in with Apple</span>
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <p className="text-center text-gray-600 mb-2">
              We sent a code to:
            </p>
            <p className="text-center font-medium text-gray-900 mb-6">
              {countryCode} {phoneNumber}
            </p>
            <Input
              type="text"
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={handleOtpChange}
              className="text-center text-2xl tracking-widest"
              inputMode="numeric"
              maxLength={6}
            />
            {error && (
              <div className="flex items-center space-x-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
            <LoadingButton
              onClick={handleVerifyOTP}
              isLoading={isLoading}
              fullWidth
              variant="gradient"
              gradient={{ from: 'slate-600', to: 'blue-600', direction: 'to-br' }}
              disabled={otp.length !== 6}
            >
              Verify Code
            </LoadingButton>
            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => {
                  setStep('phone');
                  setError('');
                }}
              >
                Use a different number
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}