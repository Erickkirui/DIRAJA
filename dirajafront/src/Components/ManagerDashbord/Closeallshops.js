import React, { useState } from "react";
import axios from "axios";

const ResetShopReportStatus = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleReset = async () => {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const token = localStorage.getItem("token"); // adjust key if different
      const response = await axios.put(
        "api/diraja/reset-report",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessage(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset report status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 rounded-lg shadow-md border w-full max-w-md bg-white">
      <h2 className="text-lg font-semibold mb-3">Reset Shop Report Status</h2>

      {message && (
        <div className="p-2 mb-3 rounded bg-green-100 text-green-700">
          {message}
        </div>
      )}
      {error && (
        <div className="p-2 mb-3 rounded bg-red-100 text-red-700">
          {error}
        </div>
      )}

      <button
        onClick={handleReset}
        disabled={loading}
        className={`px-4 py-2 rounded text-white ${
          loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {loading ? "Resetting..." : "Reset Reports"}
      </button>
    </div>
  );
};

export default ResetShopReportStatus;
