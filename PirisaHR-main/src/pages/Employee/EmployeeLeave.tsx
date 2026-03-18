import EmployeeLeaveRequest from "../../EmployeeLeave/EmployeeLeaveRequest";
import EmployeeLeaveList from "./EmployeeLeaveList";


const EmployeeLeave = () => {


  return (
    <div className="min-h-screen p-6">
      <EmployeeLeaveRequest />
      <EmployeeLeaveList />

    </div>
  );
};

export default EmployeeLeave;
