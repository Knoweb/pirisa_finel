import { useCallback, useEffect, useMemo, useState } from "react";
import Table from "../table/Table";
import { Check, X } from "lucide-react";

interface LeaveRequest {
  id: string;
  empId: number;
  name: string;
  leaveFrom: string;
  leaveTo: string;
  status: "Pending" | "Approved" | "Reject";
}

interface EmpDetailsLeaveDTO {
  id: number;
  leaveType: string;
  leaveReason: string;
  leaveStatus: string;
  leaveStartDay: string;
  leaveEndDay: string;
  leaveDays: number;
}

interface EmpDetailsDTO {
  id: number;
  firstName: string;
  lastName: string;
  leaveList?: EmpDetailsLeaveDTO[];
}

const LeaveRequestTable = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [employees, setEmployees] = useState<EmpDetailsDTO[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<number, string>>({});

  const toDateKeyLocal = useCallback((d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  useEffect(() => {
    return () => {
      Object.values(photoUrls).forEach((url) => {
        if (url) {
          try {
            URL.revokeObjectURL(url);
          } catch {
            // no-op
          }
        }
      });
    };
  }, [photoUrls]);

  const fetchEmployees = useCallback(async (signal?: AbortSignal) => {
    const token = localStorage.getItem("token");
    const cmpnyId = localStorage.getItem("cmpnyId");
    if (!token || !cmpnyId) {
      setEmployees([]);
      return;
    }

    try {
      const res = await fetch(
        `/api/employee/EmpDetailsList/${cmpnyId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          signal,
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
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchEmployees(controller.signal);

    const interval = window.setInterval(() => {
      fetchEmployees();
    }, 30000);

    const onFocusOrVisible = () => {
      if (document.visibilityState === "visible") fetchEmployees();
    };

    window.addEventListener("focus", onFocusOrVisible);
    document.addEventListener("visibilitychange", onFocusOrVisible);

    return () => {
      controller.abort();
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", onFocusOrVisible);
    };
  }, [fetchEmployees]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const empIds = employees
      .map((e) => e.id)
      .filter((v): v is number => typeof v === "number" && !Number.isNaN(v));

    if (empIds.length === 0) {
      setPhotoUrls({});
      return;
    }

    let cancelled = false;

    (async () => {
      const results = await Promise.all(
        empIds.map(async (empId) => {
          try {
            const existsResp = await fetch(
              `/api/profile-image/exists/${empId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (!existsResp.ok) return { empId, url: null as string | null };
            const existsData: { hasProfileImage?: boolean; exists?: boolean } =
              await existsResp.json();
            const hasImage = Boolean(
              existsData?.hasProfileImage ?? existsData?.exists
            );
            if (!hasImage) return { empId, url: null as string | null };

            const imgResp = await fetch(
              `/api/profile-image/view/${empId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (!imgResp.ok) return { empId, url: null as string | null };
            const blob = await imgResp.blob();
            if (!blob || blob.size === 0) {
              return { empId, url: null as string | null };
            }
            return { empId, url: URL.createObjectURL(blob) };
          } catch {
            return { empId, url: null as string | null };
          }
        })
      );

      if (cancelled) {
        results.forEach((r) => {
          if (r.url) {
            try {
              URL.revokeObjectURL(r.url);
            } catch {
              // no-op
            }
          }
        });
        return;
      }

      setPhotoUrls((prev) => {
        Object.values(prev).forEach((url) => {
          if (url) {
            try {
              URL.revokeObjectURL(url);
            } catch {
              // no-op
            }
          }
        });

        const map: Record<number, string> = {};
        results.forEach((r) => {
          if (r.url) map[r.empId] = r.url;
        });
        return map;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [employees]);

  const normalizeStatus = (status?: string) => (status || "").toUpperCase().trim();

  const formatDateOnly = useCallback(
    (value?: string) => {
      if (!value) return "";

      const raw = String(value).trim();
      const m = raw.match(/\d{4}-\d{2}-\d{2}/);
      if (m) return m[0];

      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) return "";
      return toDateKeyLocal(d);
    },
    [toDateKeyLocal]
  );

  const parseDateOnly = useCallback(
    (value?: string) => {
      const s = formatDateOnly(value);
      if (!s) return null;

      const parts = s.split("-").map((v) => Number(v));
      if (parts.length !== 3) return null;
      const [y, m, d] = parts;
      if (!y || !m || !d) return null;

      const dt = new Date(y, m - 1, d);
      return Number.isNaN(dt.getTime()) ? null : dt;
    },
    [formatDateOnly]
  );

  const pendingRequests: LeaveRequest[] = useMemo(() => {
    const statusMap = (status?: string): LeaveRequest["status"] => {
      const s = normalizeStatus(status);
      if (s === "APPROVED") return "Approved";
      if (s === "REJECT" || s === "REJECTED") return "Reject";
      return "Pending";
    };

    const rows: LeaveRequest[] = [];
    for (const emp of employees) {
      const leaves = Array.isArray(emp.leaveList) ? emp.leaveList : [];
      for (const leave of leaves) {
        const mappedStatus = statusMap(leave.leaveStatus);
        if (mappedStatus !== "Pending") continue;
        rows.push({
          id: String(leave.id),
          empId: emp.id,
          name: `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || "-",
          leaveFrom: formatDateOnly(leave.leaveStartDay),
          leaveTo: formatDateOnly(leave.leaveEndDay),
          status: mappedStatus,
        });
      }
    }
    return rows;
  }, [employees, formatDateOnly]);

  type CalendarLeaveRow = {
    id: string;
    key: string;
    empId: number;
    name: string;
    leaveType: string;
    leaveReason: string;
    leaveFrom: string;
    leaveTo: string;
    leaveStatus: string;
  };

  const approvedLeaves: CalendarLeaveRow[] = useMemo(() => {
    const rows: CalendarLeaveRow[] = [];
    for (const emp of employees) {
      const leaves = Array.isArray(emp.leaveList) ? emp.leaveList : [];
      const name = `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || "-";
      for (const leave of leaves) {
        const status = normalizeStatus(leave.leaveStatus);
        if (status !== "APPROVED") continue;
        const leaveFrom = formatDateOnly(leave.leaveStartDay);
        const leaveTo = formatDateOnly(leave.leaveEndDay);
        if (!leaveFrom || !leaveTo) continue;
        rows.push({
          id: String(leave.id),
          key: `${emp.id}-${leave.id}`,
          empId: emp.id,
          name,
          leaveType: (leave.leaveType || "").toString() || "-",
          leaveReason: (leave.leaveReason || "").toString() || "-",
          leaveFrom,
          leaveTo,
          leaveStatus: status,
        });
      }
    }
    return rows;
  }, [employees, formatDateOnly]);

  const data = pendingRequests;

  // Calculate total pages
  const totalPages = Math.ceil(data.length / rowsPerPage);

  // Create empty rows to fill the remaining space
  // const emptyRows = Array(rowsPerPage - data.length).fill(null).map((_, index) => ({
  //   id: `empty-${index}`,
  //   name: "",
  //   leaveFrom: "",
  //   leaveTo: "",
  //   status: "" as "Pending" | "Approved" | "Reject", // Empty status for empty rows
  // }));

  // // Combine actual data with empty rows
  // const currentData = [...data, ...emptyRows];

  const getStatusColor = (status: LeaveRequest["status"]) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-600";
      case "Approved":
        return "bg-green-100 text-green-600";
      case "Reject":
        return "bg-red-100 text-red-600";
      default:
        return "";
    }
  };

  const columns = [
    {
      key: "name",
      title: "Name",
      render: (request: LeaveRequest) => {
        if (!request.name) return <div className="h-8"></div>; // Empty space for empty rows
        const imgUrl = photoUrls[request.empId];
        return (
          <div className="flex items-center gap-3">
            {imgUrl ? (
              <img
                src={imgUrl}
                alt={request.name}
                className="w-8 h-8 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-100"></div>
            )}
            <span className="font-medium text-gray-900">{request.name}</span>
          </div>
        );
      },
    },
    {
      key: "leaveFrom",
      title: "Leave From",
      className: "text-gray-600",
      render: (request: LeaveRequest) => {
        if (!request.leaveFrom) return <div className="h-8"></div>;
        return request.leaveFrom;
      }
    },
    {
      key: "leaveTo",
      title: "Leave To",
      className: "text-gray-600",
      render: (request: LeaveRequest) => {
        if (!request.leaveTo) return <div className="h-8"></div>;
        return request.leaveTo;
      }
    },
    {
      key: "status",
      title: "Status",
      render: (request: LeaveRequest) => {
        if (!request.status) return <div className="h-8"></div>;
        return (
          <span
            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
              request.status
            )}`}
          >
            {request.status}
          </span>
        );
      },
    },
    {
      key: "action",
      title: "Action",
      render: (request: LeaveRequest) => {
        if (!request.status) return <div className="h-8"></div>;
        return (
          <div className="flex gap-2">
            <button
              type="button"
              className={`p-1 rounded ${
                request.status === "Approved"
                  ? "bg-green-100 text-green-600"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              type="button"
              className={`p-1 rounded ${
                request.status === "Reject"
                  ? "bg-red-100 text-red-600"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  const calendarTitle = useMemo(() => {
    const monthName = calendarMonth.toLocaleString(undefined, { month: "long" });
    return `${monthName} ${calendarMonth.getFullYear()}`;
  }, [calendarMonth]);

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const start = new Date(year, month, 1 - startWeekday);
    const cells: { date: Date; inMonth: boolean; key: string }[] = [];

    for (let i = 0; i < 42; i += 1) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = toDateKeyLocal(d);
      cells.push({ date: d, inMonth: d.getMonth() === month, key });
    }

    if (daysInMonth <= 28 && startWeekday === 0) {
      return cells.slice(0, 35);
    }

    return cells;
  }, [calendarMonth, toDateKeyLocal]);

  const leaveCountByDate = useMemo(() => {
    const map = new Map<string, number>();
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (const leave of approvedLeaves) {
      const start = parseDateOnly(leave.leaveFrom);
      const end = parseDateOnly(leave.leaveTo);
      if (!start || !end) continue;

      const s = new Date(start);
      const e = new Date(end);
      if (s > e) continue;

      const min = new Date(year, month, 1);
      const max = new Date(year, month, daysInMonth);
      const rangeStart = s < min ? min : s;
      const rangeEnd = e > max ? max : e;

      const iter = new Date(rangeStart);
      while (iter <= rangeEnd) {
        const key = toDateKeyLocal(iter);
        map.set(key, (map.get(key) ?? 0) + 1);
        iter.setDate(iter.getDate() + 1);
      }
    }

    return map;
  }, [approvedLeaves, calendarMonth, parseDateOnly, toDateKeyLocal]);

  const selectedDayLeaves = useMemo(() => {
    if (!selectedDate) return [];
    const target = parseDateOnly(selectedDate);
    if (!target) return [];

    return approvedLeaves.filter((leave) => {
      const s = parseDateOnly(leave.leaveFrom);
      const e = parseDateOnly(leave.leaveTo);
      if (!s || !e) return false;
      return target >= s && target <= e;
    });
  }, [approvedLeaves, parseDateOnly, selectedDate]);

  const selectedDayColumns = useMemo(
    () => [
      {
        key: "name",
        title: "Name",
        render: (row: CalendarLeaveRow) => {
          const imgUrl = photoUrls[row.empId];
          return (
            <div className="flex items-center gap-3">
              {imgUrl ? (
                <img
                  src={imgUrl}
                  alt={row.name}
                  className="w-8 h-8 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-100"></div>
              )}
              <span className="font-medium text-gray-900">{row.name}</span>
            </div>
          );
        },
      },
      { key: "leaveType", title: "Type", className: "text-gray-600" },
      { key: "leaveFrom", title: "Leave From", className: "text-gray-600" },
      { key: "leaveTo", title: "Leave To", className: "text-gray-600" },
    ],
    [photoUrls]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="text-lg font-semibold text-gray-900">Leave Calendar</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setCalendarMonth(
                  (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                )
              }
              className="px-3 py-1 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Previous
            </button>
            <div className="text-sm font-medium text-gray-800 min-w-[140px] text-center">
              {calendarTitle}
            </div>
            <button
              type="button"
              onClick={() =>
                setCalendarMonth(
                  (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                )
              }
              className="px-3 py-1 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 text-xs text-gray-500 mb-2">
          <div className="text-center">Sun</div>
          <div className="text-center">Mon</div>
          <div className="text-center">Tue</div>
          <div className="text-center">Wed</div>
          <div className="text-center">Thu</div>
          <div className="text-center">Fri</div>
          <div className="text-center">Sat</div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((cell) => {
            const key = cell.key;
            const count = leaveCountByDate.get(key) ?? 0;
            const isClickable = count > 0;

            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  if (!isClickable) return;
                  setSelectedDate(key);
                }}
                className={`relative h-12 rounded-lg border text-left px-2 py-1 transition-colors ${
                  cell.inMonth
                    ? "border-gray-200 bg-white"
                    : "border-gray-100 bg-gray-50"
                } ${
                  isClickable
                    ? "hover:bg-blue-50 hover:border-blue-200 cursor-pointer"
                    : "cursor-default"
                }`}
              >
                <div
                  className={`text-xs font-medium ${
                    cell.inMonth ? "text-gray-800" : "text-gray-400"
                  }`}
                >
                  {cell.date.getDate()}
                </div>
                {count > 0 ? (
                  <div className="absolute top-1 right-1 min-w-5 h-5 px-1 rounded-full bg-blue-600 text-white text-[11px] flex items-center justify-center">
                    {count}
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="mt-3 text-xs text-gray-500">
          Approved leave count per day (click a date to view employees).
        </div>
      </div>

      <Table
        columns={columns}
        data={data}
        title="Leave Requests"
        rowClickable={false}
        pagination={{
          currentPage,
          totalPages,
          onPageChange: setCurrentPage,
        }}
      />

      {selectedDate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-5xl bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <div className="text-base font-semibold text-gray-900">
                Leaves on {selectedDate}
              </div>
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="px-3 py-1 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            <div className="p-4">
              <Table
                columns={selectedDayColumns}
                data={selectedDayLeaves}
                title=""
                rowClickable={false}
                pagination={{
                  currentPage: 1,
                  totalPages: 1,
                  onPageChange: () => {},
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default LeaveRequestTable;
