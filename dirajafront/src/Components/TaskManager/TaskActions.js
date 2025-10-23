import React, { useState } from 'react';
import axios from 'axios';

const TaskActions = ({ task, onTaskUpdated, onTaskDeleted }) => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [formData, setFormData] = useState({
        task: task.task,
        assignee_id: task.assignee_id,
        status: task.status,
        due_date: task.due_date ? task.due_date.split('T')[0] : ''
    });

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const response = await axios.put(`/api/diraja/tasks/${task.task_id}`, formData, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                },
            });

            if (response.status === 200) {
                setMessageType('success');
                setMessage('Task updated successfully!');
                setTimeout(() => {
                    onTaskUpdated();
                }, 1000);
            }
        } catch (error) {
            console.error("Error updating task:", error);
            const errorMessage = error.response?.data?.error || "Failed to update task";
            setMessageType('error');
            setMessage(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteConfirm = async () => {
        setLoading(true);
        setMessage('');

        try {
            const response = await axios.delete(`/api/diraja/tasks/${task.task_id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                },
            });

            if (response.status === 200) {
                setMessageType('success');
                setMessage('Task deleted successfully!');
                setTimeout(() => {
                    onTaskDeleted();
                }, 1000);
            }
        } catch (error) {
            console.error("Error deleting task:", error);
            const errorMessage = error.response?.data?.error || "Failed to delete task";
            setMessageType('error');
            setMessage(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div>
            {message && (
                <div style={{
                    padding: '10px',
                    marginBottom: '15px',
                    borderRadius: '4px',
                    backgroundColor: messageType === 'success' ? '#d4edda' : '#f8d7da',
                    color: messageType === 'success' ? '#155724' : '#721c24',
                    border: `1px solid ${messageType === 'success' ? '#c3e6cb' : '#f5c6cb'}`
                }}>
                    {message}
                </div>
            )}

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
                        Assignee ID:
                    </label>
                    <input
                        type="text"
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
                    />
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
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>

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
                    {formData.due_date && (
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                            Current due date: {new Date(formData.due_date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
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
                        {loading ? 'Deleting...' : 'Delete Task'}
                    </button>

                    <div style={{ display: 'flex', gap: '10px' }}>
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
                </div>
            </form>
        </div>
    );
};

export default TaskActions;