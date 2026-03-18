package com.knoweb.HRM.service;

import com.knoweb.HRM.model.Company;
import com.knoweb.HRM.model.Employee;
import com.knoweb.HRM.model.User;
import com.knoweb.HRM.repository.CompanyRepository;
import com.knoweb.HRM.repository.EmployeeRepository;
import com.knoweb.HRM.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class PasswordResetService {

    @Autowired
    private CompanyRepository companyRepo;
    @Autowired private UserRepository userRepo;
    @Autowired private EmployeeRepository empRepo;
    @Autowired private BCryptPasswordEncoder passwordEncoder;

    /** Thrown when no account is found for the given identifier */
    public static class NotFoundException extends RuntimeException {
        public NotFoundException(String msg) { super(msg); }
    }

    /** Reset password & return the plain text new password */
    @Transactional
    public String resetPasswordFor(String identifier) {
        // 1) Look up by email or username in each repo:
        Company c = companyRepo.findByCmpEmail(identifier);
        User u = userRepo.findByUsername(identifier);
        Employee e = empRepo.findByUsername(identifier);

        Object account;
        if (c != null) {
            account = c;
        } else if (u != null) {
            account = u;
        } else if (e != null) {
            account = e;
        } else {
            throw new NotFoundException("No account found for identifier: " + identifier);
        }

        // 2) Generate & encode new password
        String plain  = UUID.randomUUID().toString().substring(0, 8);
        String hashed = passwordEncoder.encode(plain);

        // 3) Set it back on the right type and save
        if (account instanceof Company) {
            ((Company) account).setCmp_password(hashed);
            companyRepo.save((Company) account);

        } else if (account instanceof User) {
            ((User) account).setPassword(hashed);
            userRepo.save((User) account);

        } else {
            ((Employee) account).setPassword(hashed);
            empRepo.save((Employee) account);
        }

        return plain;
    }

    /** Return the e-mail address for a given identifier */
    public String getEmailForEmail(String email) {
        Company  c = companyRepo.findByCmpEmail(email);
        User     u = userRepo.findByEmail(email);
        Employee e = empRepo.findByEmail(email);

        if (c != null) {
            return c.getCmpEmail();
        }
        else if (u != null) {
            return u.getEmail();
        }
        else if (e != null) {
            return e.getEmail();
        }
        else {
            return null; // Return null instead of throwing exception for email validation
        }
    }

    @Transactional
    public String resetPasswordForEmail(String email) {
        // 1) Look up by email in each repo:
        Company c = companyRepo.findByCmpEmail(email);
        User u = userRepo.findByEmail(email);
        Employee e = empRepo.findByEmail(email);

        Object account;
        if (c != null) {
            account = c;
        } else if (u != null) {
            account = u;
        } else if (e != null) {
            account = e;
        } else {
            throw new NotFoundException("No account found for email: " + email);
        }

        // 2) Generate & encode new password
        String plain  = UUID.randomUUID().toString().substring(0, 8);
        String hashed = passwordEncoder.encode(plain);

        // 3) Set it back on the right type and save
        if (account instanceof Company) {
            ((Company) account).setCmp_password(hashed);
            companyRepo.save((Company) account);

        } else if (account instanceof User) {
            ((User) account).setPassword(hashed);
            userRepo.save((User) account);

        } else {
            ((Employee) account).setPassword(hashed);
            empRepo.save((Employee) account);
        }

        return plain;
    }
}
