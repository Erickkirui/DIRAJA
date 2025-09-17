import React, { useState } from 'react';
import { Form, Input, Button, Alert } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const AddChartOfAccount = ({ onSuccess }) => {
  const [form] = Form.useForm();
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    setMessage('');

    const token = localStorage.getItem('access_token');
    if (!token) {
      setMessage('Access token not found.');
      setMessageType('error');
      setLoading(false);
      return;
    }

    const payload = {
      code: values.code,
      name: values.name,
      type: values.type,
    };

    try {
      const response = await fetch('/api/diraja/add-chart-of-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (response.ok) {
        setMessage('Chart of account added successfully.');
        setMessageType('success');
        form.resetFields();

        if (onSuccess) {
          onSuccess(result);
        }
      } else {
        setMessage(result.message || 'Failed to add chart of account');
        setMessageType('error');
      }
    } catch (error) {
      console.error(error);
      setMessage('An unexpected error occurred.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: '0px', maxWidth: 400 }}
    >
      {message && (
        <Alert
          message={messageType === 'success' ? 'Success' : 'Error'}
          description={message}
          type={messageType}
          showIcon
          closable
          onClose={() => setMessage('')}
          style={{ marginBottom: 16 }}
        />
      )}

      <h3>Add Chart of Account</h3>

      <Form.Item
        name="code"
        label="Account Code"
        rules={[{ required: true, message: 'Please enter account code' }]}
      >
        <Input placeholder="Account Code (e.g., 1001)" />
      </Form.Item>

      <Form.Item
        name="name"
        label="Account Name"
        rules={[{ required: true, message: 'Please enter account name' }]}
      >
        <Input placeholder="Account Name (e.g., Cash)" />
      </Form.Item>

      <Form.Item
        name="type"
        label="Account Type"
        rules={[{ required: true, message: 'Please enter account type' }]}
      >
        <Input placeholder="Account Type (e.g., Asset, Liability, etc.)" />
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          icon={<PlusOutlined />}
          loading={loading}
          disabled={loading}
          size="large"
          style={{ width: '100%' }}
        >
          Add Account
        </Button>
      </Form.Item>
    </Form>
  );
};

export default AddChartOfAccount;
