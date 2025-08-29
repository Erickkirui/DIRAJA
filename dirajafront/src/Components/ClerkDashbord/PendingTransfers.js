import React, { useEffect, useState } from "react";
import axios from "axios";
import LoadingAnimation from "../LoadingAnimation";
import GeneralTableLayout from "../GeneralTableLayout";

const PendingTransfers = () => {
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Fetch pending transfers
  const fetchPendingTransfers = async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem("access_token");

      if (!accessToken) {
        setError("No access token found, please log in.");
        setLoading(false);
        return;
      }

      const response = await axios.get("/api/diraja/transfers/pending", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setPendingTransfers(response.data.pending_transfers || []);
    } catch (err) {
      setError("Error fetching pending transfers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingTransfers();
  }, []);

  // Handle "Receive Stock"
  const handleReceive = async (transferId) => {
    try {
      const accessToken = localStorage.getItem("access_token");
      await axios.patch(`/api/diraja/transfers/${transferId}/receive`, {}, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Refresh list after receiving
      fetchPendingTransfers();
    } catch (err) {
      alert("Error receiving stock. Please try again.");
    }
  };

  // Define table columns
  const columns = [
    { header: "Item", key: "itemname" },
    {
      header: "Quantity",
      key: "quantity",
      render: (transfer) => `${transfer.quantity} ${transfer.metric}`,
    },
    {
      header: "Action",
      key: "action",
      render: (transfer) => (
        <button
          style={{
            backgroundColor: "#28a745",
            color: "white",
            padding: "6px 12px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
          onClick={() => handleReceive(transfer.transferv2_id)}
        >
          Receive Stock
        </button>
      ),
    },
  ];

  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="transfers-container">
      <h2>Pending Transfers</h2>

      {loading ? (
        <LoadingAnimation />
      ) : pendingTransfers.length > 0 ? (
        <GeneralTableLayout
          data={pendingTransfers}
          columns={columns}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      ) : (
        <p>No pending transfers found.</p>
      )}
    </div>
  );
};

export default PendingTransfers;
