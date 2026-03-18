package com.knoweb.HRM.service;

import com.knoweb.HRM.model.Attendance;
import com.knoweb.HRM.model.CompanyOTDetails;
import com.knoweb.HRM.repository.CompanyOTDetailsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


@Service
public class CompanyOTDetailsService  {

    @Autowired
    private CompanyOTDetailsRepository otDetailsRepository;

    public CompanyOTDetails createCompanyDetails(CompanyOTDetails companyOTDetails) {
        return otDetailsRepository.save(companyOTDetails);
    }

    public CompanyOTDetails updateCompanyOTDetails(Long cmp_id, CompanyOTDetails updateCompanyOTDetails) {
        CompanyOTDetails companyOTDetails = getCompanyOTDetailsByCompanyId(cmp_id);
        if (companyOTDetails != null) {
            companyOTDetails.setCompany_start_time(updateCompanyOTDetails.getCompany_start_time());
            companyOTDetails.setCompany_end_time(updateCompanyOTDetails.getCompany_end_time());
            companyOTDetails.setNormal_ot_rate(updateCompanyOTDetails.getNormal_ot_rate());
            companyOTDetails.setHoliday_ot_rate(updateCompanyOTDetails.getHoliday_ot_rate());
            companyOTDetails.setOT_cal(updateCompanyOTDetails.getOT_cal());
            return otDetailsRepository.save(companyOTDetails);
        }
        return null;
    }

    public CompanyOTDetails getCompanyOTDetailsByCompanyId(long cmp_id) {
        return otDetailsRepository.findByCmpId(cmp_id);
    }
}
