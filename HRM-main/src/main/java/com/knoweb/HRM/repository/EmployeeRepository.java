package com.knoweb.HRM.repository;

import com.knoweb.HRM.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import javax.transaction.Transactional;
import java.util.List;
import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    List<Employee> findByCmpId(long cmpId);


    List<Employee> findEmployeeById(long empId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Employee e WHERE e.id = :emp_id")
    void deleteEmployee(long emp_id);

    long countByCmpId(long cmpId);

  //  Employee findByEmail(String email);

    Employee findByUsername(String username);

    Employee findByEmail(String email);

    @Query("SELECT e FROM Employee e LEFT JOIN FETCH e.department d LEFT JOIN FETCH e.designation des WHERE e.cmpId = :companyId AND " +
           "(LOWER(e.emp_no) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.epf_no) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.first_name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.last_name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.email) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Employee> searchEmployees(@Param("companyId") long companyId, @Param("query") String query);

    @Query("SELECT e FROM Employee e LEFT JOIN FETCH e.department d LEFT JOIN FETCH e.designation des WHERE e.cmpId = :companyId")
    List<Employee> findEmployeesByCompanyIdWithDetails(@Param("companyId") long companyId);
    
    // Find employees by department ID
    List<Employee> findByDptId(Long dptId);
    
    // Find employees by designation ID
    List<Employee> findByDesignationId(Long designationId);

    @Query("SELECT e FROM Employee e WHERE LOWER(e.emp_no) = LOWER(:code) OR LOWER(e.epf_no) = LOWER(:code) OR LOWER(e.username) = LOWER(:code)")
    Optional<Employee> findByDeviceCode(@Param("code") String code);
}
