package com.knoweb.HRM.service;

import com.knoweb.HRM.model.CompanyLeave;
import com.knoweb.HRM.model.Unit;
import com.knoweb.HRM.repository.CompanyLeaveRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CompanyLeaveService {


    @Autowired
    private CompanyLeaveRepository companyLeaveRepository;

    public CompanyLeave createCompanyLeave(CompanyLeave companyLeave) {
        return companyLeaveRepository.save(companyLeave);
    }

    public List<CompanyLeave> getLeaveByCompanyId(long cmpId) {
        return companyLeaveRepository.findByCmpId(cmpId);
    }

    public Optional<CompanyLeave> getLeaveById(Long id) {
        return companyLeaveRepository.findById(id);
    }

    public CompanyLeave updateLeave(CompanyLeave companyLeave) {
        // Verify the leave exists and belongs to the same company
        Optional<CompanyLeave> existingLeave = companyLeaveRepository.findById(companyLeave.getId());
        if (!existingLeave.isPresent()) {
            throw new RuntimeException("Leave not found with id: " + companyLeave.getId());
        }
        if (existingLeave.get().getCmpId() != companyLeave.getCmpId()) {
            throw new RuntimeException("Access denied: Leave does not belong to this company");
        }
        
        System.out.println("Updating leave: " + companyLeave.getId() + 
                          ", type: " + companyLeave.getLeaveType() + 
                          ", amount: " + companyLeave.getAmount() + 
                          ", cmpId: " + companyLeave.getCmpId());
        CompanyLeave updated = companyLeaveRepository.save(companyLeave);
        System.out.println("Updated leave: " + updated.getLeaveType() + 
                          ", amount: " + updated.getAmount());
        return updated;
    }

    public void deleteLeave(Long id) {
        try {
            System.out.println("Deleting leave with ID: " + id);
            if (!companyLeaveRepository.existsById(id)) {
                throw new RuntimeException("Leave not found with id: " + id);
            }
            
            // Verify the leave belongs to a company (additional security check)
            Optional<CompanyLeave> leaveToDelete = companyLeaveRepository.findById(id);
            if (leaveToDelete.isPresent()) {
                CompanyLeave leave = leaveToDelete.get();
                System.out.println("Deleting leave belonging to company ID: " + leave.getCmpId());
            }
            
            companyLeaveRepository.deleteById(id);
            System.out.println("Successfully deleted leave with ID: " + id);
        } catch (Exception e) {
            System.err.println("Error deleting leave: " + e.getMessage());
            throw new RuntimeException("Failed to delete leave: " + e.getMessage(), e);
        }
    }
}