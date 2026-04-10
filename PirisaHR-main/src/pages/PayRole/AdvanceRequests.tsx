/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Loading from "../../components/Loading/Loading";
import { Check, X } from "lucide-react";

interface AdvanceRequest {
  id: number;
  employeeId: string;
  requestDate: string;
  amountRequested: number;
  approvedBy: string | null;
  repaymentDeductionMonth: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  remarks: string;
}

const AdvanceRequests = () => {
  const [requests, setRequests] = useState<AdvanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token") || "";

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const cmpId = localStorage.getItem("cmpnyId");
      
      // Fetch all requests
      let url = "/api/advances?status=ALL";
      if (cmpId) {
        url += `&cmpId=${cmpId}`;
      }

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      } else {
        toast.error("Failed to fetch pending requests.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: number, status: "APPROVED" | "REJECTED") => {
    try {
      // Assuming Admin's employee ID is stored here, adjust as needed or use user ID
      const adminId = localStorage.getItem("empId") || "Admin"; 
      
      const res = await fetch(
        `/api/advances/${id}/status?status=${status}&approvedBy=${adminId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        toast.success(`Request ${status.toLowerCase()} successfully.`);
        fetchPendingRequests(); // Refresh list to remove processed item
      } else {
        toast.error(`Failed to ${status.toLowerCase()} request.`);
      }
    } catch (error) {
      console.error(error);
      toast.error(`Error processing request.`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-semibold border border-green-200">APPROVED</span>;
      case "REJECTED":
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-semibold border border-red-200">REJECTED</span>;
      default:
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-semibold border border-yellow-200">PENDING</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Salary Advances</h1>
        <p className="text-gray-500 mt-1">Review and manage all employee advance requests</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64"><Loading size="lg" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500">
                  <th className="p-4">Employee ID</th>
                  <th className="p-4">Request Date</th>
                  <th className="p-4">Amount (LKR)</th>
                  <th className="p-4">Deduction Month</th>
                  <th className="p-4">Remarks</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      No advance requests found.
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-medium text-gray-800">{req.employeeId}</td>
                      <td className="p-4 text-sm text-gray-700">
                        {new Date(req.requestDate).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-sm font-medium text-blue-600">
                        {req.amountRequested.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-sm text-gray-600">{req.repaymentDeductionMonth}</td>
                      <td className="p-4 text-sm text-gray-600 max-w-xs">{req.remarks || '-'}</td>
                      <td className="p-4">
                        {getStatusBadge(req.status)}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          {req.status === "PENDING" ? (
                            <>
                              <button
                                onClick={() => handleAction(req.id, "APPROVED")}
                                title="Approve"
                                className="bg-green-100 text-green-700 p-2 rounded-lg hover:bg-green-200 transition-colors shadow-sm"
                              >
                                <Check size={18} />
                              </button>
                              <button
                                onClick={() => handleAction(req.id, "REJECTED")}
                                title="Reject"
                                className="bg-red-100 text-red-700 p-2 rounded-lg hover:bg-red-200 transition-colors shadow-sm"
                              >
                                <X size={18} />
                              </button>
                            </>
                          ) : (
                            <span className="text-gray-400 text-xs font-semibold">PROCESSED</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvanceRequests;