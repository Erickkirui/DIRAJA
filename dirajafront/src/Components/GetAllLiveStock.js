import { useState, useEffect } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import LoadingAnimation from "./LoadingAnimation";
import ShopTransferTable from "./ShopTransferTable";

const GetAllLiveStock = ({ accessToken }) => {
  const [stockData, setStockData] = useState([]);
  const [filteredStockData, setFilteredStockData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");  // To hold the search input

  useEffect(() => {
    const fetchStock = async () => {
      setLoading(true);
      setError("");

      try {
        const accessToken = localStorage.getItem("access_token");
        // Only check for the accessToken now
        if (!accessToken) {
          setError("No access token found, please log in.");
          return;
        }

        const response = await axios.get(`/api/diraja/all-shop-stocks`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        setStockData(response.data || []);
        setFilteredStockData(response.data || []); // Initialize filtered data
      } catch (err) {
        console.error("Error fetching stock:", err);
        setError(err.response?.data?.error || "Error fetching stock. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchStock();
  }, [accessToken]);

  const getStockStatus = (timestamp) => {
    const stockDate = dayjs(timestamp).format("YYYY-MM-DD");
    const todayDate = dayjs().format("YYYY-MM-DD");
    const yesterdayDate = dayjs().subtract(1, "day").format("YYYY-MM-DD");

    if (stockDate === todayDate) return "today";
    if (stockDate === yesterdayDate) return "yesterday";
    return "older";
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Filter stock data based on shop_name and item_name
    const filtered = stockData.filter(
      (stock) =>
        stock.shop_name.toLowerCase().includes(value.toLowerCase()) ||
        stock.item_name.toLowerCase().includes(value.toLowerCase())
    );

    setFilteredStockData(filtered);
  };

  return (
    <div className="stock-table-container">
      <h1>Shop Stock </h1>

      {/* Search Bar */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search by Shop Name or Item Name"
          value={searchTerm}
          onChange={handleSearchChange}
          className="search-bar"
        />
      </div>

      {loading && <LoadingAnimation />}
      {error && <p className="error-text">{error}</p>}

      <table className="stock-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Shopname</th>
            <th>Item name</th>
            <th>Current Quantity</th>
            <th>Added Quantity</th>
            <th>Clock in Quantity</th>
            <th>Mismatch Quantity</th>
            <th>Mismatch Reason</th>
            <th>Clock Out Quantity</th>
          </tr>
        </thead>
        <tbody>
          {filteredStockData.map((stock, index) => (
            <tr key={index}>
              <td className="status-icon">
                <FontAwesomeIcon
                  icon={getStockStatus(stock.created_at) === "today" ? faCircleCheck : faCircleXmark}
                  size="1x"
                  style={{ color: getStockStatus(stock.created_at) === "today" ? '#088F8F' : '#e53e3e' }}
                />
              </td>
              <td>{stock.shop_name}</td>
              <td>{stock.item_name}</td>
              <td>{stock.current_quantity} <span>{stock.metric}</span></td>
              <td>{stock.added_stock} <span>{stock.metric}</span></td>
              <td>{stock.clock_in_quantity} <span>{stock.metric}</span></td>
              <td>{stock.mismatch_quantity} <span>{stock.metric}</span></td>
              <td>{stock.mismatch_reason}</td>
              <td>{stock.clock_out_quantity} <span>{stock.metric}</span> </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ShopTransferTable />
    </div>
  );
};

export default GetAllLiveStock;
