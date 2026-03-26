package com.knoweb.HRM.dto;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

public class CompanyRegistrationRequest {

    @NotBlank(message = "Company name is required")
    @Size(min = 2, max = 100, message = "Company name must be between 2 and 100 characters")
    private String cmpName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String cmpEmail;

    @NotBlank(message = "Phone number is required")
    @Size(min = 10, max = 20, message = "Phone number must be between 10 and 20 characters")
    private String cmpPhone;

    @NotBlank(message = "Address is required")
    @Size(min = 5, max = 200, message = "Address must be between 5 and 200 characters")
    private String cmpAddress;

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 100, message = "Password must be between 6 and 100 characters")
    private String password;

    private Long orgId;

    private String cmpRegNo;
    private String tinNo;
    private String vatNo;

    // Getters and Setters
    public Long getOrgId() {
        return orgId;
    }

    public void setOrgId(Long orgId) {
        this.orgId = orgId;
    }

    public String getCmpName() {
        return cmpName;
    }

    public void setCmpName(String cmpName) {
        this.cmpName = cmpName;
    }

    public String getCmpEmail() {
        return cmpEmail;
    }

    public void setCmpEmail(String cmpEmail) {
        this.cmpEmail = cmpEmail;
    }

    public String getCmpPhone() {
        return cmpPhone;
    }

    public void setCmpPhone(String cmpPhone) {
        this.cmpPhone = cmpPhone;
    }

    public String getCmpAddress() {
        return cmpAddress;
    }

    public void setCmpAddress(String cmpAddress) {
        this.cmpAddress = cmpAddress;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getCmpRegNo() {
        return cmpRegNo;
    }

    public void setCmpRegNo(String cmpRegNo) {
        this.cmpRegNo = cmpRegNo;
    }

    public String getTinNo() {
        return tinNo;
    }

    public void setTinNo(String tinNo) {
        this.tinNo = tinNo;
    }

    public String getVatNo() {
        return vatNo;
    }

    public void setVatNo(String vatNo) {
        this.vatNo = vatNo;
    }
}