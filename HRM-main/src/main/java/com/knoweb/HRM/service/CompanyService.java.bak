package com.knoweb.HRM.service;

import com.knoweb.HRM.config.SecurityConfig;
import com.knoweb.HRM.dto.*;
import com.knoweb.HRM.model.Company;
import com.knoweb.HRM.repository.CompanyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class CompanyService {

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private SecurityConfig securityConfig;

    @Autowired
    private EmailService emailService;

    public Company createCompany(Company company) {
        return companyRepository.save(company);
    }

    public List<Company> getAllCompanies() {
        return companyRepository.findAll();
    }

    public Company updateCompany(Long cmp_id, Company updateCompany) {
        Company company = getCompanyById(cmp_id);
        if (company != null) {
            company.setCmp_name(updateCompany.getCmp_name());
            company.setCmp_address(updateCompany.getCmp_address());
            company.setCmp_phone(updateCompany.getCmp_phone());
            company.setCmpEmail(updateCompany.getCmpEmail());
            company.setUsername(updateCompany.getUsername());
            company.setCmp_reg_no(updateCompany.getCmp_reg_no());
            company.setTin_no(updateCompany.getTin_no());
            company.setVat_no(updateCompany.getVat_no());
            company.setPackage_name(updateCompany.getPackage_name());
            company.setCompany_status(updateCompany.getCompany_status());
            return companyRepository.save(company);
        }
        return null;
    }

    public Company getCompanyById(Long cmp_id) {
        Optional<Company> optionalCompany = companyRepository.findById(cmp_id);
        return optionalCompany.orElse(null);
    }

    public List<CompanyDetailsDTO> getCompanyDetailsByCompanyId(long cmpId) {
        Optional<Company> companyOpt = companyRepository.findById(cmpId);

        return companyOpt
                .map(company -> Collections.singletonList(new CompanyDetailsDTO(
                        company.getId(),
                        company.getCmp_name(),
                        company.getCmp_address(),
                        company.getCmp_phone(),
                        company.getCmpEmail(),
                        company.getUsername(),
                        company.getCmp_reg_no(),
                        company.getVat_no(),
                        company.getTin_no(),
                        company.getRole(),
                        company.getPackage_name(),
                        company.getCompany_status()
                )))
                .orElse(Collections.emptyList());
    }


    public Company changeCompanyPassword(Long cmpId, String oldPassword, String newPassword) {
        Optional<Company> companyOptional = companyRepository.findById(cmpId);
        if (!companyOptional.isPresent()) {
            return null;
        }
        Company company = companyOptional.get();
        // Verify if the provided old password matches the stored password.
        if (!securityConfig.passwordEncoder().matches(oldPassword, company.getCmp_password())) {
            throw new IllegalArgumentException("Old password is incorrect");
        }
        // Encrypt the new password using BCrypt and update the company.
        String hashedPassword = securityConfig.passwordEncoder().encode(newPassword);
        company.setCmp_password(hashedPassword);
        return companyRepository.save(company);
    }


    public String forgotPassword(String cmpEmail) {
        Company company = companyRepository.findByCmpEmail(cmpEmail);
        if (company == null) {
            throw new IllegalArgumentException("No company found with the provided email");
        }
        String randomPassword = UUID.randomUUID().toString().substring(0, 8);
        String hashedPassword = securityConfig.passwordEncoder().encode(randomPassword);
        company.setCmp_password(hashedPassword);

        companyRepository.save(company);


        return randomPassword;
    }


    public Company updateCompany(Company company) {
        return companyRepository.save(company);
    }

    // Lookup company by its Stripe customer ID
    public Company getCompanyByStripeCustomerId(String stripeCustomerId) {
        return companyRepository.findByStripeCustomerId(stripeCustomerId);
    }

 }


