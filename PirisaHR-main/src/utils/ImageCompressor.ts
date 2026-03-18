// import React, { useState, useCallback } from 'react';
// import { toast } from 'react-toastify';

interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number;
}

interface CompressedImage {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

class ImageCompressor {
  private static readonly DEFAULT_OPTIONS: ImageCompressionOptions = {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.8,
    maxSizeKB: 1000, // 1MB target
  };

  /**
   * Compress image file using canvas
   */
  static async compressImage(
    file: File,
    options: ImageCompressionOptions = {}
  ): Promise<CompressedImage> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      img.onload = () => {
        try {
          // Calculate new dimensions
          const { width: newWidth, height: newHeight } = this.calculateDimensions(
            img.width,
            img.height,
            opts.maxWidth!,
            opts.maxHeight!
          );

          canvas.width = newWidth;
          canvas.height = newHeight;

          // Draw and compress image
          ctx.drawImage(img, 0, 0, newWidth, newHeight);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });

              const originalSize = file.size;
              const compressedSize = compressedFile.size;
              const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

              resolve({
                file: compressedFile,
                originalSize,
                compressedSize,
                compressionRatio,
              });
            },
            file.type,
            opts.quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      // Load image with CORS handling
      img.crossOrigin = 'anonymous';
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Calculate new dimensions maintaining aspect ratio
   */
  private static calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    let { width, height } = { width: originalWidth, height: originalHeight };

    // Calculate aspect ratio
    const aspectRatio = width / height;

    // Resize if exceeds max dimensions
    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }

    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }

    return { width: Math.round(width), height: Math.round(height) };
  }

  /**
   * Format file size in human readable format
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Validate image file
   */
  static validateImageFile(file: File): { isValid: boolean; error?: string } {
    // Check if file exists
    if (!file) {
      return { isValid: false, error: 'Please select an image file' };
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      return { isValid: false, error: 'Please select a valid image file' };
    }

    // Check supported formats
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!supportedTypes.includes(file.type)) {
      return { 
        isValid: false, 
        error: 'Unsupported file format. Please use JPEG, PNG, GIF, or WebP' 
      };
    }

    // Check file size (10MB limit)
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return { 
        isValid: false, 
        error: `File size (${this.formatFileSize(file.size)}) exceeds maximum limit (10MB)` 
      };
    }

    return { isValid: true };
  }
}

export default ImageCompressor;
export type { ImageCompressionOptions, CompressedImage };
