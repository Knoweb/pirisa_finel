package com.knoweb.HRM.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.knoweb.HRM.config.SecurityConfig;
import com.knoweb.HRM.model.User;
import com.knoweb.HRM.service.EmailService;
import com.knoweb.HRM.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/user")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private SecurityConfig bCryptPasswordEncoder;

    @Autowired
    private EmailService emailService;

    @GetMapping(value = "/all", produces = {"application/json"})
    public ResponseEntity<?> getAllUsers() {
        try {
            List<User> users = userService.getAllUsers();

            Map<String, Object> userResponse = new HashMap<>();
            userResponse.put("resultCode", 100);
            userResponse.put("resultDesc", "Successfull");

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("UserList", users);
            responseBody.put("response", userResponse);

            return new ResponseEntity<>(responseBody, HttpStatus.OK);
        } catch (Exception e) {
            return handleException(e);
        }
    }

    @PostMapping(value = "/add_user", produces = {"application/json"})
    public ResponseEntity<?> addUser(@RequestBody User user) {
        try {
            String hashedPassword = bCryptPasswordEncoder.passwordEncoder().encode(user.getPassword());
            user.setPassword(hashedPassword);

            User createdUser = userService.createUser(user);
            if (createdUser != null) {
                Map<String, Object> userResponse = new HashMap<>();
                userResponse.put("resultCode", 100);
                userResponse.put("resultDesc", "Successfully Saved");

                Map<String, Object> responseBody = new HashMap<>();
                responseBody.put("User", createdUser);
                responseBody.put("response", userResponse);

                return new ResponseEntity<>(responseBody, HttpStatus.OK);
            } else {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            return handleException(e);
        }
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable Long userId) {
        try {
            userService.deleteUser(userId);

            Map<String, Object> userResponse = new HashMap<>();
            userResponse.put("resultCode", 100);
            userResponse.put("resultDesc", "Successfully Deleted");

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("User_id", userId);
            responseBody.put("response", userResponse);

            return new ResponseEntity<>(responseBody, HttpStatus.OK);
        } catch (Exception e) {
            return handleException(e);
        }
    }

    @PutMapping(value = "/{user_id}", produces = {"application/json"})
    public ResponseEntity<?> updateUser(@PathVariable Long user_id, @RequestBody User updateUser) {

        User user = userService.updateUser(user_id, updateUser);
        if (user != null) {
            Map<String, Object> userResponse = new HashMap<>();
            userResponse.put("resultCode", 100);
            userResponse.put("resultDesc", "Successfully Updated");

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("User", user);
            responseBody.put("response", userResponse);

            return new ResponseEntity<>(responseBody, HttpStatus.OK);

        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }


    @PutMapping(value = "/changePassword/{user_id}", produces = {"application/json"})
    public ResponseEntity<?> changeUserPassword(@PathVariable Long user_id,
                                                   @RequestBody Map<String, String> passwordChangeRequest) {
        String oldPassword = passwordChangeRequest.get("oldPassword");
        String newPassword = passwordChangeRequest.get("newPassword");

        if (oldPassword == null || oldPassword.trim().isEmpty() ||
                newPassword == null || newPassword.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(
                    Collections.singletonMap("error", "Both old and new passwords must be provided"));
        }

        try {
            User updatedUser = userService.changeUserPassword(user_id, oldPassword, newPassword);
            if (updatedUser == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Collections.singletonMap("error", "Company not found"));
            }

            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Password successfully updated");
            response.put("User", updatedUser.getUsername());

            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "An error occurred while updating the password"));
        }
    }


    @PostMapping(value = "/forgetPassword", produces = "application/json")
    public ResponseEntity<?> forgotPassword(@RequestParam("username") String username) {
        try {
            // Generate a new password and update the company record
            String randomPassword = userService.forgotPassword(username);

            // Prepare email content with the new password
            String subject = "Password Reset Request";
            String content = "<p>Your password has been reset successfully.</p>"
                    + "<p>Your new password is: <strong>" + randomPassword + "</strong></p>"
                    + "<p>Please log in and change your password as soon as possible.</p>";

            emailService.sendEmail(username, subject, content);

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


    @GetMapping(value = "/company/{cmpId}", produces = "application/json")
    public ResponseEntity<?> getUsersByCompanyId(@PathVariable long cmpId) {
        try {
            List<User> users = userService.getUsersByCompanyId(cmpId);
            if (users.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Collections.singletonMap("message", "No User found for this company ID"));
            }

            Map<String, Object> response = new HashMap<>();
            response.put("resultCode", 100);
            response.put("resultDesc", "Successful");
            response.put("UserList", users);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "An error occurred while fetching Users"));
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
