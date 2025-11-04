import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TaskActions = ({ task, onTaskUpdated, onTaskDeleted }) => {
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [formData, setFormData] = useState({
        task: task.task,
        assignee_id: task.assignee_id,
        status: task.status,
        due_date: task.due_date ? task.due_date.split('T')[0] : ''
    });

    // Fetch users for assignee dropdown
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const accessToken = localStorage.getItem('access_token');
                const response = await axios.get('/api/diraja/allusers', {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });

                let userList = [];
                if (Array.isArray(response.data)) {
                    userList = response.data;
                } else if (response.data?.users) {
                    userList = response.data.users;
                } else if (response.data?.data) {
                    userList = response.data.data;
                }

                setUsers(userList);
            } catch (err) {
                console.error('Error fetching users:', err);
            }
        };

        fetchUsers();
    }, []);

    // Get current assignee name
    const getAssigneeName = () => {
        const user = users.find(u =>
            u.users_id === task.assignee_id ||
            u.user_id === task.assignee_id ||
            u.id === task.assignee_id
        );
        return user ? (user.username || user.name || 'Unknown User') : 'Unknown User';
    };

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await axios.put(`/api/diraja/tasks/${task.task_id}`, formData, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                },
            });

            if (response.status === 200) {
                onTaskUpdated();
            }
        } catch (error) {
            console.error("Error updating task:", error);
            alert(error.response?.data?.error || "Failed to update task");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;

        setLoading(true);
        try {
            const response = await axios.delete(`/api/diraja/tasks/${task.task_id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
            });

            if (response.status === 200) {
                onTaskDeleted();
            }
        } catch (error) {
            console.error("Error deleting task:", error);
            alert(error.response?.data?.error || "Failed to delete task");
        } finally {
            setLoading(false);
        }
    };

    const handleMarkComplete = async () => {
        setLoading(true);

        try {
            const response = await axios.put(`/api/diraja/${task.task_id}/complete`, {}, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                },
            });

            if (response.status === 200) {
                onTaskUpdated();
            }
        } catch (error) {
            console.error("Error marking task as complete:", error);
            alert(error.response?.data?.error || "Failed to mark task as complete");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {/* Current Assignee Display */}
            <div style={{
                marginBottom: '15px',
                padding: '10px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                border: '1px solid #e9ecef'
            }}>
                <strong>Current Assignee:</strong> {getAssigneeName()}
            </div>

            <form onSubmit={handleEditSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Task Description:
                    </label>
                    <textarea
                        rows="3"
                        name="task"
                        value={formData.task}
                        onChange={handleInputChange}
                        required
                        style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Assignee:
                    </label>
                    <select
                        name="assignee_id"
                        value={formData.assignee_id}
                        onChange={handleInputChange}
                        style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}
                    >
                        <option value="">Select Assignee</option>
                        {users.map(user => (
                            <option key={user.users_id || user.user_id || user.id} value={user.users_id || user.user_id || user.id}>
                                {user.username || user.name || 'Unknown User'}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Status:
                    </label>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}
                    >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Complete">Complete</option>
                    </select>
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Status:
                    </label>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}
                    >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Complete">Complete</option>
                    </select>
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Priority:
                    </label>
                    <select
                        name="priority"
                        value={formData.priority}
                        onChange={handleInputChange}
                        style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}
                    >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>
                </div>

                {/* Due Date (pre-filled with current due date) */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Due Date:
                    </label>
                    <input
                        type="date"
                        name="due_date"
                        value={formData.due_date}
                        onChange={handleInputChange}
                        style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}
                    />
                </div>

                {/* Bottom Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                        type="button"
                        onClick={handleDeleteConfirm}
                        disabled={loading}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            opacity: loading ? 0.6 : 1
                        }}
                    >
                        {loading ? 'Deleting...' : 'Delete'}
                    </button>

                    <button
                        type="button"
                        onClick={onTaskUpdated}
                        disabled={loading}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        Cancel
                    </button>

                    {task.status !== 'Complete' && (
                        <button
                            type="button"
                            onClick={handleMarkComplete}
                            disabled={loading}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                opacity: loading ? 0.6 : 1
                            }}
                        >
                            {loading ? 'Completing...' : 'Mark Complete'}
                        </button>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            opacity: loading ? 0.6 : 1
                        }}
                    >
                        {loading ? 'Updating...' : 'Update Task'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TaskActions;
