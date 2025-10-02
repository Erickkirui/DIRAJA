import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Alert, Select } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const { TextArea } = Input;

const CreateItem = ({ onSuccess }) => {
  const [form] = Form.useForm();
  const [accountsOptions, setAccountsOptions] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [loading, setLoading] = useState(false);

  const itemTypeOptions = [
    { label: 'Inventory', value: 'Inventory' },
    { label: 'Expense', value: 'Expense' },
    { label: 'Fixed asset', value: 'Fixed asset' },
  ];

  // ✅ Fetch Chart of Accounts on mount
  useEffect(() => {
    const fetchChartOfAccounts = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setMessageType('error');
        setMessage('Access token is missing.');
        return;
      }

      try {
        const response = await fetch('api/diraja/chart-of-accounts', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        if (response.ok) {
          const formatted = result.chart_of_accounts.map((acc) => ({
            label: acc.name,
            value: acc.id,
          }));
          setAccountsOptions(formatted);
        } else {
          setMessageType('error');
          setMessage(result.message || 'Failed to fetch chart of accounts.');
        }
      } catch (error) {
        setMessageType('error');
        setMessage('Error fetching chart accounts.');
      }
    };

    fetchChartOfAccounts();
  }, []);

  // ✅ Handle submit
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

    const payload =
      values.itemType === 'Inventory'
        ? {
            item_type: values.itemType,
            item_name: values.itemName,
            description: values.description,
            purchase_account: values.purchaseAccount,
            sales_account: values.salesAccount,
            cost_of_sales_account: values.costOfSalesAccount,
          }
        : {
            item_type: values.itemType,
            item_name: values.itemName,
            description: values.description,
            gl_account_id: values.glAccount,
          };

    try {
      const response = await fetch('api/diraja/create-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (response.ok) {
        setMessage('Item created successfully.');
        setMessageType('success');
        form.resetFields();

        if (onSuccess) {
          onSuccess(result);
        }
      } else {
        setMessage(result.message || 'Failed to create item.');
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

      <h3>Create Item</h3>

      <Form.Item
        name="itemName"
        label="Item Name"
        rules={[{ required: true, message: 'Please enter item name' }]}
      >
        <Input placeholder="Item Name" />
      </Form.Item>

      <Form.Item
        name="itemType"
        label="Item Type"
        rules={[{ required: true, message: 'Please select item type' }]}
      >
        <Select options={itemTypeOptions} placeholder="Select Item Type" />
      </Form.Item>

      <Form.Item name="description" label="Description">
        <TextArea rows={3} placeholder="Optional description" />
      </Form.Item>

      {/* Conditional rendering */}
      <Form.Item shouldUpdate={(prev, curr) => prev.itemType !== curr.itemType}>
        {({ getFieldValue }) =>
          getFieldValue('itemType') === 'Inventory' ? (
            <>
              <Form.Item
                name="purchaseAccount"
                label="Purchase Account"
                rules={[{ required: true, message: 'Please select purchase account' }]}
              >
                <Select options={accountsOptions} placeholder="Select purchase account" />
              </Form.Item>

              <Form.Item
                name="salesAccount"
                label="Sales Account"
                rules={[{ required: true, message: 'Please select sales account' }]}
              >
                <Select options={accountsOptions} placeholder="Select sales account" />
              </Form.Item>

              <Form.Item
                name="costOfSalesAccount"
                label="Cost of Sales Account"
                rules={[{ required: true, message: 'Please select cost of sales account' }]}
              >
                <Select options={accountsOptions} placeholder="Select cost of sales account" />
              </Form.Item>
            </>
          ) : (
            <Form.Item
              name="glAccount"
              label="Chart of Accounts"
              rules={[{ required: true, message: 'Please select chart of account' }]}
            >
              <Select options={accountsOptions} placeholder="Select chart account" />
            </Form.Item>
          )
        }
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
          Create Item
        </Button>
      </Form.Item>
    </Form>
  );
};

export default CreateItem;
