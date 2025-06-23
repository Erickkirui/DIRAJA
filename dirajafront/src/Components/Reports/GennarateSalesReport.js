import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import {
  Button,
  Form,
  DatePicker,
  Input,
  Select,
  Alert,
  Spin,
} from 'antd';
import { DownloadOutlined } from '@ant-design/icons';

const { Option } = Select;
const { RangePicker } = DatePicker;

const GennarateSalesReport = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shops, setShops] = useState([]);
  const [shopLoading, setShopLoading] = useState(true);

  const statusOptions = [
    { value: 'paid', label: 'Paid' },
    { value: 'unpaid', label: 'Unpaid' },
  ];

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) throw new Error('Authentication required');

        const response = await axios.get('/api/diraja/allshops', {
          headers: { Authorization: `Bearer ${token}` },
        });

        setShops(response.data || []);
      } catch (err) {
        console.error('Failed to fetch shops:', err);
        setError('Failed to load shops list');
      } finally {
        setShopLoading(false);
      }
    };

    fetchShops();
  }, []);

  const handleGennarateSalesReport = async (values) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Authentication required');

      const filters = {
        search_query: values.search_query || null,
        shopname: values.shopname || null,
        status: values.status || null,
        items_purchased: values.items_purchased || null,
        start_date: values.date_range ? values.date_range[0]?.format('YYYY-MM-DD') : null,
        end_date: values.date_range ? values.date_range[1]?.format('YYYY-MM-DD') : null,
      };

      Object.keys(filters).forEach((key) => {
        if (filters[key] == null) delete filters[key];
      });

      const response = await axios.post('/api/diraja/generate-sales-report', filters, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      const filename = response.headers['content-disposition']
        ? response.headers['content-disposition'].split('filename=')[1]
        : `sales_report_${new Date().toISOString().slice(0, 10)}.xlsx`;

      saveAs(new Blob([response.data]), filename);
    } catch (err) {
      console.error('Report generation failed:', err);
      setError(err.response?.data?.error || err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleGennarateSalesReport}
      initialValues={{ status: 'paid' }}
      style={{ display: 'flex', flexDirection: 'column', gap: '0px', maxWidth: 400 }}
    >
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          closable
        />
      )}

      <h1>Generate Sales Report</h1>

      <Form.Item name="shopname" label="Shop Name">
        {shopLoading ? (
          <Spin />
        ) : (
          <Select placeholder="Select shop name" allowClear>
            {shops.map((shop) => (
              <Option key={shop.shop_id} value={shop.shopname}>
                {shop.shopname}
              </Option>
            ))}
          </Select>
        )}
      </Form.Item>

      <Form.Item name="search_query" label="Search (Customer/User)">
        <Input placeholder="Enter Customer or Employee name" />
      </Form.Item>

      <Form.Item name="items_purchased" label="Items Purchased">
        <Input placeholder="Enter item name to filter" />
      </Form.Item>

      <Form.Item name="status" label="Status">
        <Select>
          {statusOptions.map((opt) => (
            <Option key={opt.value} value={opt.value}>
              {opt.label}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item name="date_range" label="Date Range">
        <RangePicker style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          icon={<DownloadOutlined />}
          loading={loading}
          disabled={loading}
          size="large"
          style={{ width: '100%' }}
        >
          Generate Excel Report
        </Button>
      </Form.Item>
    </Form>
  );
};

export default GennarateSalesReport;
