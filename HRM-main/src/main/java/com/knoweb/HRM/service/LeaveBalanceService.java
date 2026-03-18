package com.knoweb.HRM.service;

import com.knoweb.HRM.dto.LeaveBalanceResponseDTO;
import com.knoweb.HRM.dto.LeavePlanBalanceDTO;
import com.knoweb.HRM.model.Company;
import com.knoweb.HRM.model.CompanyLeave;
import com.knoweb.HRM.model.Employee;
import com.knoweb.HRM.model.EmployeeLeave;
import com.knoweb.HRM.repository.CompanyLeaveRepository;
import com.knoweb.HRM.repository.CompanyRepository;
import com.knoweb.HRM.repository.EmployeeLeaveRequestRepository;
import com.knoweb.HRM.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class LeaveBalanceService {

    public enum AsOfMode {
        CURRENT_DATE,
        LAST_CALCULATION_DATE
    }

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private CompanyLeaveRepository companyLeaveRepository;

    @Autowired
    private EmployeeLeaveRequestRepository employeeLeaveRequestRepository;

    public LeaveBalanceResponseDTO getEmployeeLeaveBalances(long empId, AsOfMode asOfMode) {
        Optional<Employee> employeeOpt = employeeRepository.findById(empId);
        if (!employeeOpt.isPresent()) {
            return new LeaveBalanceResponseDTO(
                    101,
                    "Employee not found",
                    empId,
                    null,
                    asOfMode.name(),
                    null,
                    null,
                    null
            );
        }

        Employee employee = employeeOpt.get();
        long cmpId = employee.getCmpId();

        Company company = companyRepository.findById(cmpId).orElse(null);
        LocalDate lastCalcDate = company != null ? company.getLastLeaveCalculationDate() : null;

        LocalDate asOfDate;
        if (asOfMode == AsOfMode.LAST_CALCULATION_DATE) {
            asOfDate = lastCalcDate;
        } else {
            asOfDate = LocalDate.now();
        }

        List<CompanyLeave> companyLeaves = companyLeaveRepository.findByCmpId(cmpId);

        List<EmployeeLeave> approvedLeaves;
        if (asOfMode == AsOfMode.LAST_CALCULATION_DATE) {
            if (asOfDate == null) {
                approvedLeaves = employeeLeaveRequestRepository.findApprovedByEmpId(empId);
            } else {
                LocalDateTime asOfDateTime = LocalDateTime.of(asOfDate, LocalTime.MAX);
                approvedLeaves = employeeLeaveRequestRepository.findApprovedByEmpIdAsOf(empId, asOfDateTime);
            }
        } else {
            approvedLeaves = employeeLeaveRequestRepository.findApprovedByEmpId(empId);
        }

        Map<String, Integer> takenByType = new HashMap<>();
        for (EmployeeLeave el : approvedLeaves) {
            if (el.getLeaveType() == null) {
                continue;
            }
            takenByType.merge(el.getLeaveType(), el.getLeaveDays(), Integer::sum);
        }

        List<LeavePlanBalanceDTO> balances = companyLeaves.stream()
                .map(cl -> {
                    int available = cl.getAmount();
                    int taken = takenByType.getOrDefault(cl.getLeaveType(), 0);
                    int remaining = available - taken;
                    LocalDate calculatedOn = asOfMode == AsOfMode.LAST_CALCULATION_DATE ? asOfDate : null;
                    return new LeavePlanBalanceDTO(cl.getLeaveType(), available, taken, remaining, calculatedOn);
                })
                .collect(Collectors.toList());

        return new LeaveBalanceResponseDTO(
                100,
                "Successful",
                empId,
                cmpId,
                asOfMode.name(),
                asOfDate,
                lastCalcDate,
                balances
        );
    }

    public LeaveBalanceResponseDTO runCompanyLeaveCalculation(long cmpId, LocalDate calculationDate) {
        Company company = companyRepository.findById(cmpId).orElse(null);
        if (company == null) {
            return new LeaveBalanceResponseDTO(
                    101,
                    "Company not found",
                    null,
                    cmpId,
                    AsOfMode.LAST_CALCULATION_DATE.name(),
                    null,
                    null,
                    null
            );
        }

        LocalDate calcDate = calculationDate != null ? calculationDate : LocalDate.now();
        company.setLastLeaveCalculationDate(calcDate);
        companyRepository.save(company);

        return new LeaveBalanceResponseDTO(
                100,
                "Calculation date updated",
                null,
                cmpId,
                AsOfMode.LAST_CALCULATION_DATE.name(),
                calcDate,
                calcDate,
                null
        );
    }
}
