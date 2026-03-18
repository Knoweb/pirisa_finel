package com.knoweb.HRM.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProfileImageResponse {
    private int resultCode;
    private String resultDesc;
    private Long empId;
    private Long imageSize;
    private String contentType;
    private boolean hasProfileImage;
    
    public static ProfileImageResponse success(String message, Long empId) {
        ProfileImageResponse response = new ProfileImageResponse();
        response.setResultCode(100);
        response.setResultDesc(message);
        response.setEmpId(empId);
        return response;
    }
    
    public static ProfileImageResponse success(String message, Long empId, Long imageSize, String contentType) {
        ProfileImageResponse response = success(message, empId);
        response.setImageSize(imageSize);
        response.setContentType(contentType);
        return response;
    }
    
    public static ProfileImageResponse error(String message) {
        ProfileImageResponse response = new ProfileImageResponse();
        response.setResultCode(101);
        response.setResultDesc("ERROR: " + message);
        return response;
    }
}
