import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const PendingTasksButton = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const user_id = localStorage.getItem("users_id");
        const accessToken = localStorage.getItem("access_token");

        if (!user_id || !accessToken) {
          setLoading(false);
          return;
        }

        const response = await axios.get(`/api/diraja/tasks/pending/${user_id}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (Array.isArray(response.data)) {
          // Count only tasks that are not completed
          const pendingTasks = response.data.filter(
            (task) => task.status !== 'Complete'
          );
          setPendingCount(pendingTasks.length);
        } else {
          setPendingCount(0);
        }
      } catch (err) {
        console.error("Error fetching pending task count:", err);
        setPendingCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingCount();

    // Refresh count every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000);
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
    backgroundColor: "#dc2626",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: "bold",
    padding: "3px 7px",
    borderRadius: "9999px",
    minWidth: "20px",
    height: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <button
      onClick={() => navigate("/pending-tasks")}
      style={buttonStyle}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1d4ed8")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
    >
      My Pending Task
      {!loading && pendingCount > 0 && (
        <span style={badgeStyle}>{pendingCount}</span>
      )}
    </button>
  );
};

export default PendingTasksButton;