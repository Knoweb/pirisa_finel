package com.knoweb.HRM.service;

import com.knoweb.HRM.config.SecurityConfig;
import com.knoweb.HRM.model.User;
import com.knoweb.HRM.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SecurityConfig securityConfig;


    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User saveUser(User user) {
        return userRepository.save(user);
    }

    public void deleteUser(Long userId) {
        userRepository.deleteById(userId);
    }

    public User createUser(User user) {
        return userRepository.save(user);
    }

    public long getUserCount(){ return userRepository.count();}


    public User updateUser(Long user_id, User updateUser) {
        User user = getUserById(user_id);
        if (user != null) {
            user.setName(updateUser.getName());
            user.setUsername(updateUser.getUsername());
            user.setRole(updateUser.getRole());
            return userRepository.save(user);
        }
        return null;
    }

    public User getUserById(Long user_id) {
        Optional<User> optionalUser = userRepository.findById(user_id);
        return optionalUser.orElse(null);
    }


    public User changeUserPassword(Long user_id, String oldPassword, String newPassword) {
        Optional<User> userOptional = userRepository.findById(user_id);
        if (!userOptional.isPresent()) {
            return null;
        }
        User user = userOptional.get();
        // Verify if the provided old password matches the stored password.
        if (!securityConfig.passwordEncoder().matches(oldPassword, user.getPassword())) {
            throw new IllegalArgumentException("Old password is incorrect");
        }
        // Encrypt the new password using BCrypt and update the company.
        String hashedPassword = securityConfig.passwordEncoder().encode(newPassword);
        user.setPassword(hashedPassword);
        return userRepository.save(user);
    }


    public String forgotPassword(String usename) {
        User user = userRepository.findByUsername(usename);
        if (user == null) {
            throw new IllegalArgumentException("No company found with the provided email");
        }
        String randomPassword = UUID.randomUUID().toString().substring(0, 8);
        String hashedPassword = securityConfig.passwordEncoder().encode(randomPassword);
        user.setPassword(hashedPassword);

        userRepository.save(user);


        return randomPassword;
    }


    public List<User> getUsersByCompanyId(long cmpId) {
        return userRepository.findByCmpId(cmpId);
    }


}
