import React, { useEffect, useState } from "react";
import { Form, Input, Button, Alert, Select, DatePicker } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { TextArea } = Input;

const AddTask = ({ onSuccess }) => {
  const [form] = Form.useForm();
  const [usersOptions, setUsersOptions] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [loading, setLoading] = useState(false);

  // Get current user ID directly from localStorage
  const getCurrentUserId = () => {
    return localStorage.getItem("users_id");
  };

  // ✅ Fixed: Fetch users for assigning tasks
  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setMessageType("error");
        setMessage("Access token is missing. Please log in again.");
        return;
      }

      try {
        const response = await fetch("/api/diraja/allusers", {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
        });

        // Check if response is ok (status 200-299)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log("User fetch result:", result);

        // More robust data extraction
        let userList = [];
        
        if (Array.isArray(result)) {
          // If the response is directly an array
          userList = result;
        } else if (result && Array.isArray(result.users)) {
          userList = result.users;
        } else if (result && Array.isArray(result.data)) {
          userList = result.data;
        } else {
          console.warn("Unexpected response format:", result);
          setMessageType("warning");
          setMessage("Received unexpected data format from server.");
          return;
        }

        // Validate and format user data
        if (userList.length === 0) {
          setMessageType("info");
          setMessage("No users found to assign tasks to.");
        }

        const formattedUsers = userList
          .map((user) => {
            // Handle different possible field names
            const userId = user.users_id || user.user_id || user.id;
            const username = user.username || user.name || user.email || `User ${userId}`;
            
            if (!userId) {
              console.warn("User missing ID:", user);
              return null;
            }

            return {
              label: username,
              value: userId,
              originalData: user // Keep original data for debugging
            };
          })
          .filter(user => user !== null); // Remove null entries

        setUsersOptions(formattedUsers);

      } catch (error) {
        console.error("Error fetching users:", error);
        setMessageType("error");
        
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
          setMessage("Network error: Unable to connect to server. Please check your connection.");
        } else {
          setMessage(`Error fetching users: ${error.message}`);
        }
      }
    };

    fetchUsers();
  }, []);

  // ✅ Handle form submission
  const handleSubmit = async (values) => {
    setLoading(true);
    setMessage("");

    const token = localStorage.getItem("access_token");
    if (!token) {
      setMessage("Access token not found.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    // Get current user ID from localStorage for assigner
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      setMessage("User ID not found. Please log in again.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    const payload = {
      user_id: currentUserId, // Always use current user from localStorage
      assignee_id: values.assignee_id,
      task: values.task,
      priority:values.priority,
      due_date: values.due_date ? values.due_date.format("YYYY-MM-DD") : null,
      status: values.status || "Pending",
    };

    try {
      const response = await fetch("/api/diraja/newtask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log("Task creation result:", result);

      if (response.ok) {
        setMessage("Task created successfully.");
        setMessageType("success");
        form.resetFields();

        if (onSuccess) onSuccess(result);
      } else {
        setMessage(result.message || "Failed to create task.");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error creating task:", error);
      setMessage("An unexpected error occurred.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0px",
        maxWidth: 400,
      }}
    >
      {message && (
        <Alert
          message={messageType === "success" ? "Success" : 
                  messageType === "error" ? "Error" : 
                  messageType === "warning" ? "Warning" : "Info"}
          description={message}
          type={messageType}
          showIcon
          closable
          onClose={() => setMessage("")}
          style={{ marginBottom: 16 }}
        />
      )}

      <h3>Create New Task</h3>


      <Form.Item
        name="assignee_id"
        label="Assignee"
        rules={[{ required: true, message: "Please select assignee" }]}
      >
        <Select 
          options={usersOptions} 
          placeholder="Select who gets the task"
          notFoundContent={usersOptions.length === 0 ? "No users available" : undefined}
        />
      </Form.Item>

      <Form.Item
        name="task"
        label="Task Description"
        rules={[{ required: true, message: "Please enter task details" }]}
      >
        <TextArea rows={3} placeholder="Describe the task..." />
      </Form.Item>

      <Form.Item
        name="due_date"
        label="Due Date"
        rules={[{ required: true, message: "Please select due date" }]}
      >
        <DatePicker
          format="YYYY-MM-DD"
          style={{ width: "100%" }}
          disabledDate={(current) => current && current < dayjs().startOf("day")}
        />
      </Form.Item>

      <Form.Item
        name="status"
        label="Status"
        initialValue="Pending"
        rules={[{ required: true, message: "Please select status" }]}
      >
        <Select
          options={[
            { label: "Pending", value: "Pending" },
            { label: "In Progress", value: "In Progress" },
            { label: "Completed", value: "Completed" },
          ]}
          placeholder="Select task status"
        />
      </Form.Item>
      <Form.Item
        name="priority"
        label="Priority"
        initialValue="Medium"
        rules={[{ required: true, message: "Please select priority" }]}
      >
        <Select
          options={[
            { label: "High", value: "High" },
            { label: "Medium", value: "Medium" },
            { label: "Low", value: "Low" },
          ]}
          placeholder="Select task priority"
        />
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          icon={<PlusOutlined />}
          loading={loading}
          disabled={loading}
          size="large"
          style={{ width: "100%" }}
        >
          Create Task
        </Button>
      </Form.Item>
    </Form>
  );
};

export default AddTask;