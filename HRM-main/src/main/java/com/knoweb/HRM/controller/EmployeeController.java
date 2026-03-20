package com.knoweb.HRM.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.knoweb.HRM.dto.AttendanceEmployeeDTO;
import com.knoweb.HRM.dto.EmpDetailsDTO;
import com.knoweb.HRM.dto.PayroleEmployeeDTO;
import com.knoweb.HRM.model.Employee;
import com.knoweb.HRM.service.EmailService;
import com.knoweb.HRM.service.EmployeeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/employee")
public class EmployeeController {

    @Autowired
    private EmployeeService employeeService;


    @Autowired
    private EmailService emailService;



    @GetMapping(value = "/all", produces = {"application/json"})
    public ResponseEntity<?> getAllEmployees() {
        try {
            List<Employee> employees = employeeService.getAllEmployees();

            Map<String, Object> employeeResponse = new HashMap<>();
            employeeResponse.put("resultCode", 100);
            employeeResponse.put("resultDesc", "Successfull");

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("UserList", employees);
            responseBody.put("response", employeeResponse);

            return new ResponseEntity<>(responseBody, HttpStatus.OK);
        } catch (Exception e) {
            return handleException(e);
        }
    }


    @PostMapping(value = "/add_employee", produces = {"application/json"})
    public ResponseEntity<?> addEmployee(@RequestBody Employee employee) {
        try {
            Employee createdEmployee = employeeService.createEmployee(employee);
            if (createdEmployee != null) {
                Map<String, Object> employeeResponse = new HashMap<>();
                employeeResponse.put("resultCode", 100);
                employeeResponse.put("resultDesc", "Successfully Saved");

                Map<String, Object> responseBody = new HashMap<>();
                responseBody.put("Employee", createdEmployee);
                responseBody.put("response", employeeResponse);

                return new ResponseEntity<>(responseBody, HttpStatus.OK);
            } else {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            return handleException(e);
        }
    }

    @GetMapping(value = "/emp/{id}", produces = {"application/json"})
    public ResponseEntity<Map<String, Object>> getEmployeeById(@PathVariable long id) {
        Employee employee = employeeService.getEmployeeById(id);
        if (employee != null) {
            Map<String, Object> employeeResponse = new HashMap<>();
            employeeResponse.put("resultCode", 100);
            employeeResponse.put("resultDesc", "Successful");
            employeeResponse.put("Employee_list", employee);
            return new ResponseEntity<>(employeeResponse, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping(value = "/company/{cmpId}", produces = "application/json")
    public ResponseEntity<?> getEmployeesByCompanyId(@PathVariable long cmpId) {
        try {
            List<Employee> employees = employeeService.getEmployeesByCompanyId(cmpId);
            if (employees.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Collections.singletonMap("message", "No employees found for this company ID"));
            }

            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Successful");
            response.put("EmployeeList", employees);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "An error occurred while fetching employees"));
        }
    }

    @DeleteMapping("/{emp_id}")
    public ResponseEntity<?> deleteEmployee(@PathVariable Long emp_id) {
        try {
            employeeService.deleteEmployee(emp_id);

            Map<String, Object> employeeResponse = new HashMap<>();
            employeeResponse.put("resultCode", 100);
            employeeResponse.put("resultDesc", "Successfully Deleted");

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("id", emp_id);
            responseBody.put("response", employeeResponse);

            return new ResponseEntity<>(responseBody, HttpStatus.OK);
        } catch (Exception e) {
            return handleException(e);
        }
    }

//Attendance List from Company Id
    @GetMapping(value = "/attendanceList/{cmpId}", produces = "application/json")
    public ResponseEntity<?> getAttendanceByCompanyId(@PathVariable long cmpId) {
        try {
            List<AttendanceEmployeeDTO> employees = employeeService.getAttendanceByCompanyId(cmpId);
            if (employees.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Collections.singletonMap("message", "No Attendance List found for this company ID"));
            }

            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Successful");
            response.put("EmployeeList", employees);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "An error occurred while fetching employees"));
        }
    }

    //Attendance List from Company Id only the last attendance
    @GetMapping(value = "/lastattendanceList/{cmpId}", produces = "application/json")
    public ResponseEntity<?> getLastAttendanceByCompanyId(@PathVariable long cmpId) {
        try {
            List<AttendanceEmployeeDTO> employees = employeeService.getLastAttendanceByCompanyId(cmpId);

            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Successful");
            response.put("EmployeeList", employees);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "An error occurred while fetching employees"));
        }
    }


