import React, { useEffect, useState } from "react";
import axios from "axios";
import GeneralTableLayout from "../GeneralTableLayout";

const UserPendingTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);

  const user_id = localStorage.getItem("users_id");

  useEffect(() => {
    if (!user_id) {
      setError("User ID not found. Please log in again.");
      setLoading(false);
      return;
    }

    const fetchPendingTasks = async () => {
      try {
        const accessToken = localStorage.getItem("access_token");
        if (!accessToken) {
          setError("No access token found. Please log in again.");
          setLoading(false);
          return;
        }

        const response = await axios.get(`/api/diraja/tasks/pending/${user_id}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (Array.isArray(response.data)) {
          setTasks(response.data);
        } else if (response.data.message) {
          setTasks([]);
          setError(response.data.message);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching pending tasks:", err);
        setError("Failed to fetch pending tasks. Please try again.");
        setLoading(false);
      }
    };

    fetchPendingTasks();
  }, [user_id]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleMarkComplete = async (taskId) => {
    try {
      const accessToken = localStorage.getItem("access_token");
      const response = await axios.put(`/api/diraja/${taskId}/complete`, {}, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.status === 200) {
        // Refresh the task list
        const updatedTasks = tasks.map(task => 
          task.task_id === taskId ? { ...task, status: 'Complete' } : task
        );
        setTasks(updatedTasks);
      }
    } catch (err) {
      console.error("Error marking task as complete:", err);
      setError("Failed to mark task as complete. Please try again.");
    }
  };

  const filteredTasks = tasks.filter((task) =>
    task.task.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      header: "Task Description",
      key: "task",
      render: (task) => (
        <div style={{ maxWidth: "400px", wordWrap: "break-word" }}>
          {task.task}
        </div>
      ),
    },
    {
      header: "Due Date",
      key: "due_date",
      render: (task) => formatDate(task.due_date),
    },
    {
      header: "Actions",
      key: "actions",
      render: (task) => (
        task.status !== 'Complete' && (
          <button
            onClick={() => handleMarkComplete(task.task_id)}
            style={{
              padding: "6px 12px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "bold",
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = "#218838"}
            onMouseOut={(e) => e.target.style.backgroundColor = "#28a745"}
          >
            Mark Complete
          </button>
        )
      ),
    },
  ];

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "200px",
        }}
      >
        <div>Loading pending tasks...</div>
      </div>
    );
  }

  return (
    <div className="pending-tasks-container">
      <h2>My Pending Tasks</h2>

      {error && (
        <div
          style={{
            color: "red",
            marginBottom: "20px",
            padding: "10px",
            border: "1px solid red",
            borderRadius: "4px",
          }}
        >
          {error}
        </div>
      )}

      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "90%",
            maxWidth: "400px",
            padding: "8px 12px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "14px",
          }}
        />
      </div>

      <GeneralTableLayout
        data={filteredTasks}
        columns={columns}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
        emptyMessage="No pending tasks found"
      />

      <div style={{ marginTop: "20px", fontSize: "14px", color: "#666" }}>
        Showing {filteredTasks.length} task(s)
      </div>
    </div>
  );
};

export default UserPendingTasks;