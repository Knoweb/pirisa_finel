package com.knoweb.HRM.repository;

import com.knoweb.HRM.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserRepository extends JpaRepository<User, Long> {

    User findByUsername(String username);

    User findByEmail(String email);

    List<User> findByCmpId(long cmpId);
}