// Get payrole list by Company ID
    @GetMapping(value = "/payroleList/{cmpId}", produces = "application/json")
    public ResponseEntity<?> getPayroleByCompanyId(@PathVariable long cmpId) {
        try {
            List<PayroleEmployeeDTO> employees = employeeService.getPayroleByCompanyId(cmpId);
            if (employees.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Collections.singletonMap("message", "No Payrole List found for this company ID"));
            }

            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Successful");
            response.put("EmployeeList", employees);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "An error occurred while fetching employees"));
        }
    }

//Get payrole List By Employee ID

    @GetMapping(value = "/payroleListEmp/{empId}", produces = "application/json")
    public ResponseEntity<?> getPayroleByEmployeeId(@PathVariable long empId) {
        try {
            List<PayroleEmployeeDTO> employees = employeeService.getPayroleByEmployeeId(empId);
            if (employees.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Collections.singletonMap("message", "No Payrole List found for this employee ID"));
            }

            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Successful");
            response.put("EmployeeList", employees);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "An error occurred while fetching employees"));
        }
    }


    @GetMapping(value = "/EmpDetailsList/{cmp_id}", produces = "application/json")
    public ResponseEntity<?> getEmpDetailsByCompanyId(@PathVariable long cmp_id) {
        try {
            List<EmpDetailsDTO> employees = employeeService.getEmpDetailsByCompanyId(cmp_id);

            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Successful");
            response.put("EmployeeList", employees);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "An error occurred while fetching employees"));
        }
    }


    @GetMapping(value = "/EmpDetailsListByEmp/{empId}", produces = "application/json")
    public ResponseEntity<?> getEmpDetailsByEmpId(@PathVariable long empId) {
        try {
            List<EmpDetailsDTO> employees = employeeService.getEmpDetailsByEmpId(empId);
            if (employees.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Collections.singletonMap("message", "No Leave List found for this Employee ID"));
            }

            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Successful");
            response.put("EmployeeLeaveList", employees);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "An error occurred while fetching employees"));
        }
    }





    //leave status = "PENDING" employees
    @GetMapping(value = "/PendingEmpDetailsList/{cmp_id}", produces = "application/json")
    public ResponseEntity<?> getPendingEmpDetailsByCompanyId(@PathVariable long cmp_id) {
        try {
            List<EmpDetailsDTO> employees = employeeService.getPendingEmpDetailsByCompanyId(cmp_id);

            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Successful");
            response.put("EmployeeList", employees);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "An error occurred while fetching employees"));
        }
    }



    //leave status = "APPROVED" employees
    @GetMapping(value = "/ApprovedEmpDetailsList/{cmp_id}", produces = "application/json")
    public ResponseEntity<?> getApprovedEmpDetailsByCompanyId(@PathVariable long cmp_id) {
        try {
            List<EmpDetailsDTO> employees = employeeService.getApprovedEmpDetailsByCompanyId(cmp_id);

            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Successful");
            response.put("EmployeeList", employees);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "An error occurred while fetching employees"));
        }
    }



    //leave status = "REJECTED" employees
    @GetMapping(value = "/RejectedEmpDetailsList/{cmp_id}", produces = "application/json")
    public ResponseEntity<?> getRejectedEmpDetailsByCompanyId(@PathVariable long cmp_id) {
        try {
            List<EmpDetailsDTO> employees = employeeService.getRejectedEmpDetailsByCompanyId(cmp_id);

            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Successful");
            response.put("EmployeeList", employees);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "An error occurred while fetching employees"));
        }
    }



    // Get employee leave details by Company Id and Date
    @GetMapping(value = "/EmpApprovedLeavesByCmpAndDate/{cmpId}/{date}", produces = "application/json")
    public ResponseEntity<?> getApprovedEmpDetailsByCmpAndDate(
            @PathVariable("cmpId") long cmpId,
            @PathVariable("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            // Retrieve employees with approved leave records matching the provided date
            List<EmpDetailsDTO> empDetailsList = employeeService.getApprovedEmpDetailsByCompanyIdAndDate(cmpId, date);

            if (empDetailsList.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Collections.singletonMap("message", "No approved employee leave records found for this company on the provided date"));
            }

            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Successful");
            response.put("EmployeeList", empDetailsList);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            // Optionally log the error for debugging purposes
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "An error occurred while fetching approved employee leave details"));
        }
    }





    @PutMapping(value = "/{emp_id}", produces = {"application/json"})
    public ResponseEntity<?> updateEmployee(@PathVariable Long emp_id, @RequestBody Employee updateEmployee) {

        Employee employee = employeeService.updateEmployee(emp_id, updateEmployee);
        if (employee != null) {
            Map<String, Object> employeeResponse = new HashMap<>();
            employeeResponse.put("resultCode", 100);
            employeeResponse.put("resultDesc", "Successfully Updated");

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("Employee", employee);
            responseBody.put("response", employeeResponse);

            return new ResponseEntity<>(responseBody, HttpStatus.OK);

        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }



    @GetMapping(value = "/attendanceList/{cmpId}/{month}", produces = "application/json")
    public ResponseEntity<?> getAttendanceByCompanyAndMonth(
            @PathVariable long cmpId,
            @PathVariable  int month) {
        try {
            List<AttendanceEmployeeDTO> list =
                    employeeService.getAttendanceByCompanyIdAndMonth(cmpId, month);

            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Successful");
            response.put("EmployeeList", list);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap(
                            "error",
                            "An error occurred while fetching attendance"
                    ));
        }
    }


    // change employee password.................................................

    @PutMapping(value = "/changePassword/{emp_id}", produces = {"application/json"})
    public ResponseEntity<?> changeEmployeePassword(@PathVariable Long emp_id,
                                                   @RequestBody Map<String, String> passwordChangeRequest) {
        String oldPassword = passwordChangeRequest.get("oldPassword");
        String newPassword = passwordChangeRequest.get("newPassword");

        if (oldPassword == null || oldPassword.trim().isEmpty() ||
                newPassword == null || newPassword.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(
                    Collections.singletonMap("error", "Both old and new passwords must be provided"));
        }

        try {
            Employee updatedEmployee = employeeService.changeEmployeePassword(emp_id, oldPassword, newPassword);
            if (updatedEmployee == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Collections.singletonMap("error", "Employee not found"));
            }

            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Password successfully updated");
            response.put("Company", updatedEmployee.getEmail());

            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "An error occurred while updating the password"));
        }
    }


    @PostMapping(value = "/forgetPassword", produces = "application/json")
    public ResponseEntity<?> forgotPassword(@RequestParam("email") String email) {
        try {
            // Generate a new password and update the company record
            String randomPassword = employeeService.forgotPassword(email);

            // Prepare email content with the new password
            String subject = "Password Reset Request";
            String content = "<p>Your password has been reset successfully.</p>"
                    + "<p>Your new password is: <strong>" + randomPassword + "</strong></p>"
                    + "<p>Please log in and change your password as soon as possible.</p>";

            emailService.sendEmail(email, subject, content);

            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Password reset successfully. The new password has been sent to your email.");
            return new ResponseEntity<>(response, HttpStatus.OK);

        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "An error occurred while processing your request"));
        }
    }


    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleException(Exception e) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("resultCode", 101);
        errorResponse.put("resultDesc", "ERROR");

        String jsonResponse;
        try {
            jsonResponse = new ObjectMapper().writeValueAsString(errorResponse);
        } catch (Exception ex) {
            jsonResponse = "{\"resultCode\":101,\"resultDesc\":\"ERROR\"}";
        }
        return new ResponseEntity<>(jsonResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
