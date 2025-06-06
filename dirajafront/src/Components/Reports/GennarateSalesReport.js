import React, { useState } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import {
  Button,
  Form,
  Row,
  Col,
  DatePicker,
  Input,
  Select,
  Card,
  Spin,
  Alert,
} from 'antd';
import { DownloadOutlined } from '@ant-design/icons';

const { Option } = Select;
const { RangePicker } = DatePicker;

const GennarateSalesReport = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const statusOptions = [
    { value: 'paid', label: 'Paid' },
    { value: 'unpaid', label: 'Unpaid' },
  ];

  const handleGennarateSalesReport = async (values) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Authentication required');

      // Prepare filters and set to null if blank
      const filters = {
        search_query: values.search_query || null,
        shopname: values.shopname || null,
        status: values.status || null,
        start_date: values.date_range ? values.date_range[0]?.format('YYYY-MM-DD') : null,
        end_date: values.date_range ? values.date_range[1]?.format('YYYY-MM-DD') : null,
      };

      // Remove any filters that are null or undefined
      Object.keys(filters).forEach((key) => {
        if (filters[key] === null || filters[key] === undefined) {
          delete filters[key];
        }
      });

      const response = await axios.post('/api/diraja/generate-sales-report', filters, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      // Extract filename from content-disposition or create one
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
    <Card title="Generate Sales Report" style={{ maxWidth: 800, margin: '0 auto' }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleGennarateSalesReport}
        initialValues={{
          status: 'paid', // Default status
        }}
      >
        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            closable
            style={{ marginBottom: 24 }}
          />
        )}

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="search_query" label="Search (Customer/User/Shop)">
              <Input placeholder="Search by name, user or shop" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="shopname" label="Shop Name">
              <Input placeholder="Filter by shop name" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="status" label="Status">
              <Select>
                {statusOptions.map((opt) => (
                  <Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="date_range" label="Date Range">
              <RangePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            icon={<DownloadOutlined />}
            loading={loading}
            disabled={loading}
            size="large"
          >
            Generate Excel Report
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default GennarateSalesReport;
