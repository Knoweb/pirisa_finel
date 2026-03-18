import RealtimeInsightCard from "../../components/dashboard/DashboardTimeCard"
import AttendanceDashboard from "../../EmployeeFolder/EmployeeDashboard.tsx/AttendanceDashboard"
import  { LeaveCards } from "../../EmployeeFolder/EmployeeDashboard.tsx/DashboardLeave"

function EmployeeDashboard() {
  return (
   <div className="flex flex-col gap-5">
    <div className="gap-2.5 flex flex-col md:flex-row">
      <RealtimeInsightCard />
      <LeaveCards/>
      </div>
      <AttendanceDashboard />

      </div>
  )
}

export default EmployeeDashboard
