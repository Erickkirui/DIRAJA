import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const PendingSpoiltStockButton = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const accessToken = localStorage.getItem("access_token");

        if (!accessToken) {
          setLoading(false);
          return;
        }

        const response = await axios.get(`/api/diraja/spoilt/pending`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.data.pending_records && Array.isArray(response.data.pending_records)) {
          setPendingCount(response.data.pending_records.length);
        } else {
          setPendingCount(0);
        }
      } catch (err) {
        console.error("Error fetching pending spoilt stock count:", err);
        setPendingCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingCount();

    // Refresh count every 30 minutes (1800000 milliseconds)
    const interval = setInterval(fetchPendingCount, 1800000);
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
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  };

  const handleClick = () => {
    navigate("/pending-spoilt");
  };

  const handleMouseEnter = (e) => {
    e.currentTarget.style.backgroundColor = "#b91c1c";
    e.currentTarget.style.transform = "translateY(-1px)";
  };

  const handleMouseLeave = (e) => {
    e.currentTarget.style.backgroundColor = "#2563eb";
    e.currentTarget.style.transform = "translateY(0)";
  };

  const handleMouseDown = (e) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.backgroundColor = "#991b1b";
  };

  const handleMouseUp = (e) => {
    e.currentTarget.style.transform = "translateY(-1px)";
    e.currentTarget.style.backgroundColor = "#b91c1c";
  };

  return (
    <button
      onClick={handleClick}
      style={buttonStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      title={`${pendingCount} pending spoilt stock records awaiting approval`}
    >
      Spoilt Stock
      {!loading && pendingCount > 0 && (
        <span style={badgeStyle}>
          {pendingCount > 99 ? "99+" : pendingCount}
        </span>
      )}
    </button>
  );
};

export default PendingSpoiltStockButton;