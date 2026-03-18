package com.knoweb.HRM.service;

import com.knoweb.HRM.model.CompanyLogoes;
import com.knoweb.HRM.repository.CompanyLogoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Service
public class CompanyLogoService {

    @Autowired
    private CompanyLogoRepository companyLogoRepository;

    public byte[] viewLogo(Long cmpId) {
        List<CompanyLogoes> logos = companyLogoRepository.findByCmpIdOrderByIdDesc(cmpId);
        if (!logos.isEmpty()) {
            // Return the most recent logo (first in the ordered list)
            return logos.get(0).getLogo();
        }
        return null; // Return null so controller can return 404
    }

    public CompanyLogoes uploadLogo(Long cmpId, MultipartFile logo) throws IOException {
        CompanyLogoes companyLogo = new CompanyLogoes();
        companyLogo.setCmpId(cmpId);
        if (logo != null && !logo.isEmpty()) {
            companyLogo.setLogo(logo.getBytes());
        }
        return companyLogoRepository.save(companyLogo);
    }
}
