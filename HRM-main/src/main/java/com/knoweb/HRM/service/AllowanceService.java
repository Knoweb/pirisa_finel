package com.knoweb.HRM.service;

import com.knoweb.HRM.model.Allowance;
import com.knoweb.HRM.model.CompanyLeave;
import com.knoweb.HRM.repository.AllowanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AllowanceService {

    @Autowired
    private AllowanceRepository allowanceRepository;

    public Allowance createAllowance(Allowance allowance) {
        return allowanceRepository.save(allowance);
    }

    public List<Allowance> getAllowanceByCompanyId(long cmpId) {
        return allowanceRepository.findByCmpId(cmpId);
    }

    public Optional<Allowance> getAllowanceById(Long id) {
        return allowanceRepository.findById(id);
    }

    public Allowance updateAllowance(Allowance allowance) {
        System.out.println("Updating allowance: " + allowance.getId() + 
                          ", name: " + allowance.getAllowanceName() + 
                          ", epf: " + allowance.getEpfEligibleStatus() + 
                          ", cmpId: " + allowance.getCmpId());
        Allowance updated = allowanceRepository.save(allowance);
        System.out.println("Updated allowance: " + updated.getAllowanceName() + 
                          ", epf: " + updated.getEpfEligibleStatus());
        return updated;
    }

    public void deleteAllowance(Long id) {
        try {
            System.out.println("Deleting allowance with ID: " + id);
            if (!allowanceRepository.existsById(id)) {
                throw new RuntimeException("Allowance not found with id: " + id);
            }
            allowanceRepository.deleteById(id);
            System.out.println("Successfully deleted allowance with ID: " + id);
        } catch (Exception e) {
            System.err.println("Error deleting allowance: " + e.getMessage());
            throw new RuntimeException("Failed to delete allowance: " + e.getMessage(), e);
        }
    }
}
