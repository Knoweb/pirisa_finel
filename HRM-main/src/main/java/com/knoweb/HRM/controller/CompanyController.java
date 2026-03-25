package com.knoweb.HRM.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.knoweb.HRM.config.SecurityConfig;
import com.knoweb.HRM.dto.CompanyDetailsDTO;
import com.knoweb.HRM.dto.EmpDetailsDTO;
import com.knoweb.HRM.model.Company;
import com.knoweb.HRM.model.User;
import com.knoweb.HRM.repository.CompanyRepository;
import com.knoweb.HRM.service.CompanyService;
import com.knoweb.HRM.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/company")
public class CompanyController {

    @Autowired
    private CompanyService companyService;

    @Autowired
    private SecurityConfig bCryptPasswordEncoder;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private EmailService emailService;



    @GetMapping(value = "/all", produces = {"application/json"})
    public ResponseEntity<?> getAllCompany() {
        try {
            List<Company> companies = companyService.getAllCompanies();

            Map<String, Object> companyResponse = new HashMap<>();
            companyResponse.put("resultCode", 100);
            companyResponse.put("resultDesc", "Successfull");

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("CompanyList", companies);
            responseBody.put("response", companyResponse);

            return new ResponseEntity<>(responseBody, HttpStatus.OK);
        } catch (Exception e) {
            return handleException(e);
        }
    }

    @PostMapping(value = "/add_company", produces = {"application/json"})
    public ResponseEntity<?> addCompany(@RequestBody Company company) {
        try {
            String hashedPassword = bCryptPasswordEncoder.passwordEncoder().encode(company.getCmp_password());
            company.setCmp_password(hashedPassword);

            Company createdCompany = companyService.createCompany(company);
            if (createdCompany != null) {
                Map<String, Object> companyResponse = new HashMap<>();
                companyResponse.put("resultCode", 100);
                companyResponse.put("resultDesc", "Successfully Saved");

                Map<String, Object> responseBody = new HashMap<>();
                responseBody.put("Company", createdCompany);
                responseBody.put("response", companyResponse);

                return new ResponseEntity<>(responseBody, HttpStatus.OK);
            } else {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            return handleException(e);
        }
    }

    @PutMapping(value = "/{cmp_id}", produces = {"application/json"})
    public ResponseEntity<?> updateCompany(@PathVariable Long cmp_id, @RequestBody Company updateCompany) {

        Company company = companyService.updateCompany(cmp_id, updateCompany);
        if (company != null) {
            Map<String, Object> companyResponse = new HashMap<>();
            companyResponse.put("resultCode", 100);
            companyResponse.put("resultDesc", "Successfully Updated");

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("Company", company);
            responseBody.put("response", companyResponse);

            return new ResponseEntity<>(responseBody, HttpStatus.OK);

        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }


    @GetMapping(value = "/companyDetails/{cmp_id}", produces = "application/json")
    public ResponseEntity<?> getCompanyDetailsByCompanyId(@PathVariable long cmp_id) {
        try {
            List<CompanyDetailsDTO> company = companyService.getCompanyDetailsByCompanyId(cmp_id);
            if (company == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Collections.singletonMap("message", "No Company Details found for this company ID"));
            }

            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Successful");
            response.put("CompanyDetails", company);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "An error occurred while fetching Company Details"));
        }
    }


    // change company password.................................................

    @PutMapping(value = "/changePassword/{cmp_id}", produces = {"application/json"})
    public ResponseEntity<?> changeCompanyPassword(@PathVariable Long cmp_id,
                                                   @RequestBody Map<String, String> passwordChangeRequest) {
        String oldPassword = passwordChangeRequest.get("oldPassword");
        String newPassword = passwordChangeRequest.get("newPassword");

        if (oldPassword == null || oldPassword.trim().isEmpty() ||
                newPassword == null || newPassword.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(
                    Collections.singletonMap("error", "Both old and new passwords must be provided"));
        }

        try {
            Company updatedCompany = companyService.changeCompanyPassword(cmp_id, oldPassword, newPassword);
            if (updatedCompany == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Collections.singletonMap("error", "Company not found"));
            }

            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Password successfully updated");
            response.put("Company", updatedCompany.getCmp_name());

            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "An error occurred while updating the password"));
        }
    }


    @PostMapping(value = "/forgetPassword", produces = "application/json")
    public ResponseEntity<?> forgotPassword(@RequestParam("cmpEmail") String cmpEmail) {
        try {
            // Generate a new password and update the company record
            String randomPassword = companyService.forgotPassword(cmpEmail);

            // Prepare email content with the new password
            String subject = "Password Reset Request";
            String content = "<p>Your password has been reset successfully.</p>"
                    + "<p>Your new password is: <strong>" + randomPassword + "</strong></p>"
                    + "<p>Please log in and change your password as soon as possible.</p>";

            emailService.sendEmail(cmpEmail, subject, content);

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



    @GetMapping(value = "/by-org/{orgId}", produces = "application/json")
    public ResponseEntity<?> getByOrgId(@PathVariable Long orgId) {
        try {
            Company company = companyRepository.findByOrgId(orgId);
            if (company != null) {
                Map<String, Object> response = new HashMap<>();
                response.put("resultCode", 100);
                response.put("resultDesc", "Successful");
                response.put("Company", company);
                return ResponseEntity.ok(response);
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Collections.singletonMap("message", "Company not found for orgId: " + orgId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", e.getMessage()));
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
