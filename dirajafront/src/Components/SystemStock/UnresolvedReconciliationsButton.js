import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const UnresolvedReconciliationsButton = () => {
  const [unresolvedCount, setUnresolvedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUnresolvedCount = async () => {
      try {
        const accessToken = localStorage.getItem("access_token");

        if (!accessToken) {
          setLoading(false);
          return;
        }

        const response = await axios.get(`/api/diraja/stock-reconciliation`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.data && Array.isArray(response.data.reconciliations)) {
          // Count only reconciliations that are not solved
          const unresolvedReconciliations = response.data.reconciliations.filter(
            (reconciliation) => reconciliation.status !== 'Solved'
          );
          setUnresolvedCount(unresolvedReconciliations.length);
        } else {
          setUnresolvedCount(0);
        }
      } catch (err) {
        console.error("Error fetching unresolved reconciliation count:", err);
        setUnresolvedCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchUnresolvedCount();

    // Refresh count every hour (3600000 milliseconds)
    const interval = setInterval(fetchUnresolvedCount, 3600000);
    return () => clearInterval(interval);
  }, []);

  const buttonStyle = {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 16px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontWeight: "500",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "background-color 0.2s ease-in-out",
    fontSize: "14px",
    marginLeft: "10px", // Add some spacing if used alongside other buttons
  };

  const badgeStyle = {
    position: "absolute",
    top: "-6px",
    right: "-6px",
    backgroundColor: "#ffffff",
    color: "#dc2626",
    fontSize: "12px",
    fontWeight: "bold",
    padding: "3px 3px",
    borderRadius: "9999px",
    minWidth: "20px",
    height: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid #dc2626",
  };

  return (
    <button
      onClick={() => navigate("/reconsiliation")}
      style={buttonStyle}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#b91c1c")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#dc2626")}
    >
      Unresolved Stock
      {!loading && unresolvedCount > 0 && (
        <span style={badgeStyle}>{unresolvedCount}</span>
      )}
    </button>
  );
};

export default UnresolvedReconciliationsButton;