package com.knoweb.HRM.repository;

import com.knoweb.HRM.model.Documents;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DocumentRepository extends JpaRepository<Documents, Long> {
    Optional<Documents> findByEmpId(long empId);

    Optional<Documents> findByempId(long empId);

    Optional<Documents> findTopByEmpIdOrderByIdDesc(long empId);

    List<Documents> findAllByEmpIdOrderByIdDesc(long empId);
}
