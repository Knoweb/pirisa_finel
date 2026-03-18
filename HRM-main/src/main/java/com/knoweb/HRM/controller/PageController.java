package com.knoweb.HRM.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PageController {

    @GetMapping("/success")
    public String success(@RequestParam("session_id") String sessionId) {
        return "Payment succeeded! Your subscription is now active.";
    }

    @GetMapping("/cancel")
    public String cancel() {
        return "Payment was canceled. Please try again.";
    }
}
