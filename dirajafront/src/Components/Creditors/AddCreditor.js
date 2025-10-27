import React, { useEffect, useState } from "react";
import { Form, Input, Button, Alert, Select, InputNumber } from "antd";
import { PlusOutlined } from "@ant-design/icons";

const AddCreditor = ({ onSuccess }) => {
  const [form] = Form.useForm();
  const [shopsOptions, setShopsOptions] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [loading, setLoading] = useState(false);

  // Fetch shops for assigning creditors
  useEffect(() => {
    const fetchShops = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setMessageType("error");
        setMessage("Access token is missing. Please log in again.");
        return;
      }

      try {
        const response = await fetch("/api/diraja/allshops", {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log("Shops fetch result:", result);

        let shopList = [];
        
        if (Array.isArray(result)) {
          shopList = result;
        } else if (result && Array.isArray(result.shops)) {
          shopList = result.shops;
        } else if (result && Array.isArray(result.data)) {
          shopList = result.data;
        } else {
          console.warn("Unexpected response format:", result);
          setMessageType("warning");
          setMessage("Received unexpected data format from server.");
          return;
        }

        const formattedShops = shopList
          .map((shop) => {
            // Use shops_id as the ID and shopname as the display name
            const shopId = shop.shops_id || shop.id || shop.shop_id;
            const shopName = shop.shopname || shop.name || shop.shop_name || `Shop ${shopId}`;
            
            if (!shopId) {
              console.warn("Shop missing ID:", shop);
              return null;
            }

            return {
              label: shopName,
              value: shopId,
              originalData: shop
            };
          })
          .filter(shop => shop !== null);

        setShopsOptions(formattedShops);
        console.log("Formatted shops options:", formattedShops);

      } catch (error) {
        console.error("Error fetching shops:", error);
        setMessageType("error");
        
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
          setMessage("Network error: Unable to connect to server. Please check your connection.");
        } else {
          setMessage(`Error fetching shops: ${error.message}`);
        }
      }
    };

    fetchShops();
  }, []);

  // Handle form submission
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

    const payload = {
      name: values.name,
      shop_id: values.shop_id,
      phone_number: values.phone_number,
      credit_amount: values.credit_amount || 0.0,
    };

    try {
      const response = await fetch("/api/diraja/add-creditors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log("Creditor creation result:", result);

      if (response.ok) {
        setMessage("Creditor created successfully.");
        setMessageType("success");
        form.resetFields();

        if (onSuccess) onSuccess(result);
      } else {
        setMessage(result.error || result.message || "Failed to create creditor.");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error creating creditor:", error);
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

      <h3>Create New Creditor</h3>

      <Form.Item
        name="name"
        label="Creditor Name"
        rules={[
          { required: true, message: "Please enter creditor name" },
          { min: 2, message: "Name must be at least 2 characters" }
        ]}
      >
        <Input placeholder="Enter creditor name" />
      </Form.Item>

      <Form.Item
        name="phone_number"
        label="Phone Number"
        rules={[
          { required: true, message: "Please enter phone number" },
          {
            pattern: /^[+]?[\d\s\-()]{10,}$/,
            message: "Please enter a valid phone number"
          }
        ]}
      >
        <Input 
          placeholder="Enter phone number" 
        />
      </Form.Item>

      <Form.Item
        name="shop_id"
        label="Shop"
        rules={[{ required: true, message: "Please select shop" }]}
      >
        <Select 
          options={shopsOptions} 
          placeholder="Select shop"
          notFoundContent={shopsOptions.length === 0 ? "No shops available" : undefined}
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          optionFilterProp="label"
        />
      </Form.Item>

      <Form.Item
        name="credit_amount"
        label="Credit Amount"
        initialValue={0.0}
        rules={[
          { required: true, message: "Please enter credit amount" },
          { type: 'number', min: 0, message: 'Credit amount cannot be negative' }
        ]}
      >
        <InputNumber
          style={{ width: "100%" }}
          placeholder="Enter credit amount"
          step={0.01}
          precision={2}
          formatter={value => ` ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={value => value.replace(/\$\s?|(,*)/g, '')}
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
          Create Creditor
        </Button>
      </Form.Item>
    </Form>
  );
};

export default AddCreditor;