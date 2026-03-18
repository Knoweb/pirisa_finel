package com.knoweb.HRM.service;

import com.knoweb.HRM.model.Unit;
import com.knoweb.HRM.model.Designation;
import com.knoweb.HRM.repository.UnitRepository;
import com.knoweb.HRM.repository.DesignationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class DesignationService {

    @Autowired
    private DesignationRepository designationRepository;

    public Designation createDesignation(Designation designation) {
        return designationRepository.save(designation);
    }

    public void deleteDesignation(Long designation_id) {
        try {
            if (!designationRepository.existsById(designation_id)) {
                throw new RuntimeException("Designation not found with id: " + designation_id);
            }
            designationRepository.deleteById(designation_id);
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete designation: " + e.getMessage(), e);
        }
    }
}
