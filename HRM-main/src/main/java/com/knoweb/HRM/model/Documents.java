package com.knoweb.HRM.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.persistence.*;
import java.io.Serializable;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "documents")
public class Documents implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "doc_id")
    private long id;

    @Lob
    @Column(name = "birth_certificate", columnDefinition = "LONGBLOB")
    private byte[] birthCertificate;

    @Lob
    @Column(name = "cv", columnDefinition = "LONGBLOB")
    private byte[] cv;

    @Lob
    @Column(name = "id_copy", columnDefinition = "LONGBLOB")
    private byte[] idCopy;

    @Lob
    @Column(name = "police_report", columnDefinition = "LONGBLOB")
    private byte[] policeReport;

    @Lob
    @Column(name = "bank_passbook", columnDefinition = "LONGBLOB")
    private byte[] bankPassbook;

    @Lob
    @Column(name = "appointment_letter", columnDefinition = "LONGBLOB")
    private byte[] appointmentLetter;

    @Lob
    @Column(name = "emp_photo", columnDefinition = "LONGBLOB")
    private byte[] photo;

    @Column(name = "emp_id")
    private long empId;

}
