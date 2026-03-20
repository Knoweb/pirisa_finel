# API Call Path Correction - Implementation Summary

This document summarizes the effort to identify and correct API call paths missing the required `/api/` prefix.

## 1. Files Corrected (Missing `/api/` Prefix)

The following files were identified as missing the `/api/` prefix in `fetch` or `axios` calls and have been updated:

| File Path | Corrected Endpoints |
| :--- | :--- |
| `src/components/CompanyProfile/ResetPassword.tsx` | `changePassword` endpoints for both Employee and Company roles. |
| `src/pages/CompanyProfile/OTSetting.tsx` | `ot_setting` fetch and update endpoints. |
| `src/pages/PayRole/PayslipList.tsx` | `payroleListEmp` fetch call. |
| `src/pages/Employee/PayroleList.tsx` | `payroleListEmp` fetch call. |
| `src/pages/Employee/EmployeeProfile.tsx` | Multiple calls: `leave_balance`, `document/view`, `profile-image/exists`, `profile-image/view`. |

## 2. Files Verified (Already Correct)

The following files were reviewed and confirmed to already use the `/api/` prefix (either manually or via the `backendUrl` / `axiosInstance` helpers):

- `src/pages/EmployeeManagement/EmployeeUpdate.tsx`
- `src/pages/EmployeeManagement/NewEmployeePage.tsx`
- `src/pages/Employee/EmployeeLeaveList.tsx`
- `src/pages/CompanySettings.tsx`
- `src/EmployeeLeave/EmployeeLeaveRequest.tsx`
- `src/components/windows/EmployeeDetailsPopup.tsx`
- `src/components/PayRole/SalaryStatusTable.tsx`
- `src/components/dashboard/AttendanceChart.tsx`
- `src/components/dashboard/DashboardCalendar.tsx`
- `src/pages/CMPProfile/DepartmentManager.tsx`
- `src/components/CompanyProfile/BonusSetting.tsx`
- `src/pages/RegisterPage.tsx` (uses `backendUrl`)
- `src/pages/Login.tsx` (uses `backendUrl`)

## 3. Potential Remaining Issues

- **Backend Error 500 on `/api/employee/EmpDetailsList/2`**: Since this path ALREADY includes the `/api/` prefix, the 500 error reported by the user might be a backend logic error or an issue with the specific ID provided.
- **`cmpnyId` vs `cmpId`**: There is some inconsistency in variable names for company IDs (e.g., `cmpnyId`, `companyId`, `cmpId`). While most are correctly retrieved from `localStorage.getItem("cmpnyId")`, ensure all components use the same key.

## 4. Recommendations

1. **Adopt `axiosInstance`**: Systematically migrate all `fetch` and direct `axios` calls to use the `axiosInstance` defined in `src/api/config/axios.ts`. This ensures consistent `baseURL` (including `/api/` prefix) and automatic `Authorization` header injection.
2. **Unified Backend Helper**: Use `backendUrl()` helper for any remaining `fetch` calls to avoid manual path concatenation and prefixing.
3. **Backend Log Review**: Investigating the backend logs for the reported 500 error is recommended, as the frontend path appears correct.
