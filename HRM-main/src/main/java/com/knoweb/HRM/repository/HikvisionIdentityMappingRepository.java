package com.knoweb.HRM.repository;

import com.knoweb.HRM.model.HikvisionIdentityMapping;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface HikvisionIdentityMappingRepository extends JpaRepository<HikvisionIdentityMapping, Long> {

    Optional<HikvisionIdentityMapping> findByMappingTypeAndMappingKey(String mappingType, String mappingKey);
}
