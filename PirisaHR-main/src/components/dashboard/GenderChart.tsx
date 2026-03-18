import { useEffect, useState } from "react";

const EmployeeGenderCard: React.FC = () => {
  const [total, setTotal] = useState(0);
  const [maleCount, setMaleCount] = useState(0);
  const [femaleCount, setFemaleCount] = useState(0);
  const [malePercentage, setMalePercentage] = useState(0);
  const [femalePercentage, setFemalePercentage] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      const cmpId = localStorage.getItem("cmpnyId");
      if (!token) {
        console.error("No token found");
        return;
      }

      try {
        const response = await fetch(
          `/employee/EmpDetailsList/${cmpId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            console.log("No employees found for this company");
            // Set default values when no employees exist
            setTotal(0);
            setMaleCount(0);
            setFemaleCount(0);
            setMalePercentage(0);
            setFemalePercentage(0);
            return;
          }
          throw new Error(`Network response was not ok: ${response.status}`);
        }

        const data = await response.json();
        if (data.resultCode === 100) {
          const employees = data.EmployeeList;
          const totalEmployees = employees.length;
          interface Employee {
            gender: string;
          }

          const maleEmployees = employees.filter(
            (emp: Employee) => emp.gender === "Male"
          ).length;
          const femaleEmployees = totalEmployees - maleEmployees;

          setTotal(totalEmployees);
          setMaleCount(maleEmployees);
          setFemaleCount(femaleEmployees);
          if (totalEmployees > 0) {
            setMalePercentage(Math.round((maleEmployees / totalEmployees) * 100));
            setFemalePercentage(
              Math.round((femaleEmployees / totalEmployees) * 100)
            );
          } else {
            setMalePercentage(0);
            setFemalePercentage(0);
          }
        } else {
          console.error("Failed to fetch employee data:", data.resultDesc);
        }
      } catch (error) {
        console.error("Error fetching employee data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-full">
      {/* Header */}
      <div className="w-full">
        <h2 className="text-xl font-semibold mb-1">Employees</h2>
        <p className="text-sm text-gray-500 mb-4">
          Total number of employees as of {new Date().toLocaleDateString()}
        </p>

        <div className="relative w-48 h-48 mx-auto mb-6">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {/* Male (purple) */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#8B5CF6"
              strokeWidth="20"
              strokeDasharray={`${malePercentage * 2.51} ${100 * 2.51}`}
              className="transform -rotate-90 origin-center"
            />
            {/* Female */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#2DD4BF"
              strokeWidth="20"
              strokeDasharray={`${femalePercentage * 2.51} ${100 * 2.51}`}
              strokeDashoffset={`${-malePercentage * 2.51}`}
              className="transform -rotate-90 origin-center"
            />
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold">{total}</span>
            <span className="text-sm text-gray-500">Total</span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#8B5CF6] mr-2"></div>
              <span className="text-gray-600">Male</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">{maleCount}</span>
              <span className="text-gray-500 text-sm">{malePercentage}%</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#2DD4BF] mr-2"></div>
              <span className="text-gray-600">Female</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">{femaleCount}</span>
              <span className="text-gray-500 text-sm">{femalePercentage}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeGenderCard;
