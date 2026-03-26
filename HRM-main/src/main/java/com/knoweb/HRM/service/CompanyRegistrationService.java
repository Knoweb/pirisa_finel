package com.knoweb.HRM.service;

import com.knoweb.HRM.dto.CompanyRegistrationRequest;
import com.knoweb.HRM.model.Company;
import com.knoweb.HRM.model.User;
import com.knoweb.HRM.repository.CompanyRepository;
import com.knoweb.HRM.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CompanyRegistrationService {

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public String registerCompany(CompanyRegistrationRequest request) {
        try {
            // Check if company name already exists
            Company existingCompany = companyRepository.findByName(request.getCmpName());
            if (existingCompany != null) {
                return "Company name already exists";
            }

            // Check if username already exists
            User existingUser = userRepository.findByUsername(request.getUsername());
            if (existingUser != null) {
                return "Username already exists";
            }

            // Check if email already exists
            User existingEmail = userRepository.findByEmail(request.getCmpEmail());
            if (existingEmail != null) {
                return "Email already exists";
            }

            // Create new company
            Company company = new Company();
            company.setCmp_name(request.getCmpName());
            company.setCmpEmail(request.getCmpEmail());
            company.setCmp_phone(request.getCmpPhone());
            company.setCmp_address(request.getCmpAddress());
            company.setUsername(request.getUsername());
            company.setCmp_password(passwordEncoder.encode(request.getPassword()));
            company.setCompany_status("ACTIVE");
            if (request.getOrgId() != null) {
                company.setOrgId(request.getOrgId());
            }
            
            System.out.println("DEBUG - Saving company with data:");
            System.out.println("  cmp_name: " + company.getCmp_name());
            System.out.println("  cmpEmail: " + company.getCmpEmail());
            System.out.println("  cmp_phone: " + company.getCmp_phone());
            System.out.println("  cmp_address: " + company.getCmp_address());
            System.out.println("  username: " + company.getUsername());
            System.out.println("  cmp_password: " + (company.getCmp_password() != null ? "[ENCRYPTED]" : "[NULL]"));
            System.out.println("  company_status: " + company.getCompany_status());
            
            Company savedCompany = companyRepository.save(company);
            System.out.println("DEBUG - Company saved with ID: " + savedCompany.getId());

            // Create user account for the company
            User user = new User();
            user.setUsername(request.getUsername());
            user.setEmail(request.getCmpEmail());
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setRole("CMPNY");
            user.setCmpId(savedCompany.getId());
            
            userRepository.save(user);

            return "SUCCESS";
        } catch (Exception e) {
            e.printStackTrace();
            return "Registration failed: " + e.getMessage();
        }
    }

    public boolean isUsernameAvailable(String username) {
        User user = userRepository.findByUsername(username);
        return user == null;
    }

    public boolean isEmailAvailable(String email) {
        User user = userRepository.findByEmail(email);
        return user == null;
    }
}
