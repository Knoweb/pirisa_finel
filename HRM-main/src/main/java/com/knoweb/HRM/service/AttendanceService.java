package com.knoweb.HRM.service;

import com.knoweb.HRM.model.Attendance;
import com.knoweb.HRM.model.Employee;
import com.knoweb.HRM.repository.AttendanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AttendanceService {

    @Autowired
    private AttendanceRepository attendanceRepository;

    public Attendance createAttendance(Attendance attendance) {
        return attendanceRepository.save(attendance);
    }

    public List<Attendance> getAttendanceByEmployeeId(long empId) {
        return attendanceRepository.findByEmpId(empId);
    }

    public void deleteAttendance(Long atdnc_id) {
        attendanceRepository.deleteById(atdnc_id);
    }


//    public List<Attendance> getAttendanceByCompanyId(Long cmpId) {
//        return attendanceRepository.findByCompanyId(cmpId);
//    }



    public Attendance updateAttendance(Long atdnc_id, Attendance updateAttendance) {
        Attendance attendance = getAttendanceById(atdnc_id);
        if (attendance != null) {
            attendance.setEndedAt(updateAttendance.getEndedAt());

            return attendanceRepository.save(attendance);
        }
        return null;
    }

    public Attendance getAttendanceById(long id) {
        Optional<Attendance> optionalUser = attendanceRepository.findById(id);
        return optionalUser.orElse(null);
    }


    public List<Attendance> getAttendanceByEmployeeIdAndMonth(long empId, int month) {
        return attendanceRepository.findByEmpIdAndMonth(empId, month);
    }


}
