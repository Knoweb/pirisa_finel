import "./App.css";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import RegisterPage from "./pages/RegisterPage";
import Logout from "./pages/Logout";
import { MainLayout } from "./components/layout/MainLayout";
import AllEmployee from "./pages/EmployeeManagement/AllEmployeePage";
// import NewEmployee from "./pages/Employee/NewEmployeePage";
import DashboardPage from "./pages/DashboardPage";
import { LanguageProvider } from "./context/LanguageProvider";
import EmployeeRegistration from "./pages/EmployeeManagement/NewEmployeePage";
import ProtectedRoute from "./components/ProtectedRoute";
import AttendanceContent from "./pages/Attendance/AttendanceContent";
import DepartmentManager from "./pages/CMPProfile/DepartmentManager";
import AttendanceMark from "./pages/Attendance/AttendanceMark";
import SalaryStatus from "./pages/PayRole/SalaryStatus";
import SalaryMakePage from "./pages/PayRole/SalaryMakePage";
import Invoice from "./pages/PayRole/PayslipList";
import LeaveRequest from "./pages/Leave/expoLeaveRequest";
import CompanyProfile from "./pages/CompanyProfile";
import EmployeeEvaluationForm from "./pages/PerformanceAppraisal/EmployeeEvaluationForm";
import NewEvaluationForm from "./pages/PerformanceAppraisal/NewEvaluationForm";
import EmployeeUpdate from "./pages/EmployeeManagement/EmployeeUpdate";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PayroleReportPage from "./pages/Report/PayroleReportPage";
import CompanySettings from "./pages/CompanySettings";
import EmployeeDashboard from "./pages/Employee/EmployeeDashboard";
import PayroleList from "./pages/Employee/PayroleList";
import EmployeeLeave from "./pages/Employee/EmployeeLeave";
import MonthlyCalendarPage from "./pages/Attendance/MonthlyCalendarPage";
import EmpSalaryAdvance from "./pages/Employee/EmpSalaryAdvance";
import AdvanceRequests from "./pages/PayRole/AdvanceRequests";

// import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <div>
      <BrowserRouter>
        <LanguageProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/auth/logout" element={<Logout />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route index element={<Navigate to="/employee-dashboard" replace />} />
                <Route path="employee-dashboard" element={<EmployeeDashboard />} />

                <Route index element={<Navigate to="/pay-role-list" replace />} />
                <Route path="pay-role-list" element={<PayroleList />} />

                <Route path="emp-salary-advance" element={<EmpSalaryAdvance />} />

                <Route index element={<Navigate to="/emp-leave" replace />} />
                <Route path="emp-leave" element={<EmployeeLeave />} />


                <Route path="employee">
                  <Route index element={<Navigate to="all" replace />} />
                  <Route path="all" element={<AllEmployee />} />
                  <Route path="new" element={<EmployeeRegistration />} />
                  <Route path="edit/:id" element={<EmployeeUpdate />} />
                </Route>
                <Route path="attendance">
                  <Route index element={<Navigate to="list" replace />} />
                  <Route path="list" element={<AttendanceContent />} />
                  <Route path="calendar" element={<MonthlyCalendarPage />} />
                  <Route path="mark" element={<AttendanceMark />} />
                </Route>
                <Route path="payrole">
                  <Route index element={<Navigate to="salaryList" replace />} />
                  <Route path="salaryList" element={<SalaryStatus />} />
                  <Route
                    path="makesalary/:employeeId"
                    element={<SalaryMakePage />}
                  />
                  <Route path="advanceRequests" element={<AdvanceRequests />} />
                  <Route path="payslips/:employeeId" element={<Invoice />} />
                </Route>
                <Route path="leave">
                  <Route index element={<Navigate to="requests" replace />} />
                  <Route path="requests" element={<LeaveRequest />} />
                  {/* <Route
                    path="payslips/:employeeId"
                    element={<SalaryMakePage />}
                  /> */}
                </Route>
                <Route path="reports">
                  <Route index element={<Navigate to="payRoleReport" replace />} />
                  <Route path="payRoleReport" element={<PayroleReportPage />} />
                  <Route
                    path="summary-report"
                    element={<DepartmentManager />}
                  />
                </Route>
                <Route path="performance">
                  <Route
                    index
                    element={<Navigate to="evaluationForm" replace />}
                  />
                  <Route
                    path="evaluationForm"
                    element={<EmployeeEvaluationForm />}
                  />
                  <Route path="newForm" element={<NewEvaluationForm />} />
                </Route>
                <Route path="/companyProfile" element={<CompanyProfile />} />
                <Route path="/company-settings" element={<CompanySettings/>} />
              </Route>
            </Route>
          </Routes>
        </LanguageProvider>
      </BrowserRouter>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
}

export default App;
