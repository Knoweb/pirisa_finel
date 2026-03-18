package com.knoweb.HRM.repository;

import com.knoweb.HRM.model.CompanyLogoes;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CompanyLogoRepository extends JpaRepository<CompanyLogoes, Long> {
    
    @Query("SELECT cl FROM CompanyLogoes cl WHERE cl.cmpId = ?1 ORDER BY cl.id DESC")
    List<CompanyLogoes> findByCmpIdOrderByIdDesc(Long cmpId);
    
    // Keep the old method for backward compatibility but mark it as deprecated
    @Deprecated
    Optional<CompanyLogoes> findByCmpId(Long cmpId);
}
