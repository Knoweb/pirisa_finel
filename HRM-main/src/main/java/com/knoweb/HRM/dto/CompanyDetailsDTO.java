package com.knoweb.HRM.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class CompanyDetailsDTO {
    private Long id;

    private String cmp_name;

    private String cmp_address;

    private String cmp_phone;

    private String cmpEmail;

    private String username;

    private String cmp_reg_no;

    private String vat_no;

    private String tin_no;

    private String role;

    private String package_name;

    private String company_status;
}
