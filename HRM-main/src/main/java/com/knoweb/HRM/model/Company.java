package com.knoweb.HRM.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import javax.persistence.*;
import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "company")
public class Company implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cmp_id")
    private long id;

    @Column(unique = true, name = "org_id")
    private Long orgId;

    private String cmp_name;

    private String cmp_address;

    private String cmp_phone;

    @Column(unique = true, name ="cmp_email")
    private String cmpEmail;

    @Column(unique = true, name = "username")
    private String username;

    private String cmp_password;

    @Column(unique = true)
    private String cmp_reg_no;

    @Column(unique = true)
    private String vat_no;

    @Column(unique = true)
    private String tin_no;

    private String role = "CMPNY";

    private String package_name;

    private String company_status = "INACTIVE";

    @CreationTimestamp
    @Column(name = "joined_at", updatable = false)
    private LocalDateTime joinedAt;

    @Column(name = "last_leave_calculation_date")
    private LocalDate lastLeaveCalculationDate;

    private String stripeCustomerId;

    @OneToMany(targetEntity = User.class, cascade = CascadeType.ALL)
    @JoinColumn(name = "cmp_id", referencedColumnName = "cmp_id")
    private List<User> userList;

    @OneToMany(targetEntity = Employee.class, cascade = CascadeType.ALL)
    @JoinColumn(name = "cmp_id", referencedColumnName = "cmp_id")
    private List<Employee> eployeeList;

    @OneToMany(targetEntity = Unit.class, cascade = CascadeType.ALL)
    @JoinColumn(name = "cmp_id", referencedColumnName = "cmp_id")
    private List<Unit> unitList;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "cmp_id", referencedColumnName = "cmp_id", insertable = false, updatable = false)
    private CompanyLeave companyLeave;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "cmp_id", referencedColumnName = "cmp_id", insertable = false, updatable = false)
    private Allowance allowance;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "cmp_id", referencedColumnName = "cmp_id", insertable = false, updatable = false)
    private CompanyOTDetails companyOTDetails;
}
