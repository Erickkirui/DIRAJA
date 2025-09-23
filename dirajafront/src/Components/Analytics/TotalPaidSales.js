import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, Select, DatePicker, Row, Col, Statistic, Alert, Spin, Tag } from 'antd';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

const TotalPaidSales = () => {
  const [shopSales, setShopSales] = useState([]);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('yesterday');
  const [customDate, setCustomDate] = useState('');
  const [totalSales, setTotalSales] = useState(0);
  const [shopCount, setShopCount] = useState(0);
  const [paymentSummary, setPaymentSummary] = useState({
    sasapay: 0,
    cash: 0,
    not_payed: 0,
  });
  const [loading, setLoading] = useState(false);
  const [categorySummary, setCategorySummary] = useState([]);
  const [categoryRange, setCategoryRange] = useState([
    dayjs().subtract(1, 'day'), // default yesterday
    dayjs().subtract(1, 'day'),
  ]);

  // ------------------- Fetch Shop Sales -------------------
  const fetchShopSales = async () => {
    try {
      setLoading(true);
      const params = period === 'custom' ? { date: customDate } : { period };

      const response = await axios.get('/api/diraja/totalsalespershop', {
        params,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      const data = response.data;
      setShopSales(data.total_sales_per_shop || []);
      setError('');

      // Compute totals
      if (data.total_sales_per_shop) {
        const total = data.total_sales_per_shop.reduce((sum, shop) => {
          const amount = parseFloat(shop.total_sales_amount_paid.replace(/[^\d.-]/g, ''));
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
        setTotalSales(total);
        setShopCount(data.total_sales_per_shop.length);

        // Payment summary from backend
        if (data.summary && data.summary.overall_payment_breakdown) {
          const summary = data.summary.overall_payment_breakdown;
          setPaymentSummary({
            sasapay: parseFloat(summary.sasapay.replace(/[^\d.-]/g, '')) || 0,
            cash: parseFloat(summary.cash.replace(/[^\d.-]/g, '')) || 0,
            not_payed: parseFloat(summary.not_payed.replace(/[^\d.-]/g, '')) || 0,
          });
        }
      } else {
        setTotalSales(0);
        setShopCount(0);
        setPaymentSummary({ sasapay: 0, cash: 0, not_payed: 0 });
      }
    } catch (error) {
      console.error('Error fetching shop sales:', error);
      setError('Error fetching shop sales');
      setShopSales([]);
      setTotalSales(0);
      setShopCount(0);
      setPaymentSummary({ sasapay: 0, cash: 0, not_payed: 0 });
    } finally {
      setLoading(false);
    }
  };

  // ------------------- Fetch Category Summary -------------------
  const fetchCategorySummary = async () => {
    try {
      let start, end;

      if (period === "custom" && customDate) {
        start = dayjs(customDate);
        end = dayjs(customDate);
      } else {
        switch (period) {
          case "today":
            start = dayjs();
            end = dayjs();
            break;
          case "yesterday":
            start = dayjs().subtract(1, "day");
            end = dayjs().subtract(1, "day");
            break;
          case "week":
            start = dayjs().startOf("week");
            end = dayjs().endOf("week");
            break;
          case "month":
            start = dayjs().startOf("month");
            end = dayjs().endOf("month");
            break;
          default:
            // fallback to manual range picker
            [start, end] = categoryRange;
        }
      }

      const response = await axios.get("/api/diraja/category-earnings-summary", {
        params: {
          start: start.format("YYYY-MM-DD"),
          end: end.format("YYYY-MM-DD"),
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      if (response.data.categories) {
        setCategorySummary(response.data.categories);
      } else {
        setCategorySummary([]);
      }
    } catch (err) {
      console.error("Failed to fetch category summary", err);
      setCategorySummary([]);
    }
  };

  // ------------------- Effects -------------------
  useEffect(() => {
    if (period !== "custom" || customDate) {
      fetchShopSales();
      fetchCategorySummary(); // fetch both when period/customDate changes
    }
  }, [period, customDate]);

  // If user manually changes category range, re-fetch
  useEffect(() => {
    fetchCategorySummary();
  }, [categoryRange]);

  // ------------------- Utils -------------------
  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 2 }).format(value);

  // ------------------- Render -------------------
  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 20 }}>
      <h2>Shop Sale Analytics</h2>

      {/* Period Selector */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col>
          <Select value={period} onChange={setPeriod} style={{ width: 200 }}>
            <Option value="today">Today</Option>
            <Option value="yesterday">Yesterday</Option>
            <Option value="week">This Week</Option>
            <Option value="month">This Month</Option>
            <Option value="custom">Custom Date</Option>
          </Select>
        </Col>
        {period === 'custom' && (
          <Col>
            <DatePicker onChange={(date, dateString) => setCustomDate(dateString)} />
          </Col>
        )}
      </Row>

      {/* Error Message */}
      {error && <Alert message="Error" description={error} type="error" showIcon closable style={{ marginBottom: 16 }} />}

      {/* Summary Section */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card>
            <Statistic title="Total Sales" value={totalSales} precision={2} prefix="Ksh" />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic title="Average per Shop" value={shopCount > 0 ? totalSales / shopCount : 0} precision={2} prefix="Ksh" />
          </Card>
        </Col>
      </Row>

      {/* Payment Summary */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col>
          <Tag color="green" style={{ fontSize: 14 }}>
            Sasapay: {formatCurrency(paymentSummary.sasapay)}
          </Tag>
        </Col>
        <Col>
          <Tag color="blue" style={{ fontSize: 14 }}>
            Cash: {formatCurrency(paymentSummary.cash)}
          </Tag>
        </Col>
        <Col>
          <Tag color="orange" style={{ fontSize: 14 }}>
            Credit (Not Payed): {formatCurrency(paymentSummary.not_payed)}
          </Tag>
        </Col>
      </Row>

      {/* Category Range Filter */}
      <h4>Products Totals</h4>
   

      {/* Category Totals */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        {categorySummary
          .filter((c) => ["eggs", "chicken", "farmers choice"].includes((c.category || "").toLowerCase()))
          .map((cat) => (
            <Col span={8} key={cat.category}>
              <Card>
                <Statistic
                  title={`Total ${cat.category}`}
                  value={cat.total_revenue}
                  precision={2}
                  prefix="Ksh"
                />
                <div style={{ marginTop: 8, fontSize: 13, color: "#888" }}>
                  {/* Qty: {cat.total_quantity_sold} */}
                </div>
              </Card>
            </Col>
          ))}
      </Row>

      {/* Shop Cards */}
      {loading ? (
        <Spin size="large" />
      ) : shopSales.length > 0 ? (
        <Row gutter={[12, 12]}>
          {shopSales.map((shop) => {
            const salesValue = parseFloat(shop.total_sales_amount_paid.replace(/[^\d.-]/g, ''));
            const comparisonValue = shop.comparison || 0;

            return (
              <Col key={shop.shop_id} xs={24} sm={12} md={8} lg={6}>
                <Card title={shop.shop_name || `Shop ${shop.shop_id}`} size="small" bodyStyle={{ padding: 12 }}>
                  <Statistic title="Sales" value={salesValue} precision={2} prefix="Ksh" valueStyle={{ fontSize: 16 }} />
                  <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <a href={`/salesbyshop/${shop.shop_id}`} style={{ fontSize: 12 }}>
                      View Sales
                    </a>
                    {comparisonValue !== 0 && (
                      <span style={{ fontSize: 12, color: comparisonValue >= 0 ? 'green' : 'red' }}>
                        {comparisonValue >= 0 ? `+${formatCurrency(comparisonValue)}` : `-${formatCurrency(Math.abs(comparisonValue))}`}
                      </span>
                    )}
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      ) : (
        <p>No sales data available.</p>
      )}
    </div>
  );
};

export default TotalPaidSales;
