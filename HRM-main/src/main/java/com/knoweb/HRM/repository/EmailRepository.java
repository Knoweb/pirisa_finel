package com.knoweb.HRM.repository;

import com.knoweb.HRM.model.Email;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmailRepository extends JpaRepository<Email, Long> {
}
