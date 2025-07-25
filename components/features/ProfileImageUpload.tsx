'use client';

import React, { useState, useRef } from 'react';
import { Camera, User } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/src/contexts/AuthContext';
import { storage, db } from '@/src/lib/firebase/config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface ProfileImageUploadProps {
  currentImageUrl?: string | null;
  onImageUpdate?: (url: string) => void;
}

export function ProfileImageUpload({ currentImageUrl, onImageUpdate }: ProfileImageUploadProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
      setSelectedFile(file);
      setShowModal(true);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !user || !storage) {
      if (!storage) {
        toast.error('Storage is not configured. Please check Firebase setup.');
      }
      return;
    }

    setIsUploading(true);
    try {
      // Create a unique filename
      const timestamp = Date.now();
      const filename = `profile-images/${user.uid}/${timestamp}-${selectedFile.name}`;
      const storageRef = ref(storage, filename);

      // Upload the file
      const snapshot = await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update user profile in Firestore
      if (db) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          photoURL: downloadURL,
          updatedAt: new Date().toISOString()
        });
      }

      // Delete old image if exists
      if (currentImageUrl && currentImageUrl.includes('firebase') && storage) {
        try {
          const oldImageRef = ref(storage, currentImageUrl);
          await deleteObject(oldImageRef);
        } catch (error) {
          console.log('Error deleting old image:', error);
        }
      }

      onImageUpdate?.(downloadURL);
      toast.success('Profile image updated successfully');
      setShowModal(false);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center">
        <div className="relative">
          <div 
            className="w-[min(24vw,6rem)] h-[min(24vw,6rem)] rounded-full overflow-hidden bg-gradient-to-br from-rose to-burgundy flex items-center justify-center"
            onClick={() => fileInputRef.current?.click()}
          >
            {currentImageUrl ? (
              <Image
                src={currentImageUrl}
                alt="Profile"
                width={96}
                height={96}
                className="object-cover w-full h-full"
              />
            ) : (
              <User className="w-[min(12vw,3rem)] h-[min(12vw,3rem)] text-white" />
            )}
          </div>
          <Button
            variant="gradient"
            className="absolute bottom-0 right-0 w-[min(8vw,2rem)] h-[min(8vw,2rem)] rounded-full p-0 flex items-center justify-center"
            onClick={() => fileInputRef.current?.click()}
            springAnimation
            gradientOverlay
            cardGlow
            haptic="medium"
          >
            <Camera className="w-[min(4vw,1rem)] h-[min(4vw,1rem)] text-white" />
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Update Profile Picture"
        size="md"
      >
        <div className="space-y-[min(4vw,1rem)]">
          {previewImage && (
            <div className="flex justify-center">
              <div className="w-[min(60vw,15rem)] h-[min(60vw,15rem)] rounded-full overflow-hidden bg-gray-100">
                <Image
                  src={previewImage}
                  alt="Preview"
                  width={240}
                  height={240}
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
          )}
          
          <div className="flex gap-[min(3vw,0.75rem)]">
            <Button
              variant="soft"
              onClick={() => setShowModal(false)}
              className="flex-1"
              fullWidth
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              onClick={handleUpload}
              disabled={isUploading}
              className="flex-1"
              springAnimation
              gradientOverlay
              cardGlow
              haptic="medium"
              gradient={{
                from: 'rose',
                to: 'burgundy',
                activeFrom: 'rose/40',
                activeTo: 'burgundy/30'
              }}
            >
              {isUploading ? 'Uploading...' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}