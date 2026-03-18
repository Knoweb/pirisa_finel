package com.knoweb.HRM.util;

import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Arrays;

public class ImageValidationUtil {

    // Allowed image formats and max size (10MB)
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final String[] ALLOWED_CONTENT_TYPES = {
            "image/jpeg",
            "image/jpg", 
            "image/png",
            "image/gif",
            "image/webp"
    };

    // Magic bytes for file type detection
    private static final byte[] PNG_SIGNATURE = {(byte) 0x89, 0x50, 0x4E, 0x47};
    private static final byte[] GIF_SIGNATURE_1 = {0x47, 0x49, 0x46, 0x38}; // GIF87a
    private static final byte[] GIF_SIGNATURE_2 = {0x47, 0x49, 0x46, 0x38}; // GIF89a
    private static final byte[] JPEG_SIGNATURE = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] WEBP_SIGNATURE = {0x52, 0x49, 0x46, 0x46};

    /**
     * Validate uploaded image file
     */
    public static String validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return "Please select an image file";
        }

        // Check file size
        if (file.getSize() > MAX_FILE_SIZE) {
            return "File size must be less than 10MB";
        }

        // Check content type
        String contentType = file.getContentType();
        boolean isValidType = Arrays.asList(ALLOWED_CONTENT_TYPES).contains(contentType);
        if (!isValidType) {
            return "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed";
        }

        // Additional validation: check actual file content
        try {
            byte[] fileBytes = file.getBytes();
            if (!isValidImageContent(fileBytes, contentType)) {
                return "File content does not match the declared file type";
            }
        } catch (IOException e) {
            return "Failed to read file content";
        }

        return null; // No validation errors
    }

    /**
     * Validate actual file content against declared type
     */
    private static boolean isValidImageContent(byte[] fileBytes, String declaredType) {
        if (fileBytes == null || fileBytes.length < 4) {
            return false;
        }

        String detectedType = detectImageType(fileBytes);
        
        // Allow some flexibility between similar types
        if (declaredType.equals("image/jpeg") || declaredType.equals("image/jpg")) {
            return detectedType.equals("image/jpeg");
        }
        
        return declaredType.equals(detectedType);
    }

    /**
     * Detect image type from magic bytes
     */
    public static String detectImageType(byte[] fileBytes) {
        if (fileBytes == null || fileBytes.length < 4) {
            return "unknown";
        }

        // Check PNG
        if (fileBytes.length >= PNG_SIGNATURE.length &&
            Arrays.equals(Arrays.copyOf(fileBytes, PNG_SIGNATURE.length), PNG_SIGNATURE)) {
            return "image/png";
        }

        // Check GIF
        if (fileBytes.length >= 6 &&
            (Arrays.equals(Arrays.copyOf(fileBytes, 4), GIF_SIGNATURE_1) ||
             Arrays.equals(Arrays.copyOf(fileBytes, 4), GIF_SIGNATURE_2))) {
            return "image/gif";
        }

        // Check JPEG
        if (fileBytes.length >= JPEG_SIGNATURE.length &&
            Arrays.equals(Arrays.copyOf(fileBytes, JPEG_SIGNATURE.length), JPEG_SIGNATURE)) {
            return "image/jpeg";
        }

        // Check WebP (more complex signature)
        if (fileBytes.length >= 12 &&
            Arrays.equals(Arrays.copyOf(fileBytes, 4), WEBP_SIGNATURE) &&
            fileBytes[8] == 0x57 && fileBytes[9] == 0x45 && 
            fileBytes[10] == 0x42 && fileBytes[11] == 0x50) { // "WEBP"
            return "image/webp";
        }

        return "unknown";
    }

    /**
     * Get content type from image bytes
     */
    public static String getContentTypeFromBytes(byte[] imageData) {
        String detectedType = detectImageType(imageData);
        
        switch (detectedType) {
            case "image/png":
                return "image/png";
            case "image/gif":
                return "image/gif";
            case "image/webp":
                return "image/webp";
            case "image/jpeg":
                return "image/jpeg";
            default:
                return "image/jpeg"; // default fallback
        }
    }

    /**
     * Get file extension for content type
     */
    public static String getFileExtension(String contentType) {
        switch (contentType) {
            case "image/png":
                return ".png";
            case "image/gif":
                return ".gif";
            case "image/webp":
                return ".webp";
            case "image/jpeg":
            case "image/jpg":
                return ".jpg";
            default:
                return ".jpg";
        }
    }

    /**
     * Check if file is a valid image (basic check)
     */
    public static boolean isValidImage(MultipartFile file) {
        return validateImageFile(file) == null;
    }

    /**
     * Get maximum allowed file size
     */
    public static long getMaxFileSize() {
        return MAX_FILE_SIZE;
    }

    /**
     * Get allowed content types
     */
    public static String[] getAllowedContentTypes() {
        return ALLOWED_CONTENT_TYPES.clone();
    }
}
