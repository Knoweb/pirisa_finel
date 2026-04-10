package com.knoweb.HRM.repository;

import com.knoweb.HRM.model.SalaryAdvance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SalaryAdvanceRepository extends JpaRepository<SalaryAdvance, Long> {

    List<SalaryAdvance> findByEmployeeId(String employeeId);

    List<SalaryAdvance> findByStatusAndCmpId(String status, Long cmpId);
    
    List<SalaryAdvance> findByStatus(String status);
    
    List<SalaryAdvance> findByRepaymentDeductionMonthAndStatus(String month, String status);
}