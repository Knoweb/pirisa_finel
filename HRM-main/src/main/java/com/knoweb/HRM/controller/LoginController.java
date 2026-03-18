package com.knoweb.HRM.controller;

import com.knoweb.HRM.model.Company;
import com.knoweb.HRM.model.Employee;
import com.knoweb.HRM.model.User;
import com.knoweb.HRM.repository.CompanyRepository;
import com.knoweb.HRM.repository.EmployeeRepository;
import com.knoweb.HRM.repository.UserRepository;
import com.knoweb.HRM.utility.JwtTokenUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class LoginController {

    @Autowired
    private UserRepository userRepository;
    private CompanyRepository companyRepository;
    private EmployeeRepository employeeRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtTokenUtil jwtTokenUtil;

//    public LoginController(UserRepository userRepository, BCryptPasswordEncoder passwordEncoder, JwtTokenUtil jwtTokenUtil) {
//        this.userRepository = userRepository;
//        this.passwordEncoder = passwordEncoder;
//        this.jwtTokenUtil = jwtTokenUtil;
//    }

    public LoginController(UserRepository userRepository, CompanyRepository companyRepository, EmployeeRepository employeeRepository, BCryptPasswordEncoder passwordEncoder, JwtTokenUtil jwtTokenUtil) {
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenUtil = jwtTokenUtil;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
        String username = loginRequest.get("username");
        String password = loginRequest.get("password");

        // Try finding by username first
        Company company = companyRepository.findByUsername(username);
        User user = userRepository.findByUsername(username);
        Employee employee = employeeRepository.findByUsername(username);
        
        // If not found by username, try finding by email for all user types
        if (company == null) {
            company = companyRepository.findByCmpEmail(username);
        }
        if (user == null) {
            user = userRepository.findByEmail(username);
        }
        if (employee == null) {
            employee = employeeRepository.findByEmail(username);
        }

        if (company != null && passwordEncoder.matches(password, company.getCmp_password())) {
            String token = jwtTokenUtil.generateToken(company);
            System.out.println("Company login successful - Username/Email: " + username);

            Map<String, Object> loginresponse = new HashMap<>();
            loginresponse.put("resultCode", 100);
            loginresponse.put("resultDesc", "Login Successfull");

            Map<String, Object> logindetails = new HashMap<>();
            logindetails.put("username", company.getUsername());
            logindetails.put("CMPNY_Id",company.getId());
            logindetails.put("Role" ,company.getRole());
            logindetails.put("token", token);

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("response", loginresponse);
            responseBody.put("details", logindetails);

            

            return ResponseEntity.ok(responseBody);

        } else if (user != null && passwordEncoder.matches(password, user.getPassword())) {
            String token = jwtTokenUtil.generateToken(user);
            System.out.println("User login successful - Username/Email: " + username);

            Map<String, Object> loginresponse = new HashMap<>();
            loginresponse.put("resultCode", 100);
            loginresponse.put("resultDesc", "Login Successfull");

            Map<String, Object> logindetails = new HashMap<>();
            logindetails.put("username", user.getUsername());
            logindetails.put("Role",user.getRole());
            logindetails.put("CMPNY_Id",user.getCmpId());
            logindetails.put("token", token);

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("response", loginresponse);
            responseBody.put("details", logindetails);



            return ResponseEntity.ok(responseBody);

        }else if (employee != null && passwordEncoder.matches(password, employee.getPassword())) {
            String token = jwtTokenUtil.generateToken(employee);
            System.out.println("Employee login successful - Username/Email: " + username);

            Map<String, Object> loginresponse = new HashMap<>();
            loginresponse.put("resultCode", 100);
            loginresponse.put("resultDesc", "Login Successfull");

            Map<String, Object> logindetails = new HashMap<>();
            logindetails.put("username", employee.getEmail());
            logindetails.put("Role",employee.getRole());
            logindetails.put("CMPNY_Id",employee.getCmpId());
            logindetails.put("EMP_id",employee.getId());
            logindetails.put("token", token);

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("response", loginresponse);
            responseBody.put("details", logindetails);



            return ResponseEntity.ok(responseBody);

        }else {
            Map<String, Object> loginresponse = new HashMap<>();
            loginresponse.put("resultCode", 101);
            loginresponse.put("resultDesc", "Invalid Login");

            Map<String, Object> response = new HashMap<>();
            response.put("response", loginresponse);
            response.put("details", "Invalid username/email or password");

            return ResponseEntity.ok(response);
        }
    }
}
