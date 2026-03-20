import { useEffect, useMemo, useState } from "react";
import StatisticItem from "../StatisticItem";

interface AttendanceDTO {
  id: number;
  startedAt?: string;
  endedAt?: string;
  working_status?: string;
  attendance_status?: string;
  totalTime?: number;
  dayName?: string;
}

interface AttendanceEmployeeDTO {
  id: number;
  attendanceList?: AttendanceDTO[];
}

const AttendanceStatsCard = () => {
  const [employees, setEmployees] = useState<AttendanceEmployeeDTO[]>([]);

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
          `/api/employee/lastattendanceList/${cmpnyId}`,
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

  const stats = useMemo(() => {
    const total = employees.length;

    const normalize = (v?: string) => (v || "").toUpperCase().trim();
    const isLate = (a?: AttendanceDTO) => {
      const att = normalize(a?.attendance_status);
      const work = normalize(a?.working_status);
      return att === "LATE" || work === "LATE";
    };

    let present = 0;
    let absent = 0;
    let leave = 0;
    let pending = 0;
    let offday = 0;
    let late = 0;

    for (const e of employees) {
      const latest = Array.isArray(e.attendanceList) ? e.attendanceList[0] : undefined;
      const s = normalize(latest?.attendance_status);
      if (isLate(latest)) late += 1;
      if (s === "PRESENT") present += 1;
      else if (s === "ABSENT") absent += 1;
      else if (s === "LEAVE") leave += 1;
      else if (s === "PENDING") pending += 1;
      else if (s === "OFFDAY" || s === "OFF_DAY" || s === "OFF") offday += 1;
    }

    const pct = (value: number) => {
      if (!total) return "0%";
      return `${((value / total) * 100).toFixed(2)}%`;
    };

    return [
      { label: "Present", value: present, percentage: pct(present) },
      { label: "Absent", value: absent, percentage: pct(absent) },
      { label: "Leave", value: leave, percentage: pct(leave) },
      { label: "Pending", value: pending, percentage: pct(pending) },
      { label: "Offday", value: offday, percentage: pct(offday) },
      { label: "Late", value: late, percentage: pct(late) },
    ];
  }, [employees]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-full">
      {/* Header */}
      <h2 className="text-xl font-semibold text-gray-500 mb-4">Today</h2>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 ">
        {stats.map((stat, index) => (
          <StatisticItem
            key={index}
            label={stat.label}
            value={stat.value}
            percentage={stat.percentage}
          />
        ))}
      </div>
    </div>
  );
};

export default AttendanceStatsCard;
