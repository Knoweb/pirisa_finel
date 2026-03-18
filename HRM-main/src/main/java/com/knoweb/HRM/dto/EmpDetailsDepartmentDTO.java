package com.knoweb.HRM.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class EmpDetailsDepartmentDTO {
    private Long id;
    private String dpt_name;
    private String dpt_code;
    private String dpt_desc;
}
