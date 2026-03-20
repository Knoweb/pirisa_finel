package com.knoweb.HRM.controller;

import com.knoweb.HRM.dto.ProfileImageResponse;
import com.knoweb.HRM.model.Documents;
import com.knoweb.HRM.service.DocumentService;
import com.knoweb.HRM.util.ImageValidationUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Optional;

@RestController
@RequestMapping("/profile-image")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://localhost:5174", "http://127.0.0.1:3000", "http://127.0.0.1:3001", "http://127.0.0.1:5174"})
public class ProfileImageController {

    @Autowired
    private DocumentService documentService;

    /**
     * Upload or update profile image for an employee
     */
    @PostMapping(
            path = "/upload/{empId}",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<?> uploadProfileImage(
            @PathVariable Long empId,
            @RequestParam("profileImage") MultipartFile profileImage) {
        
        try {
            // Validate file using utility
            String validationError = ImageValidationUtil.validateImageFile(profileImage);
            if (validationError != null) {
                return ResponseEntity.badRequest().body(ProfileImageResponse.error(validationError));
            }

            // Check if employee exists and has documents
            Optional<Documents> existingDocs = documentService.getDocumentsByempId(empId);
            
            if (existingDocs.isPresent()) {
                // Update existing documents
                Documents documents = existingDocs.get();
                documents.setPhoto(profileImage.getBytes());
                documentService.updateDocument(documents);
            } else {
                // Create new documents entry with just the photo
                Documents newDocuments = new Documents();
                newDocuments.setEmpId(empId);
                newDocuments.setPhoto(profileImage.getBytes());
                documentService.saveDocument(newDocuments);
            }

            ProfileImageResponse response = ProfileImageResponse.success(
                "Profile image uploaded successfully!", 
                empId, 
                profileImage.getSize(), 
                profileImage.getContentType()
            );
            
            return ResponseEntity.ok(response);

        } catch (IOException e) {
            return ResponseEntity.badRequest().body(ProfileImageResponse.error("Failed to process image: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ProfileImageResponse.error("Error uploading profile image: " + e.getMessage()));
        }
    }

    /**
     * Get profile image for an employee
     */
    @GetMapping(
            path = "/view/{empId}",
            produces = {MediaType.IMAGE_JPEG_VALUE, MediaType.IMAGE_PNG_VALUE, MediaType.IMAGE_GIF_VALUE}
    )
    public ResponseEntity<ByteArrayResource> getProfileImage(@PathVariable Long empId) {
        try {
            byte[] imageData = documentService.viewDocument1(empId, "photo");
            
            if (imageData == null || imageData.length == 0) {
                return ResponseEntity.notFound().build();
            }

            ByteArrayResource resource = new ByteArrayResource(imageData);
            HttpHeaders headers = new HttpHeaders();
            
            // Try to determine content type from image data using utility
            String contentType = ImageValidationUtil.getContentTypeFromBytes(imageData);
            headers.setContentType(MediaType.parseMediaType(contentType));
            
            headers.setContentDisposition(ContentDisposition
                    .inline()
                    .filename("profile_" + empId + ImageValidationUtil.getFileExtension(contentType))
                    .build());
            
            headers.setContentLength(imageData.length);

            return new ResponseEntity<>(resource, headers, HttpStatus.OK);

        } catch (RuntimeException e) {
            // Document not found
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Delete profile image for an employee
     */
    @DeleteMapping(
            path = "/delete/{empId}",
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<?> deleteProfileImage(@PathVariable Long empId) {
        try {
            Optional<Documents> existingDocs = documentService.getDocumentsByempId(empId);
            
            if (!existingDocs.isPresent()) {
                return ResponseEntity.badRequest().body(ProfileImageResponse.error("No profile image found for employee"));
            }

            Documents documents = existingDocs.get();
            documents.setPhoto(null);
            documentService.updateDocument(documents);

            ProfileImageResponse response = ProfileImageResponse.success("Profile image deleted successfully!", empId);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ProfileImageResponse.error("Error deleting profile image: " + e.getMessage()));
        }
    }

    /**
     * Check if employee has a profile image
     */
    @GetMapping(
            path = "/exists/{empId}",
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<?> checkProfileImageExists(@PathVariable Long empId) {
        try {
            Optional<Documents> documents = documentService.getDocumentsByempId(empId);
            
            boolean hasImage = documents.isPresent() && 
                             documents.get().getPhoto() != null && 
                             documents.get().getPhoto().length > 0;

            ProfileImageResponse response = ProfileImageResponse.success("Profile image check completed", empId);
            response.setHasProfileImage(hasImage);
            
            if (hasImage) {
                response.setImageSize((long) documents.get().getPhoto().length);
            }
            
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ProfileImageResponse.error("Error checking profile image: " + e.getMessage()));
        }
    }
}
