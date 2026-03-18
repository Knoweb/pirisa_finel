package com.knoweb.HRM.service;

import com.knoweb.HRM.model.Additional_attendance;
import com.knoweb.HRM.repository.Additional_attendanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class Additional_attendanceServise {

    @Autowired
    private Additional_attendanceRepository additional_attendanceRepository;

    public Additional_attendance createAdditional_Attendance(Additional_attendance additional_attendance) {
        return additional_attendanceRepository.save(additional_attendance);
    }

    public void deleteAddi_Attendance(Long additional_atdnc_id) {
        additional_attendanceRepository.deleteById(additional_atdnc_id);
    }

    public Additional_attendance updateAdditional_Attendance(Long additional_atdnc_id, Additional_attendance additional_attendance) {
        Additional_attendance additionalattendance = getAdditionalAttendanceById(additional_atdnc_id);
        if (additionalattendance != null) {
            additionalattendance.setTravel_start(additional_attendance.getTravel_start());
            additionalattendance.setTravel_end(additional_attendance.getTravel_end());
            return additional_attendanceRepository.save(additionalattendance);
        }
        return null;
    }

    public Additional_attendance getAdditionalAttendanceById(Long additional_atdnc_id) {
        Optional<Additional_attendance> optionalAddi_attendance = additional_attendanceRepository.findById(additional_atdnc_id);
        return optionalAddi_attendance.orElse(null);
    }
}
