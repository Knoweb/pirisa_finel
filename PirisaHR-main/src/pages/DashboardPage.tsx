import AttendanceChart from "../components/dashboard/AttendanceChart";
import DashboardCalendar from "../components/dashboard/DashboardCalendar";
import CandidatesListTable from "../components/dashboard/CandidatesListTable";
import RealtimeInsightCard from "../components/dashboard/DashboardTimeCard";
import DepartmentStats from "../components/dashboard/DepartmentStats";
import EmployeeGrowthChart from "../components/dashboard/EmployeeGrowthChart";
import EmployeeGenderCard from "../components/dashboard/GenderChart";
import LeaveRequestTable from "../components/dashboard/LeaveRequestTable";
import CrossAppNavButton from "../components/layout/CrossAppNavButton";

const DashboardPage = () => (
  <div className="flex flex-col gap-5 w-full">
    {/* Page Header matching Ginum Style */}
    <div className="flex justify-between items-center mb-2">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      <CrossAppNavButton />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div className="lg:col-span-4">
        <RealtimeInsightCard />
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div className="lg:col-span-4">
        <EmployeeGenderCard />
      </div>
      <div className="lg:col-span-8">
        <EmployeeGrowthChart />
      </div>
    </div>

    <div className="w-full">
      <DashboardCalendar />
    </div>

    <div className="w-full">
      <AttendanceChart />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div className="lg:col-span-8">
        <LeaveRequestTable />
      </div>
      <div className="lg:col-span-4">
        <DepartmentStats />
      </div>
    </div>

    <CandidatesListTable />
  </div>
);

export default DashboardPage;
