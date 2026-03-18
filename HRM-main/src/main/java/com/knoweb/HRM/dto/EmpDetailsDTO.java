package com.knoweb.HRM.dto;

import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class EmpDetailsDTO {
    private Long id;
    private String epfNo;
    private String firstName;
    private String lastName;
    private double basicSalary;
    private String email;
    private String gender;
    private String phone;
    private String address;
    private String dateOfJoining;
    private String nic;
    private String dob;
    private String status;
    private EmpDetailsDepartmentDTO department;
    private EmpDetailsDesignationDTO designation;
    private EmpDetailsDocumentsDTO photo;
    private List<EmpDetailsLeaveDTO> leaveList;

}
