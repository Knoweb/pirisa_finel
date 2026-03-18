import { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Cell } from "recharts";

interface DepartmentData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

const DepartmentStats = () => {
  interface EmpDetailsDTO {
    id: number;
    department?: { dpt_name?: string };
  }

  const [employees, setEmployees] = useState<EmpDetailsDTO[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const cmpnyId = localStorage.getItem("cmpnyId");
    if (!token || !cmpnyId) {
      setEmployees([]);
      return;
    }

    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(
          `/employee/EmpDetailsList/${cmpnyId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            signal: controller.signal,
          }
        );

        if (!res.ok) {
          setEmployees([]);
          return;
        }

        const json = await res.json();
        if (json?.resultCode === 100 && Array.isArray(json?.EmployeeList)) {
          setEmployees(json.EmployeeList);
        } else {
          setEmployees([]);
        }
      } catch {
        setEmployees([]);
      }
    })();

    return () => controller.abort();
  }, []);

  const data: DepartmentData[] = useMemo(() => {
    const palette = [
      "#f471b5",
      "#4ade80",
      "#facc15",
      "#f43f5e",
      "#60a5fa",
      "#a78bfa",
      "#fb923c",
      "#22c55e",
    ];

    const counts = new Map<string, number>();
    for (const e of employees) {
      const name = e.department?.dpt_name || "Unknown";
      counts.set(name, (counts.get(name) || 0) + 1);
    }

    const entries = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((sum, [, v]) => sum + v, 0);

    return entries.map(([name, value], idx) => ({
      name,
      value,
      percentage: total > 0 ? Math.round((value / total) * 100) : 0,
      color: palette[idx % palette.length],
    }));
  }, [employees]);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-6">Department</h2>
      
      <div className="relative flex justify-center mb-8">
        <div className="relative w-48 h-48">
          <PieChart width={200} height={200}>
            <Pie
              data={data}
              cx={96}
              cy={96}
              innerRadius={60}
              outerRadius={96}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-semibold">{total}</span>
            <span className="text-gray-500 text-sm">Total</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {data.map((dept, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: dept.color }}
              />
              <span className="text-gray-600">{dept.name}</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="font-medium">{dept.value}</span>
              <span 
                className="text-xs px-2 py-1 rounded-full"
                style={{ 
                  backgroundColor: `${dept.color}15`,
                  color: dept.color 
                }}
              >
                {dept.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DepartmentStats;
