import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Typography,
  Space,
  Alert,
  InputNumber,
  DatePicker,
  message,
  Popconfirm,
  Row,
  Col,
  Input,
  Form,

  Select,
} from 'antd';
import {
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  DeleteOutlined,
    PlusOutlined,
} from '@ant-design/icons';
import DownloadPDF from '../Download/DownloadPDF';
import LoadingAnimation from '../LoadingAnimation';

const { Title, Text } = Typography;
const { Option } = Select;

const SingleSale = () => {
  const { sale_id } = useParams();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shopname, setShopname] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedSale, setEditedSale] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    method: '',
    amount_paid: '',
    balance: '',
    transaction_code: ''
  });

  const statusOptions = ['unpaid', 'paid', 'partially_paid'];
  const paymentMethodOptions = ['bank', 'cash', 'mpesa', 'sasapay'];

  useEffect(() => {
    const fetchSale = async () => {
      try {
        const response = await fetch(`/api/diraja/sale/${sale_id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch sale data');

        const data = await response.json();
        setSale(data.sale);
        setEditedSale({
          ...data.sale,
          sold_items: data.sale.sold_items ? [...data.sale.sold_items] : []
        });
        setPaymentMethods(data.sale.payment_methods || []);

        if (data.sale.shop_id) {
          const shopResponse = await fetch(`api/diraja/shop/${data.sale.shop_id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('access_token')}`,
            },
          });

          if (shopResponse.ok) {
            const shopData = await shopResponse.json();
            setShopname(shopData.name);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSale();
  }, [sale_id]);

  const handleSave = async () => {
    try {
      // Calculate total price from items
      const total_price = editedSale.sold_items.reduce(
        (sum, item) => sum + (item.quantity * item.unit_price),
        0
      );

      // Prepare the data for the PUT request
      const requestData = {
        customer_name: editedSale.customer_name,
        customer_number: editedSale.customer_number,
        status: editedSale.status,
        note: editedSale.note,
        promocode: editedSale.promocode,
        balance: editedSale.balance,
        items: editedSale.sold_items.map(item => ({
          id: item.id,
          item_name: item.item_name,
          quantity: item.quantity,
          metric: item.metric,
          unit_price: item.unit_price,
          total_price: item.quantity * item.unit_price,
          BatchNumber: item.batch_number,
          stockv2_id: item.stockv2_id,
          Cost_of_sale: item.cost_of_sale || 0,
          Purchase_account: item.purchase_account || 0,
          LivestockDeduction: item.livestock_deduction || 0
        })),
        payment_methods: paymentMethods.map(payment => ({
          id: payment.id,
          payment_method: payment.payment_method,
          amount_paid: payment.amount_paid,
          balance: payment.balance,
          transaction_code: payment.transaction_code
        }))
      };

      const response = await fetch(`api/diraja/sale/${sale_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update sale');
      }

      const result = await response.json();
      message.success(result.message || 'Sale updated successfully');
      setIsEditing(false);
      // Refresh the data
      window.location.reload();
    } catch (err) {
      message.error(err.message || 'Failed to save changes');
    }
  };

  const handleChangeItem = (index, field, value) => {
    const updatedItems = [...editedSale.sold_items];
    updatedItems[index][field] = value;
    
    // Recalculate total_price if quantity or unit_price changes
    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].total_price = 
        updatedItems[index].quantity * updatedItems[index].unit_price;
    }
    
    setEditedSale({
      ...editedSale,
      sold_items: updatedItems
    });
  };

  const handleDeleteItem = (index) => {
    const updatedItems = [...editedSale.sold_items];
    updatedItems.splice(index, 1);
    setEditedSale({
      ...editedSale,
      sold_items: updatedItems
    });
  };

  const handleAddPaymentMethod = () => {
    if (!newPaymentMethod.method || !newPaymentMethod.amount_paid) {
      message.warning('Please fill in payment method and amount');
      return;
    }
    
    setPaymentMethods([...paymentMethods, {
      ...newPaymentMethod,
      id: `new-${Date.now()}`, // Temporary ID for new payments
      created_at: new Date().toISOString()
    }]);
    
    setNewPaymentMethod({
      method: '',
      amount_paid: '',
      balance: '',
      transaction_code: ''
    });
  };

  const handleDeletePaymentMethod = (index) => {
    const updated = [...paymentMethods];
    updated.splice(index, 1);
    setPaymentMethods(updated);
  };

  const handleChangePaymentMethod = (index, field, value) => {
    const updated = [...paymentMethods];
    updated[index][field] = value;
    setPaymentMethods(updated);
  };

  const handleChangeSaleField = (field, value) => {
    setEditedSale({
      ...editedSale,
      [field]: value
    });
  };

  if (loading) return <LoadingAnimation />;
  if (error) return <Alert type="error" message="Error" description={error} showIcon />;
  if (!sale) return <Alert type="warning" message="Sale not found" showIcon />;

  const columns = [
    { title: 'Item', dataIndex: 'item_name', key: 'item_name' },
    {
      title: 'Quantity',
      key: 'quantity',
      render: (_, record, index) =>
        isEditing ? (
          <InputNumber
            min={1}
            value={record.quantity}
            onChange={(value) => handleChangeItem(index, 'quantity', value)}
            style={{ width: '100%' }}
          />
        ) : (
          `${record.quantity} ${record.metric}`
        ),
    },
    {
      title: 'Unit Price',
      key: 'unit_price',
      render: (_, record, index) =>
        isEditing ? (
          <InputNumber
            min={0}
            step={0.01}
            value={record.unit_price}
            onChange={(value) => handleChangeItem(index, 'unit_price', value)}
            style={{ width: '100%' }}
          />
        ) : (
          `${record.unit_price} Ksh`
        ),
    },
    {
      title: 'Total Price',
      key: 'total_price',
      render: (_, record) => `${record.total_price || (record.quantity * record.unit_price)} Ksh`,
    },
    { title: 'Batch Number', dataIndex: 'batch_number', key: 'batch_number' },
    ...(isEditing
      ? [
          {
            title: 'Action',
            key: 'action',
            render: (_, __, index) => (
              <Popconfirm
                title="Are you sure you want to delete this item?"
                onConfirm={() => handleDeleteItem(index)}
              >
                <Button danger icon={<DeleteOutlined />} />
              </Popconfirm>
            ),
          },
        ]
      : []),
  ];

  return (
    <Card
      bordered
      className="invoice-card"
      style={{
        maxWidth: 900,
        margin: 'auto',
        padding: '1rem',
      }}
    >
      <Row justify="space-between" align="middle" gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Title level={3} style={{ marginBottom: 0 }}>
            Invoice #{sale?.sale_id}
          </Title>
        </Col>
        <Col xs={24} sm={12} style={{ textAlign: 'right' }}>
          <Space wrap>
            <DownloadPDF
              tableId="sale-details"
              fileName={`Sale-${sale?.sale_id}`}
            />
            {!isEditing ? (
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            ) : (
              <>
                <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
                  Save
                </Button>
                <Button
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              </>
            )}
          </Space>
        </Col>
      </Row>

      {/* Sale Details - Editable when in edit mode */}
      <div style={{ marginBottom: 20, marginTop: 20 }}>
        {isEditing ? (
          <>
            <Form.Item label="Shop">
              <Text>{shopname}</Text>
            </Form.Item>
            <Form.Item label="Invoice Number">
              <Text>{sale?.sale_id}</Text>
            </Form.Item>
            <Form.Item label="Status">
              <Select
                value={editedSale.status}
                onChange={(value) => handleChangeSaleField('status', value)}
                style={{ width: 200 }}
              >
                {statusOptions.map(status => (
                  <Option key={status} value={status}>
                    {status}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="Customer Name">
              <Input
                value={editedSale.customer_name}
                onChange={(e) => handleChangeSaleField('customer_name', e.target.value)}
              />
            </Form.Item>
            <Form.Item label="Customer Number">
              <Input
                value={editedSale.customer_number}
                onChange={(e) => handleChangeSaleField('customer_number', e.target.value)}
              />
            </Form.Item>
            <Form.Item label="Note">
              <Input
                value={editedSale.note || ''}
                onChange={(e) => handleChangeSaleField('note', e.target.value)}
              />
            </Form.Item>
            <Form.Item label="Promo Code">
              <Input
                value={editedSale.promocode || ''}
                onChange={(e) => handleChangeSaleField('promocode', e.target.value)}
              />
            </Form.Item>
            <Form.Item label="Balance">
              <InputNumber
                value={editedSale.balance || 0}
                onChange={(value) => handleChangeSaleField('balance', value)}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </>
        ) : (
          <>
            <Text strong>Shop:</Text> {sale?.shopname} <br />
            <Text strong>Invoice Number:</Text> {sale?.sale_id} <br />
            <Text strong>Status:</Text> {sale?.status} <br />
            <Text strong>Customer:</Text> {sale?.customer_name} ({sale?.customer_number}) <br />
            {sale?.note && <><Text strong>Note:</Text> {sale.note} <br /></>}
            {sale?.promocode && <><Text strong>Promo Code:</Text> {sale.promocode} <br /></>}
            {sale?.balance !== undefined && <><Text strong>Balance:</Text> {sale.balance} Ksh</>}
          </>
        )}
      </div>

      {/* Items Table */}
      <Table
        id="sale-details"
        dataSource={isEditing ? editedSale.sold_items : sale?.sold_items || []}
        columns={columns}
        pagination={false}
        rowKey={(record, index) => index}
        bordered
        scroll={{ x: true }}
        style={{ marginBottom: 20 }}
      />

      {/* Payment Details - Editable when in edit mode */}
      <Card type="inner" title="Payment Details">
        {isEditing ? (
          <>
            {paymentMethods.map((payment, index) => (
              <div key={payment.id || index} style={{ 
                marginBottom: 16, 
                padding: 16, 
                border: '1px dashed #d9d9d9',
                borderRadius: 4
              }}>
                <Form.Item label="Payment Method">
                  <Select
                    value={payment.payment_method}
                    onChange={(value) => handleChangePaymentMethod(index, 'payment_method', value)}
                    style={{ width: '100%' }}
                  >
                    {paymentMethodOptions.map(method => (
                      <Option key={method} value={method}>
                        {method}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item label="Amount Paid">
                  <InputNumber
                    value={payment.amount_paid}
                    onChange={(value) => handleChangePaymentMethod(index, 'amount_paid', value)}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item label="Balance">
                  <InputNumber
                    value={payment.balance || 0}
                    onChange={(value) => handleChangePaymentMethod(index, 'balance', value)}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item label="Transaction Code">
                  <Input
                    value={payment.transaction_code || ''}
                    onChange={(e) => handleChangePaymentMethod(index, 'transaction_code', e.target.value)}
                  />
                </Form.Item>
                <div style={{ textAlign: 'right' }}>
                  <Popconfirm
                    title="Are you sure you want to delete this payment method?"
                    onConfirm={() => handleDeletePaymentMethod(index)}
                  >
                    <Button danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </div>
              </div>
            ))}

            <div style={{ marginTop: 16, padding: 16, border: '1px dashed #d9d9d9', borderRadius: 4 }}>
              <Title level={5}>Add New Payment Method</Title>
              <Form.Item label="Payment Method">
                <Select
                  value={newPaymentMethod.method}
                  onChange={(value) => setNewPaymentMethod({...newPaymentMethod, method: value})}
                  style={{ width: '100%' }}
                >
                  {paymentMethodOptions.map(method => (
                    <Option key={method} value={method}>
                      {method}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="Amount Paid">
                <InputNumber
                  value={newPaymentMethod.amount_paid}
                  onChange={(value) => setNewPaymentMethod({...newPaymentMethod, amount_paid: value})}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item label="Balance">
                <InputNumber
                  value={newPaymentMethod.balance || 0}
                  onChange={(value) => setNewPaymentMethod({...newPaymentMethod, balance: value})}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item label="Transaction Code">
                <Input
                  value={newPaymentMethod.transaction_code || ''}
                  onChange={(e) => setNewPaymentMethod({...newPaymentMethod, transaction_code: e.target.value})}
                />
              </Form.Item>
              <Button 
                type="dashed" 
                onClick={handleAddPaymentMethod}
                block
                icon={<PlusOutlined />}
              >
                Add Payment Method
              </Button>
            </div>
          </>
        ) : (
          sale?.payment_methods?.map((payment, index) => (
            <div key={index} style={{ marginBottom: 12 }}>
              <Text strong>Method:</Text> {payment.payment_method} <br />
              <Text strong>Amount Paid:</Text> {payment.amount_paid} Ksh <br />
              {payment.created_at && <><Text strong>Payment Date:</Text> {payment.created_at} <br /></>}
              {payment.transaction_code && payment.transaction_code !== 'none' && (
                <><br /><Text strong>Transaction Code:</Text> {payment.transaction_code}</>
              )}
            </div>
          ))
        )}
      </Card>
    </Card>
  );
};

export default SingleSale;