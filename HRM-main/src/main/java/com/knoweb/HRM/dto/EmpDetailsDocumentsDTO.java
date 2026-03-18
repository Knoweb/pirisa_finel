package com.knoweb.HRM.dto;

import lombok.*;

import java.sql.Blob;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class EmpDetailsDocumentsDTO {
    
    private byte[] photo;
    private String photoUrl;

    // Constructor for backward compatibility
    public EmpDetailsDocumentsDTO(byte[] photo) {
        this.photo = photo;
        this.photoUrl = null;
    }

}
