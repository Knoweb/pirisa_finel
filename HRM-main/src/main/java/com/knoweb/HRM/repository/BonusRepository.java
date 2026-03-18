package com.knoweb.HRM.repository;

import com.knoweb.HRM.model.Allowance;
import com.knoweb.HRM.model.Bonus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BonusRepository extends JpaRepository<Bonus, Long> {
    List<Bonus> findByCmpId(long cmpId);
}
