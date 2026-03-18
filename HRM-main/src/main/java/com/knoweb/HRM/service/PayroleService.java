package com.knoweb.HRM.service;

import com.knoweb.HRM.model.Payrole;
import com.knoweb.HRM.repository.PayroleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PayroleService {

    @Autowired
    private PayroleRepository payroleRepository;

    public Payrole createPayrole(Payrole payrole) {
        return payroleRepository.save( payrole);
    }

    public void deletePayrole(Long payrole_id) {
        payroleRepository.deleteById(payrole_id);
    }


    public List<Payrole> getPayroleByEmployeeId(long empId) {
        List<Payrole> payroles = payroleRepository.findEmployeeById(empId);
return  payroles;
}}
