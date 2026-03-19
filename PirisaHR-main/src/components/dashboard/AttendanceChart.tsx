import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { SlidersHorizontal } from "lucide-react";

// interface AttendanceData {
//   date: string;
//   value: number;
//   highlight?: boolean;
// }

type TimeRange = "Daily" | "Weekly" | "Monthly";

interface EmpDetailsDTO {
  id: number;
}

interface AttendanceDTO {
  id: number;
  startedAt?: string;
  attendance_status?: string;
}

interface AttendanceEmployeeDTO {
  id: number;
  attendanceList?: AttendanceDTO[];
}

interface ChartPoint {
  date: string;
  value: number;
  highlight?: boolean;
}

const AttendanceChart = () => {
  const [selectedRange, setSelectedRange] = useState<TimeRange>("Daily");

  const [totalEmployees, setTotalEmployees] = useState(0);
  const [attendanceEmployees, setAttendanceEmployees] = useState<AttendanceEmployeeDTO[]>([]);

  const month = useMemo(() => new Date().getMonth() + 1, []);

  const fetchChartData = useCallback(
    async (signal: AbortSignal) => {
      const token = localStorage.getItem("token");
      const cmpnyId = localStorage.getItem("cmpnyId");
      if (!token || !cmpnyId) {
        setTotalEmployees(0);
        setAttendanceEmployees([]);
        return;
      }

      const [empRes, attRes] = await Promise.all([
        fetch(`/api/employee/EmpDetailsList/${cmpnyId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          signal,
        }),
        fetch(`/api/employee/attendanceList/${cmpnyId}/${month}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          signal,
        }),
      ]);

      if (empRes.ok) {
        const empJson = await empRes.json();
        if (empJson?.resultCode === 100 && Array.isArray(empJson?.EmployeeList)) {
          setTotalEmployees((empJson.EmployeeList as EmpDetailsDTO[]).length);
        } else {
          setTotalEmployees(0);
        }
      } else {
        setTotalEmployees(0);
      }

      if (attRes.ok) {
        const attJson = await attRes.json();
        if (attJson?.resultCode === 100 && Array.isArray(attJson?.EmployeeList)) {
          setAttendanceEmployees(attJson.EmployeeList as AttendanceEmployeeDTO[]);
        } else {
          setAttendanceEmployees([]);
        }
      } else {
        setAttendanceEmployees([]);
      }
    },
    [month]
  );

  useEffect(() => {
    const controller = new AbortController();

    const run = async () => {
      try {
        await fetchChartData(controller.signal);
      } catch {
        setTotalEmployees(0);
        setAttendanceEmployees([]);
      }
    };

    run();

    const intervalId = window.setInterval(() => {
      run();
    }, 15000);

    const handleFocus = () => {
      run();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        run();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      controller.abort();
    };
  }, [fetchChartData]);

  interface CustomTooltipProps {
    active?: boolean;
    payload?: { value: number }[];
  }

  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 shadow-lg rounded-lg border border-gray-100">
          <p className="font-medium text-sm">{`${payload[0].value}%`}</p>
        </div>
      );
    }
    return null;
  };

  const currentData: ChartPoint[] = useMemo(() => {
    const denom = totalEmployees || 0;
    if (!denom) return [];

    const normalize = (v?: string) => (v || "").toUpperCase().trim();
    const isPresent = (a?: AttendanceDTO) => {
      const s = normalize(a?.attendance_status);
      if (!s) return true;
      if (s === "ABSENT") return false;
      if (s === "LEAVE") return false;
      if (s === "PENDING") return false;
      if (s === "OFFDAY" || s === "OFF_DAY" || s === "OFF") return false;
      return true;
    };

    // Aggregate by day-of-month for current month
    const dayMap = new Map<number, number>();
    for (const emp of attendanceEmployees) {
      const list = Array.isArray(emp.attendanceList) ? emp.attendanceList : [];
      for (const a of list) {
        if (!a?.startedAt) continue;
        const d = new Date(a.startedAt);
        if (Number.isNaN(d.getTime())) continue;
        const day = d.getDate();
        if (isPresent(a)) dayMap.set(day, (dayMap.get(day) || 0) + 1);
      }
    }

    const daily: ChartPoint[] = Array.from(dayMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([day, presentCount]) => {
        const value = Math.round((presentCount / denom) * 100);
        return { date: String(day).padStart(2, "0"), value };
      });

    if (selectedRange === "Daily") {
      const maxVal = daily.reduce((m, p) => Math.max(m, p.value), 0);
      return daily.map((p) => ({ ...p, highlight: p.value === maxVal && maxVal > 0 }));
    }

    if (selectedRange === "Weekly") {
      const weekMap = new Map<number, { presentSum: number; days: number }>();
      for (const point of daily) {
        const day = Number(point.date);
        const week = Math.floor((day - 1) / 7) + 1;
        const prev = weekMap.get(week) || { presentSum: 0, days: 0 };
        weekMap.set(week, { presentSum: prev.presentSum + point.value, days: prev.days + 1 });
      }

      const weekly = Array.from(weekMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([w, agg]) => ({
          date: `Week ${w}`,
          value: agg.days ? Math.round(agg.presentSum / agg.days) : 0,
        }));

      const maxVal = weekly.reduce((m, p) => Math.max(m, p.value), 0);
      return weekly.map((p) => ({ ...p, highlight: p.value === maxVal && maxVal > 0 }));
    }

    // Monthly (current year): approximate using employees' month-wise attendance in current year
    const year = new Date().getFullYear();
    const monthMap = new Map<number, { presentDays: number; totalDays: number }>();
    for (const emp of attendanceEmployees) {
      const list = Array.isArray(emp.attendanceList) ? emp.attendanceList : [];
      for (const a of list) {
        if (!a?.startedAt) continue;
        const d = new Date(a.startedAt);
        if (Number.isNaN(d.getTime()) || d.getFullYear() !== year) continue;
        const m = d.getMonth();
        const prev = monthMap.get(m) || { presentDays: 0, totalDays: 0 };
        monthMap.set(m, {
          presentDays: prev.presentDays + (isPresent(a) ? 1 : 0),
          totalDays: prev.totalDays + 1,
        });
      }
    }

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthly: ChartPoint[] = monthNames.map((name, idx) => {
      const agg = monthMap.get(idx);
      const pct = agg && agg.totalDays ? Math.round((agg.presentDays / agg.totalDays) * 100) : 0;
      return { date: name, value: pct };
    });

    const maxVal = monthly.reduce((m, p) => Math.max(m, p.value), 0);
    return monthly.map((p) => ({ ...p, highlight: p.value === maxVal && maxVal > 0 }));
  }, [attendanceEmployees, selectedRange, totalEmployees]);

  return (
    <div className="w-full bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Attendance Comparison Chart
        </h2>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-4">
            {["Daily", "Weekly", "Monthly"].map((range) => (
              <label
                key={range}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name="timeRange"
                  checked={selectedRange === range}
                  onChange={() => setSelectedRange(range as TimeRange)}
                  className="w-4 h-4 text-blue-600 cursor-pointer accent-blue-600"
                />
                <span className="text-sm text-gray-600">{range}</span>
              </label>
            ))}
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <SlidersHorizontal className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={currentData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#6B7280' }}
              tickLine={{ stroke: '#6B7280' }}
            />
            <YAxis
              tick={{ fill: '#6B7280' }}
              tickLine={{ stroke: '#6B7280' }}
              domain={[0, 100]}
              ticks={[0, 20, 40, 60, 80, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818CF8" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#818CF8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Line
              type="monotone"
              dataKey="value"
              stroke="#818CF8"
              strokeWidth={2}
              dot={(props: { cx: number; cy: number; index: number }) => {
                const highlight = currentData[props.index]?.highlight;
                return (
                  <circle
                    key={`dot-${props.index}`}
                    cx={props.cx}
                    cy={props.cy}
                    r={highlight ? 6 : 4}
                    fill={highlight ? '#818CF8' : '#FFF'}
                    stroke="#818CF8"
                    strokeWidth={2}
                  />
                );
              }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AttendanceChart;
