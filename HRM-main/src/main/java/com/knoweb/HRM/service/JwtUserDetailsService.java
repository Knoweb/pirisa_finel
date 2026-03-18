package com.knoweb.HRM.service;

import com.knoweb.HRM.model.Company;
import com.knoweb.HRM.model.Employee;
import com.knoweb.HRM.model.User;
import com.knoweb.HRM.repository.CompanyRepository;
import com.knoweb.HRM.repository.EmployeeRepository;
import com.knoweb.HRM.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class JwtUserDetailsService implements UserDetailsService {

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        Company company = companyRepository.findByUsername(username);
        if (company != null) {
            return new org.springframework.security.core.userdetails.User(
                    company.getUsername(),
                    company.getCmp_password(),
                    Collections.singleton(new SimpleGrantedAuthority(company.getRole()))
            );
        }

        // Check in Clients repository
        User user = userRepository.findByUsername(username);
        if (user != null) {
            return new org.springframework.security.core.userdetails.User(
                    user.getUsername(),
                    user.getPassword(),
                    Collections.singleton(new SimpleGrantedAuthority(user.getRole()))
            );
        }

        Employee employee = employeeRepository.findByUsername(username);
        if (employee != null) {
            return new org.springframework.security.core.userdetails.User(
                    employee.getUsername(),
                    employee.getPassword(),
                    Collections.singleton(new SimpleGrantedAuthority(employee.getRole()))
            );
        }

        throw new UsernameNotFoundException("User not found with username: " + username);
    }


}

