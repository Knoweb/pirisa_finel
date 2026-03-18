package com.knoweb.HRM.repository;

import com.knoweb.HRM.model.Unit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UnitRepository extends JpaRepository<Unit, Long> {
    List<Unit> findByCmpId(long cmpId);
}
