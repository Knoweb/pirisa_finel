package com.knoweb.HRM.repository;

import com.knoweb.HRM.model.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CompanyRepository extends JpaRepository<Company, Long> {

    Company findByUsername(String username);

    @Query("SELECT c FROM Company c WHERE c.cmp_name = :cmpName")
    Company findByName(@Param("cmpName") String cmpName);

    Company findByCmpEmail(String cmpEmail);

    Company findByStripeCustomerId(String stripeCustomerId);
}
