'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, X, Loader2, CheckCircle } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

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

  // Initialize camera
  const initializeCamera = useCallback(async () => {
    try {
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
        videoRef.current.srcObject = mediaStream;
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

  // Initialize on mount
  useEffect(() => {
    initializeCamera();
    return cleanupCamera;
  }, [facingMode, initializeCamera, cleanupCamera]);

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
    <div className="fixed inset-0 z-50 bg-black">
      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent p-4 safe-area-top">
        <div className="flex items-center justify-between">
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center touch-feedback"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          
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

      {/* Camera View or Captured Image */}
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
        <>
          {/* Camera Feed */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Scanning Guide */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative">
              {/* Scanning frame */}
              <div className="w-72 h-72 border-2 border-white/50 rounded-3xl">
                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-2 border-l-2 border-white rounded-tl-xl" />
                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-2 border-r-2 border-white rounded-tr-xl" />
                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-2 border-l-2 border-white rounded-bl-xl" />
                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-2 border-r-2 border-white rounded-br-xl" />
              </div>
              
              {/* Instructions */}
              <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 text-center">
                <p className="text-white text-sm font-medium bg-black/50 px-4 py-2 rounded-full backdrop-blur">
                  Position item within frame
                </p>
              </div>
            </div>
          </div>

          {/* Capture Animation */}
          {isCapturing && (
            <div className="absolute inset-0 bg-white animate-flash pointer-events-none" />
          )}
        </>
      )}

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/50 to-transparent p-6 pb-8 safe-area-bottom">
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
              className="w-20 h-20 rounded-full bg-white flex items-center justify-center touch-feedback mx-auto"
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