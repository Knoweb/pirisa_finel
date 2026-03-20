package com.knoweb.HRM.controller;

import com.knoweb.HRM.model.Documents;
import com.knoweb.HRM.service.DocumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.SocketTimeoutException;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/document")
public class DocumentController {

    @Autowired
    private DocumentService documentService;

    /**
     * Upload all supported documents for a given employee.
     */
    @PostMapping(
            path = "/upload-all",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<?> uploadAllDocuments(
            @RequestParam("empId") long empId,
            @RequestParam(value = "cv",             required = false) MultipartFile cv,
            @RequestParam(value = "birthCertificate", required = false) MultipartFile birthCertificate,
            @RequestParam(value = "idCopy",         required = false) MultipartFile idCopy,
            @RequestParam(value = "policeReport",   required = false) MultipartFile policeReport,
            @RequestParam(value = "bankPassbook",   required = false) MultipartFile bankPassbook,
            @RequestParam(value = "photo",          required = false) MultipartFile photo,
            @RequestParam(value = "appointmentLetter", required = false) MultipartFile appointmentLetter
    ) throws IOException {
        documentService.uploadAllDocuments(
                empId, cv, birthCertificate, idCopy, policeReport, bankPassbook, photo, appointmentLetter
        );
        Map<String,Object> body = new HashMap<>();
        body.put("resultCode", 100);
        body.put("resultDesc", "All documents uploaded successfully!");
        return ResponseEntity
                .ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(body);
    }

    /**
     * View/download a specific document by its document‐ID and field name.
     */
    @GetMapping(
            path = "/view/{docId}/{fieldName}",
            produces = {
                    MediaType.APPLICATION_PDF_VALUE,
                    MediaType.IMAGE_JPEG_VALUE,
                    MediaType.APPLICATION_OCTET_STREAM_VALUE
            }
    )
    public ResponseEntity<ByteArrayResource> viewDocument(
            @PathVariable Long docId,
            @PathVariable String fieldName) {

        byte[] data = documentService.viewDocument(docId, fieldName);
        String contentType = getContentType(fieldName);

        ByteArrayResource resource = new ByteArrayResource(data);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(contentType));
        headers.setContentDisposition(ContentDisposition
                .inline()
                .filename(fieldName + extractExtension(contentType))
                .build());

        return new ResponseEntity<>(resource, headers, HttpStatus.OK);
    }

    /**
     * Alternative lookup by employee‐ID and field name.
     */
    @GetMapping(
            path = "/view/emp/{empId}/{fieldName}",
            produces = {
                    MediaType.APPLICATION_PDF_VALUE,
                    MediaType.IMAGE_JPEG_VALUE,
                    MediaType.APPLICATION_OCTET_STREAM_VALUE
            }
    )
    public ResponseEntity<ByteArrayResource> viewByEmp(
            @PathVariable Long empId,
            @PathVariable String fieldName) {

        try {
            byte[] data = documentService.viewDocument1(empId, fieldName);
            String contentType = getContentType(fieldName);

            ByteArrayResource resource = new ByteArrayResource(data);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.setContentDisposition(ContentDisposition
                    .inline()
                    .filename(fieldName + extractExtension(contentType))
                    .build());

            return new ResponseEntity<>(resource, headers, HttpStatus.OK);
        } catch (RuntimeException e) {
            // Missing documents are common (not uploaded). Return 204 to avoid noisy 404s in the UI.
            return ResponseEntity.noContent().build();
        }
    }

    /**
     * Delete a document by its ID.
     */
    @DeleteMapping(path = "/{docId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> deleteDocument(@PathVariable("docId") Long docId) {
        documentService.deleteDocuments(docId);

        Map<String,Object> resp = new HashMap<>();
        resp.put("id", docId);
        resp.put("resultCode", 100);
        resp.put("resultDesc", "Successfully Deleted");
        return ResponseEntity.ok(resp);
    }

    /**
     * Global exception handler for all endpoints in this controller.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String,Object>> handleException(Exception e) {
        if (isClientAbort(e)) {
            return ResponseEntity.noContent().build();
        }
        Map<String,Object> error = new HashMap<>();
        error.put("resultCode", 101);
        
        // Provide more specific error messages
        String errorMessage = e.getMessage();
        if (errorMessage != null && errorMessage.contains("Failed to save documents to database")) {
            error.put("resultDesc", "Database error: " + errorMessage);
        } else if (errorMessage != null && errorMessage.contains("Employee ID cannot be null")) {
            error.put("resultDesc", "Employee ID is required");
        } else if (errorMessage != null && errorMessage.contains("Document not found")) {
            error.put("resultDesc", "Document not found");
        } else {
            error.put("resultDesc", "Server error: " + (errorMessage != null ? errorMessage : "Unknown error occurred"));
        }
        
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .contentType(MediaType.APPLICATION_JSON)
                .body(error);
    }

    private boolean isClientAbort(Throwable t) {
        Throwable cur = t;
        while (cur != null) {
            String name = cur.getClass().getName();
            if (name.equals("org.apache.catalina.connector.ClientAbortException")) {
                return true;
            }
            if (cur instanceof SocketTimeoutException) {
                return true;
            }
            cur = cur.getCause();
        }
        return false;
    }

    /** Simple mapping from fieldName to MIME type. */
    private String getContentType(String fn) {
        switch (fn) {
            case "photo":            return MediaType.IMAGE_JPEG_VALUE;
            case "cv":
            case "birthCertificate":
            case "idCopy":
            case "policeReport":
            case "bankPassbook":
            case "appointmentLetter":
                return MediaType.APPLICATION_PDF_VALUE;
            default:
                return MediaType.APPLICATION_OCTET_STREAM_VALUE;
        }
    }

    /** Utility to pick a file-extension from a MIME type. */
    private String extractExtension(String contentType) {
        if (MediaType.APPLICATION_PDF_VALUE.equals(contentType)) {
            return ".pdf";
        } else if (MediaType.IMAGE_JPEG_VALUE.equals(contentType)) {
            return ".jpg";
        } else {
            return "";
        }
    }




    @PutMapping(value = "/update/{emp_id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Documents> updateDocuments(
            @PathVariable long emp_id,
            @RequestParam(required = false) MultipartFile birthCertificate,
            @RequestParam(required = false) MultipartFile cv,
            @RequestParam(required = false) MultipartFile idCopy,
            @RequestParam(required = false) MultipartFile policeReport,
            @RequestParam(required = false) MultipartFile bankPassbook,
            @RequestParam(required = false) MultipartFile appointmentLetter,
            @RequestParam(required = false) MultipartFile photo

    ) throws IOException {
        Optional<Documents> existing = documentService.getDocumentsByempId(emp_id);
        if (!existing.isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(null);
        }

        Documents documents = existing.get();
        if (photo      != null) documents.setPhoto(photo.getBytes());
        if (birthCertificate != null) documents.setBirthCertificate(birthCertificate.getBytes());
        if (idCopy  != null) documents.setIdCopy(idCopy.getBytes());
        if (policeReport != null) documents.setPoliceReport(policeReport.getBytes());
        if (bankPassbook != null) documents.setBankPassbook(bankPassbook.getBytes());
        if (appointmentLetter != null) documents.setAppointmentLetter(appointmentLetter.getBytes());
        if (cv != null) documents.setCv(cv.getBytes());

        Documents updated = documentService.updateDocument(documents);
        return ResponseEntity.ok(updated);
    }
}
