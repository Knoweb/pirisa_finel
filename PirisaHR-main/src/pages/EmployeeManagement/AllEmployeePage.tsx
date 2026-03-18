import Buttons from "../../components/Buttons";
import EmployeeStatsSection from "../../components/dashboard/EmployeeStatsSection";
// import SearchBar from "../../components/SearchBar";
import EmployeeTable from "../../Employee/EmployeeTable";

const AllEmployeePage = () => (
  <div className="flex flex-col gap-5">
    <div className="w-full max-w-6xl relative">
      <EmployeeStatsSection />

      <div className="absolute  right-0">
        <Buttons />
      </div>
      {/* <div className="py-5">
      <SearchBar />
      </div> */}
      <div className="py-15">
      <EmployeeTable/>
      </div>
     
    </div>
  </div>
);
export default AllEmployeePage;
