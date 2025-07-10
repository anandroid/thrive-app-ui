'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, X, Loader2, CheckCircle } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

// Type assertion for webkit-specific attributes
type WebkitVideoAttributes = {
  'webkit-playsinline'?: string;
};

interface CameraScannerProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
  isProcessing?: boolean;
  processingMessage?: string;
}

export function CameraScanner({ 
  onCapture, 
  onClose, 
  isProcessing = false,
  processingMessage = 'Processing...'
}: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);

  // Initialize camera
  const initializeCamera = useCallback(async () => {
    try {
      setIsVideoReady(false); // Reset video ready state
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      setStream(mediaStream);
      setHasPermission(true);
      
      if (videoRef.current) {
        // Set attributes before srcObject for Android Chrome
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('webkit-playsinline', 'true');
        videoRef.current.setAttribute('autoplay', 'true');
        videoRef.current.setAttribute('muted', 'true');
        videoRef.current.muted = true;
        videoRef.current.autoplay = true;
        
        // Set srcObject
        videoRef.current.srcObject = mediaStream;
        
        // Android Chrome specific fix - add delay before play
        videoRef.current.onloadedmetadata = () => {
          setTimeout(() => {
            videoRef.current?.play().then(() => {
              setIsVideoReady(true);
            }).catch(err => 
              console.error('Video play error:', err)
            );
          }, 100); // 100ms delay for Android Chrome
        };
      }
    } catch (error) {
      console.error('Camera access error:', error);
      setHasPermission(false);
    }
  }, [facingMode]);

  // Cleanup camera stream
  const cleanupCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Initialize on mount and when facing mode changes
  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      if (mounted) {
        await initializeCamera();
      }
    };
    
    init();
    
    return () => {
      mounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]); // Only re-run when facing mode changes

  // Capture image
  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageData);
    
    // Add capture animation
    setTimeout(() => {
      setIsCapturing(false);
    }, 300);
  }, []);

  // Retake photo
  const retake = useCallback(() => {
    setCapturedImage(null);
  }, []);

  // Confirm capture
  const confirmCapture = useCallback(() => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  }, [capturedImage, onCapture]);

  // Toggle camera
  const toggleCamera = useCallback(() => {
    cleanupCamera();
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  }, [cleanupCamera]);

  // Handle close
  const handleClose = useCallback(() => {
    cleanupCamera();
    onClose();
  }, [cleanupCamera, onClose]);

  // Permission denied state
  if (hasPermission === false) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
          <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Camera Access Required</h3>
          <p className="text-sm text-gray-600 mb-6">
            Please allow camera access to scan items for your pantry.
          </p>
          <button
            onClick={handleClose}
            className="w-full py-3 rounded-xl bg-gray-200 text-gray-800 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header - Fixed height */}
      <div className="flex-shrink-0 bg-black/80 backdrop-blur-sm p-4 safe-area-top">
        <div className="flex items-center justify-between">
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center touch-feedback"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          
          <h2 className="text-white font-medium">Scan Item</h2>
          
          {!capturedImage && (
            <button
              onClick={toggleCamera}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center touch-feedback"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area - Flex grow to fill space */}
      <div className="flex-1 relative overflow-hidden">
        {capturedImage ? (
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <OptimizedImage
              src={capturedImage}
              alt="Captured item"
              fill
              className="object-contain"
            />
            
            {/* Processing Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
                <div className="bg-white rounded-2xl p-6 flex flex-col items-center">
                  <Loader2 className="w-8 h-8 text-rose animate-spin mb-3" />
                  <p className="text-sm font-medium text-gray-900">{processingMessage}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* Camera Preview - 60% of remaining height */}
            <div className="flex-[3] relative overflow-hidden bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                {...{ 'webkit-playsinline': 'true' } as WebkitVideoAttributes}
                className={`absolute inset-0 w-full h-full object-cover ${!isVideoReady ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                style={{ WebkitTransform: 'translateZ(0)' }} // Force hardware acceleration
              />

              {/* Loading Overlay - shows while camera initializes */}
              {!isVideoReady && (
                <div className="absolute inset-0 bg-black flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-3" />
                    <p className="text-white text-sm">Initializing camera...</p>
                  </div>
                </div>
              )}

              {/* Scanning Guide - Positioned within camera preview */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative">
                  {/* Scanning frame - Smaller for split view */}
                  <div className="w-48 h-48 md:w-64 md:h-64 border-2 border-white/60 rounded-2xl">
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-white rounded-tl-lg" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-white rounded-tr-lg" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-white rounded-bl-lg" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-white rounded-br-lg" />
                  </div>
                </div>
              </div>

              {/* Capture Animation */}
              {isCapturing && (
                <div className="absolute inset-0 bg-white animate-flash pointer-events-none" />
              )}
            </div>

            {/* Instructions Area - 20% of remaining height */}
            <div className="flex-[1] bg-black/90 backdrop-blur-sm flex items-center justify-center px-6">
              <div className="text-center">
                <p className="text-white text-lg font-medium mb-1">Position item in frame</p>
                <p className="text-white/70 text-sm">
                  Center the product label for best results
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls - Fixed height, 20% of screen */}
      <div className="flex-shrink-0 bg-black/90 backdrop-blur-sm p-6 safe-area-bottom">
        {capturedImage ? (
          <div className="flex items-center justify-around max-w-sm mx-auto">
            <button
              onClick={retake}
              disabled={isProcessing}
              className="px-6 py-3 rounded-full bg-white/20 backdrop-blur text-white font-medium touch-feedback disabled:opacity-50"
            >
              Retake
            </button>
            <button
              onClick={confirmCapture}
              disabled={isProcessing}
              className="px-8 py-3 rounded-full bg-rose text-white font-medium touch-feedback disabled:opacity-50 flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Use Photo
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="text-center">
            <button
              onClick={captureImage}
              disabled={!isVideoReady}
              className="w-20 h-20 rounded-full bg-white flex items-center justify-center touch-feedback mx-auto disabled:opacity-50"
            >
              <div className="w-16 h-16 rounded-full bg-rose flex items-center justify-center">
                <Camera className="w-8 h-8 text-white" />
              </div>
            </button>
            <p className="text-white/70 text-xs mt-3">Tap to capture</p>
          </div>
        )}
      </div>
    </div>
  );
}