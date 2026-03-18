package com.knoweb.HRM.service;

import com.knoweb.HRM.model.Documents;
import com.knoweb.HRM.repository.DocumentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Service
public class DocumentService {

    @Autowired
    private DocumentRepository documentRepository;

    public Documents uploadAllDocuments(
            Long empId,
            MultipartFile cv,
            MultipartFile birthCertificate,
            MultipartFile idCopy,
            MultipartFile policeReport,
            MultipartFile bankPassbook,
            MultipartFile photo,
            MultipartFile appointmentLetter) throws IOException {
        
        if (empId == null) {
            throw new IllegalArgumentException("Employee ID cannot be null");
        }

        Documents document = documentRepository
                .findTopByEmpIdOrderByIdDesc(empId)
                .orElseGet(() -> {
                    Documents d = new Documents();
                    d.setEmpId(empId);
                    return d;
                });

        if (cv != null && !cv.isEmpty()) {
            document.setCv(cv.getBytes());
        }
        if (birthCertificate != null && !birthCertificate.isEmpty()) {
            document.setBirthCertificate(birthCertificate.getBytes());
        }
        if (idCopy != null && !idCopy.isEmpty()) {
            document.setIdCopy(idCopy.getBytes());
        }
        if (policeReport != null && !policeReport.isEmpty()) {
            document.setPoliceReport(policeReport.getBytes());
        }
        if (bankPassbook != null && !bankPassbook.isEmpty()) {
            document.setBankPassbook(bankPassbook.getBytes());
        }
        if (appointmentLetter != null && !appointmentLetter.isEmpty()) {
            document.setAppointmentLetter(appointmentLetter.getBytes());
        }
        if (photo != null && !photo.isEmpty()) {
            document.setPhoto(photo.getBytes());
        }

        try {
            return documentRepository.save(document);
        } catch (Exception e) {
            throw new RuntimeException("Failed to save documents to database: " + e.getMessage(), e);
        }
    }

    // View a specific document by field name
    public byte[] viewDocument(Long docId, String fieldName) {
        Documents document = documentRepository.findById(docId)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        switch (fieldName) {
            case "cv":
                return document.getCv();
            case "birthCertificate":
                return document.getBirthCertificate();
            case "idCopy":
                return document.getIdCopy();
            case "policeReport":
                return document.getPoliceReport();
            case "bankPassbook":
                return document.getBankPassbook();
            case "appointmentLetter":
                return document.getAppointmentLetter();
            case "photo":
                return document.getPhoto();
            default:
                throw new IllegalArgumentException("Invalid field name: " + fieldName);
        }
    }

    public byte[] viewDocument1(Long empId, String fieldName) {
        List<Documents> rows = documentRepository.findAllByEmpIdOrderByIdDesc(empId);

        if (rows == null || rows.isEmpty()) {
            throw new RuntimeException("Document not found for employee ID: " + empId);
        }

        for (Documents document : rows) {
            byte[] documentData;
            switch (fieldName) {
                case "cv":
                    documentData = document.getCv();
                    break;
                case "birthCertificate":
                    documentData = document.getBirthCertificate();
                    break;
                case "idCopy":
                    documentData = document.getIdCopy();
                    break;
                case "policeReport":
                    documentData = document.getPoliceReport();
                    break;
                case "bankPassbook":
                    documentData = document.getBankPassbook();
                    break;
                case "appointmentLetter":
                    documentData = document.getAppointmentLetter();
                    break;
                case "photo":
                    documentData = document.getPhoto();
                    break;
                default:
                    throw new IllegalArgumentException("Invalid field name: " + fieldName);
            }

            if (documentData != null && documentData.length > 0) {
                return documentData;
            }
        }

        throw new RuntimeException("Document '" + fieldName + "' not found for employee ID: " + empId);
    }

    public void deleteDocuments(Long doc_id) {
        documentRepository.deleteById(doc_id);
    }


    public Optional<Documents> getDocumentsByempId(long emp_id) {
        //logger.info("Fetching documents by empId {}", emp_id);
        return documentRepository.findTopByEmpIdOrderByIdDesc(emp_id);
    }

    public Documents updateDocument(Documents documents) {
        return documentRepository.save(documents);
    }

    public Documents saveDocument(Documents documents) {
        return documentRepository.save(documents);
    }
}
