import React, { useEffect, useState } from 'react';
import axios from 'axios';
import GeneralTableLayout from '../GeneralTableLayout';
import TaskActions from './TaskActions';

const TasksList = () => {
  const [tasks, setTasks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        setError('No access token found, please log in.');
        return;
      }

      const response = await axios.get('/api/diraja/alltasks', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setTasks(response.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Error fetching tasks. Please try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleEditClick = (task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleTaskUpdated = () => {
    fetchTasks();
    setShowTaskModal(false);
  };

  const handleTaskDeleted = () => {
    fetchTasks();
    setShowTaskModal(false);
  };

  const filteredTasks = tasks.filter((task) => {
    const searchString = searchTerm.toLowerCase();
    return (
      task.task.toLowerCase().includes(searchString) ||
      (task.assigner_username &&
        task.assigner_username.toLowerCase().includes(searchString)) ||
      (task.assignee_username &&
        task.assignee_username.toLowerCase().includes(searchString)) ||
      task.status.toLowerCase().includes(searchString)
    );
  });

  // === Updated Status Cell ===
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Complete':
        return { color: '#28a745', fontWeight: '600' }; // light green
      case 'In Progress':
        return { color: '#ffc107', fontWeight: '600' }; // yellow
      case 'Pending':
        return { color: '#dc3545', fontWeight: '600' }; // red
      default:
        return { color: '#6c757d' }; // gray fallback
    }
  };

  const columns = [
    {
      header: 'Assigner',
      key: 'assigner_username',
      render: (task) => task.assigner_username || 'Unknown',
    },
    {
      header: 'Assignee',
      key: 'assignee_username',
      render: (task) => task.assignee_username || 'Unknown',
    },
    {
      header: 'Task Description',
      key: 'task',
      render: (task) => (
        <div style={{ maxWidth: '300px', wordWrap: 'break-word' }}>
          {task.task}
        </div>
      ),
    },
    {
      header: 'Assigned Date',
      key: 'assigned_date',
      render: (task) => formatDate(task.assigned_date),
    },
    {
      header: 'Due Date',
      key: 'due_date',
      render: (task) => formatDate(task.due_date),
    },
    {
      header: "Priority",
      key: "priority",
      render: (task) => {
        let backgroundColor = "";
        switch (task.priority?.toLowerCase()) {
          case "high":
            backgroundColor = "#b94a48"; // red tone
            break;
          case "medium":
            backgroundColor = "#a07a2b"; // brown tone
            break;
          case "low":
            backgroundColor = "#3b7b63"; // green tone
            break;
          default:
            backgroundColor = "#6c757d"; // gray for unknown
        }

        return (
          <span
            style={{
              display: "inline-block",
              padding: "4px 10px",
              borderRadius: "4px",
              backgroundColor,
              color: "white",
              fontSize: "12px",
              fontWeight: "600",
              textTransform: "capitalize",
            }}
          >
            {task.priority}
          </span>
        );
      },
},

    {
      header: "Status",
      key: "status",
      render: (task) => {
        let backgroundColor = "";
        let dotColor = "";

        switch (task.status?.toLowerCase()) {
          case "complete":
            backgroundColor = "#37674c"; // green background
            dotColor = "#46a171"; // light green dot
            break;
          case "in progress":
            backgroundColor = "#355f8b"; // blue background
            dotColor = "#2783de"; // light blue dot
            break;
          case "pending":
            backgroundColor = "#934b45"; // gray background
            dotColor = "#852118ff"; // light gray dot
            break;
          default:
            backgroundColor = "#6c757d"; // fallback gray
            dotColor = "#d1d5db";
        }

        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "9999px", // fully rounded
              backgroundColor,
              color: "white",
              fontSize: "12px",
              fontWeight: "600",
              textTransform: "capitalize",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: dotColor,
              }}
            ></span>
            {task.status}
          </span>
        );
      },
    },

    {
      header: 'Actions',
      key: 'actions',
      render: (task) => (
        <button
          onClick={() => handleEditClick(task)}
          style={{
            padding: '6px 12px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = '#0056b3')}
          onMouseOut={(e) => (e.target.style.backgroundColor = '#007bff')}
        >
          Edit
        </button>
      ),
    },
  ];

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '200px',
        }}
      >
        <div>Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="tasks-container">
      {error && (
        <div
          style={{
            color: 'red',
            marginBottom: '20px',
            padding: '10px',
            border: '1px solid red',
            borderRadius: '4px',
          }}
        >
          {error}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search tasks, assigners, assignees, or status..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
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
        emptyMessage="No tasks found"
      />

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        Showing {filteredTasks.length} task(s)
      </div>

      {selectedTask && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: showTaskModal ? 'flex' : 'none',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setShowTaskModal(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                color: '#666',
              }}
            >
              ×
            </button>

            <h3 style={{ marginBottom: '20px', color: '#333' }}>Edit Task</h3>

            <TaskActions
              task={selectedTask}
              onTaskUpdated={handleTaskUpdated}
              onTaskDeleted={handleTaskDeleted}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksList;
