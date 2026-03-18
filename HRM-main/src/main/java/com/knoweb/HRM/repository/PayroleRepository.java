package com.knoweb.HRM.repository;

import com.knoweb.HRM.model.Employee;
import com.knoweb.HRM.model.Payrole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PayroleRepository extends JpaRepository<Payrole, Long> {
    List<Payrole> findEmployeeById(long empId);
}
