package com.knoweb.HRM.service;

import com.knoweb.HRM.dto.SalaryAdvanceDto;
import com.knoweb.HRM.model.SalaryAdvance;
import com.knoweb.HRM.repository.SalaryAdvanceRepository;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SalaryAdvanceService {

    @Autowired
    private SalaryAdvanceRepository salaryAdvanceRepository;

    public SalaryAdvanceDto createRequest(SalaryAdvanceDto dto) {
        dto.setStatus("PENDING");
        dto.setRequestDate(LocalDateTime.now());
        
        SalaryAdvance advance = new SalaryAdvance();
        BeanUtils.copyProperties(dto, advance);
        
        SalaryAdvance saved = salaryAdvanceRepository.save(advance);
        BeanUtils.copyProperties(saved, dto);
        return dto;
    }

    public List<SalaryAdvanceDto> getByEmployeeId(String employeeId) {
        return salaryAdvanceRepository.findByEmployeeId(employeeId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<SalaryAdvanceDto> getByStatusAndCmpId(String status, Long cmpId) {
        if (cmpId == null) {
            return salaryAdvanceRepository.findByStatus(status)
                    .stream().map(this::toDto).collect(Collectors.toList());
        }
        return salaryAdvanceRepository.findByStatusAndCmpId(status, cmpId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<SalaryAdvanceDto> getByStatus(String status) {
        return salaryAdvanceRepository.findByStatus(status)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public SalaryAdvanceDto updateStatus(Long id, String status, String approvedBy) {
        SalaryAdvance advance = salaryAdvanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Advance request not found"));
        
        advance.setStatus(status);
        if ("APPROVED".equals(status) || "REJECTED".equals(status)) {
            advance.setApprovedBy(approvedBy);
        }
        
        SalaryAdvance saved = salaryAdvanceRepository.save(advance);
        return toDto(saved);
    }
    
    private SalaryAdvanceDto toDto(SalaryAdvance entity) {
        SalaryAdvanceDto dto = new SalaryAdvanceDto();
        BeanUtils.copyProperties(entity, dto);
        return dto;
    }
}