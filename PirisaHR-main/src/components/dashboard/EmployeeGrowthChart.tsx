import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer
} from 'recharts';

import { useEffect, useMemo, useState } from "react";

interface EmployeeData {
  month: string;
  male: number;
  female: number;
}

interface EmpDetailsDTO {
  id: number;
  gender?: string;
  dateOfJoining?: string;
}

const EmployeeGrowthChart = () => {
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
          `/api/employee/EmpDetailsList/${cmpnyId}`,
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

  const data: EmployeeData[] = useMemo(() => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const init = months.map((m) => ({ month: m, male: 0, female: 0 }));

    const monthIndex = (value?: string) => {
      if (!value) return null;
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return null;
      return d.getMonth();
    };

    const normGender = (g?: string) => (g || "").toUpperCase().trim();

    for (const e of employees) {
      const idx = monthIndex(e.dateOfJoining);
      if (idx === null) continue;
      const gender = normGender(e.gender);
      if (gender === "MALE") init[idx].male += 1;
      else if (gender === "FEMALE") init[idx].female += 1;
    }

    return init;
  }, [employees]);

  const yMax = useMemo(() => {
    const maxVal = Math.max(
      0,
      ...data.map((d) => Math.max(d.male || 0, d.female || 0))
    );
    return Math.max(5, Math.ceil(maxVal * 1.2));
  }, [data]);

  return (
    <div className="w-full bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-6">Employees Growth</h2>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="month"
              tick={{ fill: '#6B7280' }}
              tickLine={{ stroke: '#6B7280' }}
            />
            <YAxis
              tick={{ fill: '#6B7280' }}
              tickLine={{ stroke: '#6B7280' }}
              domain={[0, yMax]}
            />
            <Legend
              wrapperStyle={{
                paddingTop: '20px'
              }}
            />
            <Bar
              dataKey="male"
              name="Male"
              fill="#93C5FD"
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
            <Bar
              dataKey="female"
              name="Female"
              fill="#4ADE80"
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default EmployeeGrowthChart;
