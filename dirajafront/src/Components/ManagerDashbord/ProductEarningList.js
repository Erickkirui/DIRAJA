import React, { useState, useEffect } from "react";
import axios from "axios";
import LoadingAnimation from "../LoadingAnimation";
import { DatePicker, Select, Alert } from "antd";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Option } = Select;

const yesterday = dayjs().subtract(1, "day");

const ProductEarningsList = () => {
  const [productEarnings, setProductEarnings] = useState([]);
  const [shops, setShops] = useState([]);
  const [selectedShopId, setSelectedShopId] = useState("");
  const [dateRange, setDateRange] = useState([yesterday, yesterday]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

    // Fetch shops
    useEffect(() => {
      const fetchShops = async () => {
        try {
          const shopsRes = await axios.get("api/diraja/allshops", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
          });
          const sortedShops = shopsRes.data.sort((a, b) =>
            a.shopname.localeCompare(b.shopname)
          );
          setShops(sortedShops);
        } catch (err) {
          console.error("Failed to load shops", err);
          setError("Failed to load shops data");
        }
      };
      fetchShops();
    }, []);

    useEffect(() => {
      const fetchProductEarnings = async () => {
        setLoading(true);
        setError("");

        try {
          const params = new URLSearchParams();
          if (dateRange.length === 2) {
            params.append("start_date", dateRange[0].format("YYYY-MM-DD"));
            params.append("end_date", dateRange[1].format("YYYY-MM-DD"));
          }

          const url = selectedShopId
            ? `api/diraja/shop/${selectedShopId}?${params}`
            : `api/diraja/product-earnings?${params}`;

          const res = await axios.get(url, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
          });

          const products = res.data.products || [];
          
          // Format the revenue values with currency formatting
          const formattedProducts = products.map(product => ({
            ...product,
            total_revenue_formatted: `Ksh ${product.total_revenue.toLocaleString()}`,
            average_unit_price_formatted: `Ksh ${product.average_unit_price.toLocaleString()}`,
            display_quantity: `${product.total_quantity_sold} ${product.metric}`
          }));

          setProductEarnings(formattedProducts);
        } catch (err) {
          console.error("Failed to fetch product earnings", err);
          setError("Failed to fetch product earnings data");
        } finally {
          setLoading(false);
        }
      };

    fetchProductEarnings();
  }, [selectedShopId, dateRange]);

  // Calculate totals for display
  const totalRevenue = productEarnings.reduce((sum, product) => sum + product.total_revenue, 0);
  const totalQuantity = productEarnings.reduce((sum, product) => sum + product.total_quantity_sold, 0);

  return (
    <div className="stock-level-container">
      <div className="top-stock">
        <p>Product Earnings Summary</p>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <Select
            value={selectedShopId}
            onChange={setSelectedShopId}
            style={{ width: 200 }}
            placeholder="Select shop"
            allowClear
          >
            <Option value="">All Shops</Option>
            {shops.map((shop) => (
              <Option key={shop.shop_id} value={shop.shop_id}>
                {shop.shopname}
              </Option>
            ))}
          </Select>

          <RangePicker
            style={{ width: 280 }}
            value={dateRange}
            onChange={(dates) => setDateRange(dates)}
            format="YYYY-MM-DD"
          />
        </div>
      </div>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginTop: 12 }}
        />
      )}

      

      {loading && <LoadingAnimation />}
      {!loading && !error && (
        <div className="tab-content">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Quantity Sold</th>
                <th>Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              {productEarnings.length > 0 ? (
                productEarnings.map((product, index) => (
                  <tr key={index}>
                    <td>{product.item_name}</td>
                    <td>{product.display_quantity}</td>
                    <td>{product.total_revenue_formatted}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">No product earnings data found for the selected period.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProductEarningsList;