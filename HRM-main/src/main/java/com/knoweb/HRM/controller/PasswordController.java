package com.knoweb.HRM.controller;

import com.knoweb.HRM.service.EmailService;
import com.knoweb.HRM.service.PasswordResetService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/password")
public class PasswordController {

    private final PasswordResetService resetService;
    private final EmailService         emailService;

    public PasswordController(PasswordResetService resetService,
                              EmailService emailService) {
        this.resetService = resetService;
        this.emailService  = emailService;
    }

    /**
     * Generates and emails a new random password to the account matching the given identifier.
     *
     * @param identifier email or username of the account
     * @return JSON indicating success or failure
     * @since 9+
     */
    @PostMapping(value = "/forgotPassword", produces = "application/json")
    public ResponseEntity<?> forgotPassword(@RequestParam("email") String email) {
        try {
            // First validate that the email exists in the system
            String emailAddress = resetService.getEmailForEmail(email);
            if (emailAddress == null) {
                Map<String,Object> error = new HashMap<>();
                error.put("resultCode", 101);
                error.put("resultDesc", "Email not found. Please check your email and try again.");
                error.put("message", "No account found with email: " + email);
                return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
            }

            // Generate new password
            String newPassword = resetService.resetPasswordForEmail(email);

            // Send email with new password
            String subject = "Password Reset Request";
            String content = "<p>Your password has been reset successfully.</p>"
                    + "<p>Your new password is: <strong>" + newPassword + "</strong></p>"
                    + "<p>Please log in and change it as soon as possible.</p>"
                    + "<p>If you didn't request this password reset, please contact support immediately.</p>";
            
            emailService.sendEmail(emailAddress, subject, content);

            Map<String,Object> result = new HashMap<>();
            result.put("resultCode", 100);
            result.put("resultDesc", "Password reset successfully");
            result.put("message", "A new password has been sent to your email address. Please check your inbox.");
            return new ResponseEntity<>(result, HttpStatus.OK);

        } catch (PasswordResetService.NotFoundException ex) {
            Map<String,Object> error = new HashMap<>();
            error.put("resultCode", 101);
            error.put("resultDesc", "Email not found. Please check your email and try again.");
            error.put("message", "No account found with email: " + email);
            return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);

        } catch (Exception ex) {
            Map<String,Object> error = new HashMap<>();
            error.put("resultCode", 102);
            error.put("resultDesc", "An error occurred while processing your request.");
            error.put("message", "Password reset failed. Please try again later.");
            return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
