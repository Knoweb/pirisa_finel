import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import ImageCompressor, { CompressedImage } from '../utils/ImageCompressor';

interface ProfileImageUploadProps {
  employeeId: string;
  token: string;
  onImageChange?: (hasImage: boolean) => void;
}

const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({ 
  employeeId, 
  token, 
  onImageChange 
}) => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hasProfileImage, setHasProfileImage] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<CompressedImage | null>(null);

  useEffect(() => {
    return () => {
      if (profileImage) {
        try {
          URL.revokeObjectURL(profileImage);
        } catch {
          // no-op
        }
      }
    };
  }, [profileImage]);

  useEffect(() => {
    checkProfileImageExists();
  }, [employeeId, token]);

  const loadProfileImage = async () => {
    try {
      const resp = await fetch(
        `/api/profile-image/view/${employeeId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!resp.ok) {
        return;
      }

      const blob = await resp.blob();
      if (!blob || blob.size === 0) {
        return;
      }

      setProfileImage((prev) => {
        if (prev) {
          try {
            URL.revokeObjectURL(prev);
          } catch {
            // no-op
          }
        }
        return URL.createObjectURL(blob);
      });
    } catch {
      // ignore image failures
    }
  };

  const checkProfileImageExists = async () => {
    try {
      const response = await fetch(
        `/api/profile-image/exists/${employeeId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const hasImage = Boolean(data?.hasProfileImage ?? data?.exists);
        setHasProfileImage(hasImage);
        onImageChange?.(hasImage);

        if (hasImage) {
          // If image exists, load it
          await loadProfileImage();
        } else {
          setProfileImage((prev) => {
            if (prev) {
              try {
                URL.revokeObjectURL(prev);
              } catch {
                // no-op
              }
            }
            return null;
          });
        }
      }
    } catch (error) {
      console.error('Error checking profile image:', error);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file first
    const validation = ImageCompressor.validateImageFile(file);
    if (!validation.isValid) {
      toast.error(validation.error || 'Invalid file', {
        position: 'top-center',
        autoClose: 5000,
        closeButton: true,
        pauseOnHover: true,
      });
      return;
    }

    setUploading(true);
    setCompressionInfo(null);

    try {
      // Compress the image
      const compressed = await ImageCompressor.compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.8,
        maxSizeKB: 1000, // Target 1MB
      });

      setCompressionInfo(compressed);

      // Show compression info
      const compressionMsg = `Image compressed: ${ImageCompressor.formatFileSize(compressed.originalSize)} → ${ImageCompressor.formatFileSize(compressed.compressedSize)} (${compressed.compressionRatio.toFixed(1)}% reduction)`;
      
      toast.info(compressionMsg, {
        position: 'top-center',
        autoClose: 3000,
        closeButton: true,
        pauseOnHover: true,
      });

      // Upload compressed image
      const formData = new FormData();
      formData.append('profileImage', compressed.file);

      const response = await fetch(
        `/api/profile-image/upload/${employeeId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (data.resultCode === 100) {
        toast.success('Profile image uploaded successfully!', {
          position: 'top-center',
          autoClose: 3000,
          closeButton: true,
          pauseOnHover: true,
        });
        setHasProfileImage(true);
        onImageChange?.(true);
        await loadProfileImage();
      } else {
        toast.error(data.resultDesc || 'Failed to upload profile image', {
          position: 'top-center',
          autoClose: 5000,
          closeButton: true,
          pauseOnHover: true,
        });
      }
    } catch (error) {
      console.error('Error uploading profile image:', error);
      
      // Enhanced error handling
      let errorMessage = 'Error uploading profile image';
      if (error instanceof Error) {
        if (error.message.includes('Failed to compress')) {
          errorMessage = 'Image compression failed. Please try a different image.';
        } else if (error.message.includes('Failed to load')) {
          errorMessage = 'Failed to process image. Please check if the file is corrupted.';
        } else if (error.message.includes('Canvas context')) {
          errorMessage = 'Browser does not support image compression. Please try a different browser.';
        } else {
          errorMessage = `Upload failed: ${error.message}`;
        }
      }

      toast.error(errorMessage, {
        position: 'top-center',
        autoClose: 5000,
        closeButton: true,
        pauseOnHover: true,
      });
    } finally {
      setUploading(false);
      setTimeout(() => setCompressionInfo(null), 5000); // Clear compression info after 5 seconds
    }
  };

  const handleImageDelete = async () => {
    if (!window.confirm('Are you sure you want to remove the profile image?')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(
        `/api/profile-image/delete/${employeeId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.resultCode === 100) {
        toast.success('Profile image removed successfully!', {
          position: 'top-center',
          autoClose: 3000,
          closeButton: true,
          pauseOnHover: true,
        });
        setProfileImage((prev) => {
          if (prev) {
            try {
              URL.revokeObjectURL(prev);
            } catch {
              // no-op
            }
          }
          return null;
        });
        setHasProfileImage(false);
        onImageChange?.(false);
      } else {
        toast.error(data.resultDesc || 'Failed to remove profile image', {
          position: 'top-center',
          autoClose: 5000,
          closeButton: true,
          pauseOnHover: true,
        });
      }
    } catch (error) {
      console.error('Error removing profile image:', error);
      toast.error('Error removing profile image', {
        position: 'top-center',
        autoClose: 5000,
        closeButton: true,
        pauseOnHover: true,
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 shadow-lg">
          {profileImage ? (
            <img
              src={profileImage}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          )}
        </div>
        
        {/* Upload/Remove buttons overlay */}
        <div className="absolute bottom-0 right-0 flex space-x-1">
          <label className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 cursor-pointer shadow-lg transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={uploading}
            />
            {uploading ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            )}
          </label>
          
          {hasProfileImage && (
            <button
              onClick={handleImageDelete}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-colors"
            >
              {deleting ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
      
      <div className="text-center">
        <p className="text-sm text-gray-600">
          {hasProfileImage ? 'Click camera to update' : 'Click camera to upload photo'}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Supported: JPEG, PNG, GIF, WebP (Max 10MB, auto-compressed to ~1MB)
        </p>
        
        {/* Compression Info */}
        {compressionInfo && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
            <p className="text-blue-700 font-medium">
              📦 Compression Applied:
            </p>
            <p className="text-blue-600">
              Original: {ImageCompressor.formatFileSize(compressionInfo.originalSize)} → 
              Compressed: {ImageCompressor.formatFileSize(compressionInfo.compressedSize)}
            </p>
            <p className="text-green-600 font-medium">
              Size reduced by {compressionInfo.compressionRatio.toFixed(1)}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileImageUpload;
