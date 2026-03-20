package com.knoweb.HRM.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.persistence.*;
import java.io.Serializable;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "department")
public class Unit implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "dpt_id")
    private Long id;

    @Column(name = "dpt_name")
    private String dpt_name;

    @Column(name = "dpt_code")
    private String dpt_code;

    @Column(name = "dpt_desc")
    private String dpt_desc;

    @Column(name = "cmp_id")
    private Long cmpId;

    @OneToMany(targetEntity = Designation.class, cascade = CascadeType.ALL)
    @JoinColumn(name = "dpt_id", referencedColumnName = "dpt_id")
    private List<Designation> designationList;

}
