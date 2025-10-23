import React, { useEffect, useState } from 'react';
import axios from 'axios';
import GeneralTableLayout from '../GeneralTableLayout';
import TaskActions from './TaskActions'; // Import the TaskActions component

const TasksList = () => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

  // Fetch users to map IDs to usernames
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
          setError('No access token found, please log in.');
          return;
        }

        const response = await axios.get('/api/diraja/allusers', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        // Handle different response formats
        let userList = [];
        if (Array.isArray(response.data)) {
          userList = response.data;
        } else if (response.data && Array.isArray(response.data.users)) {
          userList = response.data.users;
        } else if (response.data && Array.isArray(response.data.data)) {
          userList = response.data.data;
        }

        setUsers(userList);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Error fetching users data.');
      }
    };

    fetchUsers();
  }, []);

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

  // Helper function to get username from ID
  const getUsername = (userId) => {
    const user = users.find(u => 
      u.users_id === userId || u.user_id === userId || u.id === userId
    );
    return user ? (user.username || user.name || 'Unknown User') : 'Unknown User';
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle edit button click
  const handleEditClick = (task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  // Handle task update
  const handleTaskUpdated = () => {
    fetchTasks(); // Refresh the task list
    setShowTaskModal(false);
  };

  // Handle task deletion
  const handleTaskDeleted = () => {
    fetchTasks(); // Refresh the task list
    setShowTaskModal(false);
  };

  // Filter tasks based on search term
  const filteredTasks = tasks.filter(task => {
    const searchString = searchTerm.toLowerCase();
    return (
      task.task.toLowerCase().includes(searchString) ||
      getUsername(task.assigner_id).toLowerCase().includes(searchString) ||
      getUsername(task.assignee_id).toLowerCase().includes(searchString) ||
      task.status.toLowerCase().includes(searchString)
    );
  });

  // Define table columns
  const columns = [
    {
      header: 'Assigner',
      key: 'assigner_id',
      render: (task) => getUsername(task.assigner_id),
    },
    {
      header: 'Assignee',
      key: 'assignee_id',
      render: (task) => getUsername(task.assignee_id),
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
      header: 'Status',
      key: 'status',
      render: (task) => (
        <span
          style={{
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 'bold',
            backgroundColor:
              task.status === 'Completed' ? '#d4edda' :
              task.status === 'In Progress' ? '#fff3cd' :
              '#f8d7da',
            color:
              task.status === 'Completed' ? '#155724' :
              task.status === 'In Progress' ? '#856404' :
              '#721c24',
          }}
        >
          {task.status}
        </span>
      ),
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
          onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
        >
          Edit
        </button>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '200px' 
      }}>
        <div>Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="tasks-container" style={{ padding: '20px' }}>
      <h2>Tasks Management</h2>
      
      {error && (
        <div 
          style={{ 
            color: 'red', 
            marginBottom: '20px', 
            padding: '10px', 
            border: '1px solid red',
            borderRadius: '4px'
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
            fontSize: '14px'
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

      {/* Task Actions Modal */}
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
            
            <h3 style={{ marginBottom: '20px', color: '#333' }}>
              Edit Task
            </h3>
            
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