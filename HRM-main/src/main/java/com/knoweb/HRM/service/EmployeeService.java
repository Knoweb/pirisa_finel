package com.knoweb.HRM.service;

import com.knoweb.HRM.config.SecurityConfig;
import com.knoweb.HRM.dto.*;
import com.knoweb.HRM.model.Attendance;
import com.knoweb.HRM.model.Employee;
import com.knoweb.HRM.repository.EmployeeRepository;
import com.knoweb.HRM.service.hikvision.HikvisionProvisioningService;
import com.knoweb.HRM.service.hikvision.HikvisionProvisioningResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class EmployeeService {


    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    @Autowired
    private HikvisionProvisioningService hikvisionProvisioningService;

//    public Employee createEmployee(Employee employee) {
//        return employeeRepository.save(employee);
//    }




    public Employee createEmployee(Employee emp) {
        emp.setUsername(emp.getEmail());
        // 1) Generate a secure random temporary password (12 chars alphanumeric)
        String tempPwd = new SecureRandom()
                .ints(12, 0, 36)
                .mapToObj(i -> "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                        .charAt(i))
                .map(Object::toString)
                .collect(Collectors.joining());

        // 2) Hash & set on entity
        emp.setPassword(passwordEncoder.encode(tempPwd));
        emp.setMustReset(true);
        emp.setDeviceSyncStatus("PENDING");
        emp.setDeviceSyncError(null);
        emp.setDeviceSyncAt(LocalDateTime.now());

        // 3) Save to DB
        Employee saved = employeeRepository.saveAndFlush(emp);

        // 4) Email the temporary password
        String subject = "Your HRM Account Details";
        String body = String.format(
                "Hello %s,\n\n" +
                        "Your account has been created. Please log in with this temporary password:\n\n" +
                        "    %s\n\n" +
                        "For security, you will be prompted to choose a new password on first login.\n\n" +
                        "— The HRM Team",
                emp.getFirst_name(), tempPwd
        );
        emailService.sendEmail(emp.getEmail(), subject, body);

        HikvisionProvisioningResult provisioningResult = hikvisionProvisioningService.syncEmployeeToDevice(saved);
        applyDeviceSyncResult(saved, provisioningResult);

        return saved;
    }




    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    public Employee getEmployeeById(long id) {
        Optional<Employee> optionalUser = employeeRepository.findById(id);
        return optionalUser.orElse(null);
    }

    public List<Employee> getEmployeesByCompanyId(long cmpId) {
        return employeeRepository.findByCmpId(cmpId);
    }


    public void deleteEmployee(Long emp_id) {
        employeeRepository.deleteEmployee(emp_id);
    }

    public List<AttendanceEmployeeDTO> getAttendanceByCompanyId(long cmpId) {
        List<Employee> employees = employeeRepository.findByCmpId(cmpId);

        return employees.stream().map(employee -> new AttendanceEmployeeDTO(
                employee.getId(),
                employee.getEpf_no(),
                employee.getFirst_name(),
                employee.getLast_name(),
                employee.getBasic_salary(),
                employee.getEmail(),
                employee.getGender(),
                employee.getPhone(),
                employee.getAddress(),
                employee.getDate_of_joining(),
                employee.getNic(),
                employee.getDob(),
                employee.getStatus(),
                employee.getAttendanceList().stream().map(attendance -> new AttendanceDTO(
                        attendance.getId(),
                        attendance.getStartedAt(),
                        attendance.getEndedAt(),
                        attendance.getWorking_status(),
                        attendance.getAttendance_status(),
                        attendance.getTotalTime(),
                        attendance.getDayName()

                )).collect(Collectors.toList()),
                new EmpDetailsDepartmentDTO(
                        (employee.getDepartment() != null) ? employee.getDepartment().getId(): null,
                        (employee.getDepartment() != null) ? employee.getDepartment().getDpt_name(): null,
                        (employee.getDepartment() != null) ? employee.getDepartment().getDpt_code(): null,
                        (employee.getDepartment() != null) ? employee.getDepartment().getDpt_desc(): null
                ),
                new EmpDetailsDocumentsDTO(
                        (employee.getDocuments() != null) ? employee.getDocuments().getPhoto() : null
                )
        )).collect(Collectors.toList());
    }


    public List<PayroleEmployeeDTO> getPayroleByCompanyId(long cmpId) {
        List<Employee> employees = employeeRepository.findByCmpId(cmpId);

        return employees.stream().map(employee -> new PayroleEmployeeDTO(
                employee.getId(),
                employee.getEpf_no(),
                employee.getFirst_name(),
                employee.getLast_name(),
                employee.getBasic_salary(),
                employee.getEmail(),
                employee.getGender(),
                employee.getPhone(),
                employee.getAddress(),
                employee.getDate_of_joining(),
                employee.getNic(),
                employee.getDob(),
                employee.getStatus(),
                employee.getPayroleList().stream().map(payrole -> new PayroleDTO(
                        payrole.getId(),
                        payrole.getYear(),
                        payrole.getMonth(),
                        payrole.getAllowance(),
                        payrole.getOvertime_pay(),
                        payrole.getBonus_pay(),
                        payrole.getAppit(),
                        payrole.getLoan(),
                        payrole.getOther_deductions(),
                        payrole.getEpf_8(),
                        payrole.getTotal_earnings(),
                        payrole.getTotal_deductions(),
                        payrole.getNet_salary(),
                        payrole.getBasic_salary()

                )).collect(Collectors.toList())
        )).collect(Collectors.toList());
    }



    public List<PayroleEmployeeDTO> getPayroleByEmployeeId(long empId) {
        List<Employee> employees = employeeRepository.findEmployeeById(empId);

        return employees.stream().map(employee -> new PayroleEmployeeDTO(
                employee.getId(),
                employee.getEpf_no(),
                employee.getFirst_name(),
                employee.getLast_name(),
                employee.getBasic_salary(),
                employee.getEmail(),
                employee.getGender(),
                employee.getPhone(),
                employee.getAddress(),
                employee.getDate_of_joining(),
                employee.getNic(),
                employee.getDob(),
                employee.getStatus(),
                employee.getPayroleList().stream().map(payrole -> new PayroleDTO(
                        payrole.getId(),
                        payrole.getYear(),
                        payrole.getMonth(),
                        payrole.getAllowance(),
                        payrole.getOvertime_pay(),
                        payrole.getBonus_pay(),
                        payrole.getAppit(),
                        payrole.getLoan(),
                        payrole.getOther_deductions(),
                        payrole.getEpf_8(),
                        payrole.getTotal_earnings(),
                        payrole.getTotal_deductions(),
                        payrole.getNet_salary(),
                        payrole.getBasic_salary()

                )).collect(Collectors.toList())
        )).collect(Collectors.toList());
    }



    public List<EmpDetailsDTO> getEmpDetailsByCompanyId(long cmpId) {
        List<Employee> employees = employeeRepository.findByCmpId(cmpId);
        return employees.stream().map(employee -> {
            // Map the leave list if available, else return an empty list
            List<EmpDetailsLeaveDTO> leaveList = employee.getEmployeeLeaves() != null
                    ? employee.getEmployeeLeaves().stream().map(leave -> new EmpDetailsLeaveDTO(
                    leave.getId(),
                    leave.getLeaveType(),
                    leave.getLeaveReason(),
                    leave.getLeaveStatus(),
                    leave.getLeaveStartDay(),
                    leave.getLeaveEndDay(),
                    leave.getLeaveDays()

            )).collect(Collectors.toList())
                    : Collections.emptyList();

            return withDeviceSync(new EmpDetailsDTO(
                    employee.getId(),
                    employee.getEpf_no(),
                    employee.getFirst_name(),
                    employee.getLast_name(),
                    employee.getBasic_salary(),
                    employee.getEmail(),
                    employee.getGender(),
                    employee.getPhone(),
                    employee.getAddress(),
                    employee.getDate_of_joining(),
                    employee.getNic(),
                    employee.getDob(),
                    employee.getStatus(),

                    new EmpDetailsDepartmentDTO(
                            employee.getDepartment() != null ? employee.getDepartment().getId() : null,
                            employee.getDepartment() != null ? employee.getDepartment().getDpt_name() : null,
                            employee.getDepartment() != null ? employee.getDepartment().getDpt_code() : null,
                            employee.getDepartment() != null ? employee.getDepartment().getDpt_desc() : null
                    ),
                    new EmpDetailsDesignationDTO(
                            employee.getDesignation() != null ? employee.getDesignation().getId() : null,
                            employee.getDesignation() != null ? employee.getDesignation().getDesignation() : null
                    ),
                    new EmpDetailsDocumentsDTO(
                            employee.getDocuments() != null ? employee.getDocuments().getPhoto() : null
                    ),
                    leaveList,
                    null, null, null
            ), employee);
        }).collect(Collectors.toList());
    }





    public List<EmpDetailsDTO> getEmpDetailsByEmpId(long empId) {
        List<Employee> employees = employeeRepository.findEmployeeById(empId);
        return employees.stream().map(employee -> {
            // Map the leave list if available, else return an empty list
            List<EmpDetailsLeaveDTO> leaveList = employee.getEmployeeLeaves() != null
                    ? employee.getEmployeeLeaves().stream().map(leave -> new EmpDetailsLeaveDTO(
                    leave.getId(),
                    leave.getLeaveType(),
                    leave.getLeaveReason(),
                    leave.getLeaveStatus(),
                    leave.getLeaveStartDay(),
                    leave.getLeaveEndDay(),
                    leave.getLeaveDays()

            )).collect(Collectors.toList())
                    : Collections.emptyList();

            return withDeviceSync(new EmpDetailsDTO(
                    employee.getId(),
                    employee.getEpf_no(),
                    employee.getFirst_name(),
                    employee.getLast_name(),
                    employee.getBasic_salary(),
                    employee.getEmail(),
                    employee.getGender(),
                    employee.getPhone(),
                    employee.getAddress(),
                    employee.getDate_of_joining(),
                    employee.getNic(),
                    employee.getDob(),
                    employee.getStatus(),

                    new EmpDetailsDepartmentDTO(
                            employee.getDepartment() != null ? employee.getDepartment().getId() : null,
                            employee.getDepartment() != null ? employee.getDepartment().getDpt_name() : null,
                            employee.getDepartment() != null ? employee.getDepartment().getDpt_code() : null,
                            employee.getDepartment() != null ? employee.getDepartment().getDpt_desc() : null
                    ),
                    new EmpDetailsDesignationDTO(
                            employee.getDesignation() != null ? employee.getDesignation().getId() : null,
                            employee.getDesignation() != null ? employee.getDesignation().getDesignation() : null
                    ),
                    new EmpDetailsDocumentsDTO(
                            employee.getDocuments() != null ? employee.getDocuments().getPhoto() : null
                    ),
                    leaveList,
                    null, null, null
            ), employee);
        }).collect(Collectors.toList());
    }






    public List<EmpDetailsDTO> getPendingEmpDetailsByCompanyId(long cmpId) {
        List<Employee> employees = employeeRepository.findByCmpId(cmpId);
        return employees.stream()
                // Filter to include only employees with at least one PENDING leave
                .filter(employee -> employee.getEmployeeLeaves() != null &&
                        employee.getEmployeeLeaves().stream().anyMatch(leave -> "PENDING".equals(leave.getLeaveStatus())))
                .map(employee -> {
                    // Map only the PENDING leave records
                    List<EmpDetailsLeaveDTO> leaveList = employee.getEmployeeLeaves().stream()
                            .filter(leave -> "PENDING".equals(leave.getLeaveStatus()))
                            .map(leave -> new EmpDetailsLeaveDTO(
                                    leave.getId(),
                                    leave.getLeaveType(),
                                    leave.getLeaveReason(),
                                    leave.getLeaveStatus(),
                                    leave.getLeaveStartDay(),
                                    leave.getLeaveEndDay(),
                                    leave.getLeaveDays()
                            ))
                            .collect(Collectors.toList());

                    return withDeviceSync(new EmpDetailsDTO(
                            employee.getId(),
                            employee.getEpf_no(),
                            employee.getFirst_name(),
                            employee.getLast_name(),
                            employee.getBasic_salary(),
                            employee.getEmail(),
                            employee.getGender(),
                            employee.getPhone(),
                            employee.getAddress(),
                            employee.getDate_of_joining(),
                            employee.getNic(),
                            employee.getDob(),
                            employee.getStatus(),
                            new EmpDetailsDepartmentDTO(
                                    employee.getDepartment() != null ? employee.getDepartment().getId() : null,
                                    employee.getDepartment() != null ? employee.getDepartment().getDpt_name() : null,
                                    employee.getDepartment() != null ? employee.getDepartment().getDpt_code() : null,
                                    employee.getDepartment() != null ? employee.getDepartment().getDpt_desc() : null
                            ),
                            new EmpDetailsDesignationDTO(
                                    employee.getDesignation() != null ? employee.getDesignation().getId() : null,
                                    employee.getDesignation() != null ? employee.getDesignation().getDesignation() : null
                            ),
                            new EmpDetailsDocumentsDTO(
                                    employee.getDocuments() != null ? employee.getDocuments().getPhoto() : null
                            ),
                            leaveList, null, null, null
                    ), employee);
                }).collect(Collectors.toList());
    }


    public List<EmpDetailsDTO> getApprovedEmpDetailsByCompanyId(long cmpId) {
        List<Employee> employees = employeeRepository.findByCmpId(cmpId);
        return employees.stream()
                // Filter to include only employees with at least one APPROVED leave
                .filter(employee -> employee.getEmployeeLeaves() != null &&
                        employee.getEmployeeLeaves().stream().anyMatch(leave -> "APPROVED".equals(leave.getLeaveStatus())))
                .map(employee -> {
                    // Map only the APPROVED leave records
                    List<EmpDetailsLeaveDTO> leaveList = employee.getEmployeeLeaves().stream()
                            .filter(leave -> "APPROVED".equals(leave.getLeaveStatus()))
                            .map(leave -> new EmpDetailsLeaveDTO(
                                    leave.getId(),
                                    leave.getLeaveType(),
                                    leave.getLeaveReason(),
                                    leave.getLeaveStatus(),
                                    leave.getLeaveStartDay(),
                                    leave.getLeaveEndDay(),
                                    leave.getLeaveDays()
                            ))
                            .collect(Collectors.toList());

                    return withDeviceSync(new EmpDetailsDTO(
                            employee.getId(),
                            employee.getEpf_no(),
                            employee.getFirst_name(),
                            employee.getLast_name(),
                            employee.getBasic_salary(),
                            employee.getEmail(),
                            employee.getGender(),
                            employee.getPhone(),
                            employee.getAddress(),
                            employee.getDate_of_joining(),
                            employee.getNic(),
                            employee.getDob(),
                            employee.getStatus(),
                            new EmpDetailsDepartmentDTO(
                                    employee.getDepartment() != null ? employee.getDepartment().getId() : null,
                                    employee.getDepartment() != null ? employee.getDepartment().getDpt_name() : null,
                                    employee.getDepartment() != null ? employee.getDepartment().getDpt_code() : null,
                                    employee.getDepartment() != null ? employee.getDepartment().getDpt_desc() : null
                            ),
                            new EmpDetailsDesignationDTO(
                                    employee.getDesignation() != null ? employee.getDesignation().getId() : null,
                                    employee.getDesignation() != null ? employee.getDesignation().getDesignation() : null
                            ),
                            new EmpDetailsDocumentsDTO(
                                    employee.getDocuments() != null ? employee.getDocuments().getPhoto() : null
                            ),
                            leaveList, null, null, null
                    ), employee);
                }).collect(Collectors.toList());
    }



    public List<EmpDetailsDTO> getRejectedEmpDetailsByCompanyId(long cmpId) {
        List<Employee> employees = employeeRepository.findByCmpId(cmpId);
        return employees.stream()
                // Filter to include only employees with at least one REJECTED leave
                .filter(employee -> employee.getEmployeeLeaves() != null &&
                        employee.getEmployeeLeaves().stream().anyMatch(leave -> "REJECTED".equals(leave.getLeaveStatus())))
                .map(employee -> {
                    // Map only the REJECTED leave records
                    List<EmpDetailsLeaveDTO> leaveList = employee.getEmployeeLeaves().stream()
                            .filter(leave -> "REJECTED".equals(leave.getLeaveStatus()))
                            .map(leave -> new EmpDetailsLeaveDTO(
                                    leave.getId(),
                                    leave.getLeaveType(),
                                    leave.getLeaveReason(),
                                    leave.getLeaveStatus(),
                                    leave.getLeaveStartDay(),
                                    leave.getLeaveEndDay(),
                                    leave.getLeaveDays()
                            ))
                            .collect(Collectors.toList());

                    return withDeviceSync(new EmpDetailsDTO(
                            employee.getId(),
                            employee.getEpf_no(),
                            employee.getFirst_name(),
                            employee.getLast_name(),
                            employee.getBasic_salary(),
                            employee.getEmail(),
                            employee.getGender(),
                            employee.getPhone(),
                            employee.getAddress(),
                            employee.getDate_of_joining(),
                            employee.getNic(),
                            employee.getDob(),
                            employee.getStatus(),
                            new EmpDetailsDepartmentDTO(
                                    employee.getDepartment() != null ? employee.getDepartment().getId() : null,
                                    employee.getDepartment() != null ? employee.getDepartment().getDpt_name() : null,
                                    employee.getDepartment() != null ? employee.getDepartment().getDpt_code() : null,
                                    employee.getDepartment() != null ? employee.getDepartment().getDpt_desc() : null
                            ),
                            new EmpDetailsDesignationDTO(
                                    employee.getDesignation() != null ? employee.getDesignation().getId() : null,
                                    employee.getDesignation() != null ? employee.getDesignation().getDesignation() : null
                            ),
                            new EmpDetailsDocumentsDTO(
                                    employee.getDocuments() != null ? employee.getDocuments().getPhoto() : null
                            ),
                            leaveList, null, null, null
                    ), employee);
                }).collect(Collectors.toList());
    }






    public List<AttendanceEmployeeDTO> getLastAttendanceByCompanyId(long cmpId) {
        List<Employee> employees = employeeRepository.findByCmpId(cmpId);

        return employees.stream().map(employee -> {
            // Get the latest attendance record
            Attendance latestAttendance = employee.getAttendanceList().stream()
                    .max(Comparator.comparing(Attendance::getStartedAt))
                    .orElse(null);

            List<AttendanceDTO> latestAttendanceList = new ArrayList<>();
            if (latestAttendance != null) {
                latestAttendanceList.add(new AttendanceDTO(
                        latestAttendance.getId(),
                        latestAttendance.getStartedAt(),
                        latestAttendance.getEndedAt(),
                        latestAttendance.getWorking_status(),
                        latestAttendance.getAttendance_status(),
                        latestAttendance.getTotalTime(),
                        latestAttendance.getDayName()
                ));
            }
            EmpDetailsDepartmentDTO departmentDTO = (employee.getDepartment() != null) ?
                    new EmpDetailsDepartmentDTO(
                            employee.getDepartment().getId(),
                            employee.getDepartment().getDpt_name(),
                            employee.getDepartment().getDpt_code(),
                            employee.getDepartment().getDpt_desc()
                    ) : null;

            EmpDetailsDocumentsDTO documentDTO = (employee.getDocuments() != null) ?
                    new EmpDetailsDocumentsDTO(
                            employee.getDocuments().getPhoto(),
                            employee.getDocuments().getPhoto() != null ? 
                                "http://localhost:8080/api/profile-image/view/" + employee.getId() : null) : null;

            return new AttendanceEmployeeDTO(
                    employee.getId(),
                    employee.getEpf_no(),
                    employee.getFirst_name(),
                    employee.getLast_name(),
                    employee.getBasic_salary(),
                    employee.getEmail(),
                    employee.getGender(),
                    employee.getPhone(),
                    employee.getAddress(),
                    employee.getDate_of_joining(),
                    employee.getNic(),
                    employee.getDob(),
                    employee.getStatus(),
                    latestAttendanceList,
                    departmentDTO,
                    documentDTO
            );
        }).collect(Collectors.toList());
    }




    public List<EmpDetailsDTO> getApprovedEmpDetailsByCompanyIdAndDate(long cmpId, LocalDate date) {
        List<Employee> employees = employeeRepository.findByCmpId(cmpId);

        return employees.stream()
                // Filter only employees that have at least one APPROVED leave record covering the provided date
                .filter(employee -> employee.getEmployeeLeaves() != null &&
                        employee.getEmployeeLeaves().stream().anyMatch(leave ->
                                leave.getLeaveStartDay() != null && leave.getLeaveEndDay() != null &&
                                        !date.isBefore(leave.getLeaveStartDay().toLocalDate()) &&
                                        !date.isAfter(leave.getLeaveEndDay().toLocalDate()) &&
                                        "APPROVED".equalsIgnoreCase(leave.getLeaveStatus())))
                .map(employee -> {
                    // Filter only the leave records that are APPROVED and where the date falls between leaveStartDay and leaveEndDay
                    List<EmpDetailsLeaveDTO> leaveList = employee.getEmployeeLeaves().stream()
                            .filter(leave -> leave.getLeaveStartDay() != null && leave.getLeaveEndDay() != null &&
                                    !date.isBefore(leave.getLeaveStartDay().toLocalDate()) &&
                                    !date.isAfter(leave.getLeaveEndDay().toLocalDate()) &&
                                    "APPROVED".equalsIgnoreCase(leave.getLeaveStatus()))
                            .map(leave -> new EmpDetailsLeaveDTO(
                                    leave.getId(),
                                    leave.getLeaveType(),
                                    leave.getLeaveReason(),
                                    leave.getLeaveStatus(),
                                    leave.getLeaveStartDay(),
                                    leave.getLeaveEndDay(),
                                    leave.getLeaveDays()

                            ))
                            .collect(Collectors.toList());
                    return withDeviceSync(new EmpDetailsDTO(
                            employee.getId(),
                            employee.getEpf_no(),
                            employee.getFirst_name(),
                            employee.getLast_name(),
                            employee.getBasic_salary(),
                            employee.getEmail(),
                            employee.getGender(),
                            employee.getPhone(),
                            employee.getAddress(),
                            employee.getDate_of_joining(),
                            employee.getNic(),
                            employee.getDob(),
                            employee.getStatus(),
 
                            new EmpDetailsDepartmentDTO(
                                    employee.getDepartment() != null ? employee.getDepartment().getId() : null,
                                    employee.getDepartment() != null ? employee.getDepartment().getDpt_name() : null,
                                    employee.getDepartment() != null ? employee.getDepartment().getDpt_code() : null,
                                    employee.getDepartment() != null ? employee.getDepartment().getDpt_desc() : null
                            ),
                            new EmpDetailsDesignationDTO(
                                    employee.getDesignation() != null ? employee.getDesignation().getId() : null,
                                    employee.getDesignation() != null ? employee.getDesignation().getDesignation() : null
                            ),
                            new EmpDetailsDocumentsDTO(
                                    employee.getDocuments() != null ? employee.getDocuments().getPhoto() : null
                            ),
                            leaveList, null, null, null
                    ), employee);

                }).collect(Collectors.toList());
    }



    public Employee updateEmployee(Long emp_id, Employee updateEmployee) {
        Employee employee = getEmployeeById(emp_id);
        if (employee != null) {
            employee.setEpf_no(updateEmployee.getEpf_no());
            employee.setEmp_no(updateEmployee.getEmp_no());
            employee.setFirst_name(updateEmployee.getFirst_name());
            employee.setLast_name(updateEmployee.getLast_name());
            employee.setBasic_salary(updateEmployee.getBasic_salary());
            employee.setEmail(updateEmployee.getEmail());
            // Keep username in sync with email (login identifier)
            employee.setUsername(updateEmployee.getEmail());
            employee.setGender(updateEmployee.getGender());
            employee.setDob(updateEmployee.getDob());
            employee.setPhone(updateEmployee.getPhone());
            employee.setAddress(updateEmployee.getAddress());
            employee.setDate_of_joining(updateEmployee.getDate_of_joining());
            employee.setNic(updateEmployee.getNic());
            if (updateEmployee.getStatus() != null && !updateEmployee.getStatus().trim().isEmpty()) {
                employee.setStatus(updateEmployee.getStatus());
            }
            employee.setCmpId(updateEmployee.getCmpId());
            employee.setDptId(updateEmployee.getDptId());
            employee.setDesignationId(updateEmployee.getDesignationId());
            employee.setDeviceSyncStatus("PENDING");
            employee.setDeviceSyncError(null);
            employee.setDeviceSyncAt(LocalDateTime.now());
            Employee saved = employeeRepository.saveAndFlush(employee);
            HikvisionProvisioningResult provisioningResult = hikvisionProvisioningService.syncEmployeeToDevice(saved);
            applyDeviceSyncResult(saved, provisioningResult);
            return saved;
        }
        return null;
    }

    private void applyDeviceSyncResult(Employee employee, HikvisionProvisioningResult result) {
        employee.setDeviceSyncStatus(result.getStatus());
        employee.setDeviceSyncError(result.getError());
        employee.setDeviceSyncAt(LocalDateTime.now());
        employeeRepository.saveAndFlush(employee);
    }

    private EmpDetailsDTO withDeviceSync(EmpDetailsDTO dto, Employee employee) {
        dto.setDeviceSyncStatus(employee.getDeviceSyncStatus());
        dto.setDeviceSyncError(employee.getDeviceSyncError());
        dto.setDeviceSyncAt(employee.getDeviceSyncAt());
        return dto;
    }


    public List<AttendanceEmployeeDTO> getAttendanceByCompanyIdAndMonth(long cmpId, int month) {
        return employeeRepository.findByCmpId(cmpId).stream()
                .map(employee -> {
                    // Filter only this month's attendances
                    List<AttendanceDTO> filtered = employee.getAttendanceList().stream()
                            .filter(atd -> atd.getStartedAt().getMonthValue() == month)
                            .map(atd -> new AttendanceDTO(
                                    atd.getId(),
                                    atd.getStartedAt(),
                                    atd.getEndedAt(),
                                    atd.getWorking_status(),
                                    atd.getAttendance_status(),
                                    atd.getTotalTime(),
                                    atd.getDayName()
                            ))
                            .collect(Collectors.toList());

                    return new AttendanceEmployeeDTO(
                            employee.getId(),
                            employee.getEpf_no(),
                            employee.getFirst_name(),
                            employee.getLast_name(),
                            employee.getBasic_salary(),
                            employee.getEmail(),
                            employee.getGender(),
                            employee.getPhone(),
                            employee.getAddress(),
                            employee.getDate_of_joining(),
                            employee.getNic(),
                            employee.getDob(),
                            employee.getStatus(),
                            filtered,
                            // dept DTO
                            new EmpDetailsDepartmentDTO(
                                    Optional.ofNullable(employee.getDepartment())
                                            .map(d -> d.getId()).orElse(null),
                                    Optional.ofNullable(employee.getDepartment())
                                            .map(d -> d.getDpt_name()).orElse(null),
                                    Optional.ofNullable(employee.getDepartment())
                                            .map(d -> d.getDpt_code()).orElse(null),
                                    Optional.ofNullable(employee.getDepartment())
                                            .map(d -> d.getDpt_desc()).orElse(null)
                            ),
                            // documents DTO
                            new EmpDetailsDocumentsDTO(
                                    Optional.ofNullable(employee.getDocuments())
                                            .map(d -> d.getPhoto()).orElse(null)
                            )
                    );
                })
                // drop employees with no attendance in that month
                .filter(dto -> !dto.getAttendanceList().isEmpty())
                .collect(Collectors.toList());
    }



    public Employee changeEmployeePassword(Long empId, String oldPassword, String newPassword) {
        Optional<Employee> employeeOptional = employeeRepository.findById(empId);
        if (!employeeOptional.isPresent()) {
            return null;
        }
        Employee employee = employeeOptional.get();
        // Verify if the provided old password matches the stored password.
        if (!passwordEncoder.matches(oldPassword, employee.getPassword())) {
            throw new IllegalArgumentException("Old password is incorrect");
        }
        // Encrypt the new password using BCrypt and update the company.
        String hashedPassword = passwordEncoder.encode(newPassword);
        employee.setPassword(hashedPassword);
        return employeeRepository.save(employee);
    }


    public String forgotPassword(String email) {
        Employee employee = employeeRepository.findByEmail(email);
        if (employee == null) {
            throw new IllegalArgumentException("No Employee found with the provided email");
        }
        String randomPassword = UUID.randomUUID().toString().substring(0, 8);
        String hashedPassword = passwordEncoder.encode(randomPassword);
        employee.setPassword(hashedPassword);

        employeeRepository.save(employee);


        return randomPassword;
    }



}
