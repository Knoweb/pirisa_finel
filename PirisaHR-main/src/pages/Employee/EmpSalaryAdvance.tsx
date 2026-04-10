/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Loading from "../../components/Loading/Loading";

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

const EmpSalaryAdvance = () => {
  const [requests, setRequests] = useState<AdvanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    amountRequested: "",
    repaymentDeductionMonth: "",
    remarks: "",
  });

  const empId = localStorage.getItem("empId") || "";
  const token = localStorage.getItem("token") || "";

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    if (!empId) return;
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:8080/api/v1/hr/advances/employee/${empId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      } else {
        toast.error("Failed to fetch advance requests.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amountRequested || !formData.repaymentDeductionMonth) {
      toast.warning("Please fill all required fields.");
      return;
    }

    try {
      const payload = {
        employeeId: empId,
        amountRequested: parseFloat(formData.amountRequested),
        repaymentDeductionMonth: formData.repaymentDeductionMonth,
        remarks: formData.remarks,
      };

      const res = await fetch("http://localhost:8080/api/v1/hr/advances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Request submitted successfully!");
        setShowModal(false);
        setFormData({ amountRequested: "", repaymentDeductionMonth: "", remarks: "" });
        fetchRequests();
      } else {
        toast.error("Failed to submit request.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error submitting request.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Salary Advance</h1>
          <p className="text-gray-500 mt-1">Manage your salary advance requests</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Request Advance
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64"><Loading size="lg" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500">
                  <th className="p-4">Request Date</th>
                  <th className="p-4">Amount (LKR)</th>
                  <th className="p-4">Deduction Month</th>
                  <th className="p-4">Remarks</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      No advance requests found.
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-sm text-gray-700">
                        {new Date(req.requestDate).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-sm font-medium text-gray-800">
                        {req.amountRequested.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-sm text-gray-600">{req.repaymentDeductionMonth}</td>
                      <td className="p-4 text-sm text-gray-600 max-w-xs truncate" title={req.remarks}>
                        {req.remarks || '-'}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor(req.status)}`}>
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl relative">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Request Salary Advance</h2>
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount Requested (LKR) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={formData.amountRequested}
                  onChange={(e) => setFormData({ ...formData, amountRequested: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. 25000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deduction Month *
                </label>
                <input
                  type="month"
                  required
                  value={formData.repaymentDeductionMonth}
                  onChange={(e) => setFormData({ ...formData, repaymentDeductionMonth: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remarks / Reason
                </label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={3}
                  placeholder="Reason for advance..."
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmpSalaryAdvance;