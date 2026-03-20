package com.knoweb.HRM.controller;

import com.knoweb.HRM.service.CompanyLogoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/logo")
public class CompanyLogoController {

    @Autowired
    private CompanyLogoService companyLogoService;

    @PostMapping("/upload")
    public ResponseEntity<String> uploadLogo(
            @RequestParam("comId") long comId,
            @RequestParam("logo") MultipartFile logo) throws IOException {

        companyLogoService.uploadLogo(comId, logo);
        return ResponseEntity.ok("Company Logo uploaded successfully!");
    }

    @GetMapping("/view/{comId}")
    public ResponseEntity<byte[]> viewLogo(@PathVariable("comId") Long comId) {
        byte[] logoData = companyLogoService.viewLogo(comId);
        if (logoData == null || logoData.length == 0) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG) // adjust to the correct media type if needed
                .body(logoData);
    }
}
