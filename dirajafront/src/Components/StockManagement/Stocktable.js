import { useState, useEffect } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import CheckInForm from "./CheckInForm";
import RegisterStockForm from "./RegisterStockForm";
import AddStockForm from "./AddStockForm";

const StockTable = () => {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRegisterFormOpen, setIsRegisterFormOpen] = useState(false);
  const [isAddStockFormOpen, setIsAddStockFormOpen] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  const shopId = localStorage.getItem("shop_id");

  useEffect(() => {
    const fetchStock = async () => {
      setLoading(true);
      setError("");

      try {
        const accessToken = localStorage.getItem("access_token");

        if (!accessToken || !shopId) {
          setError("No access token or shop ID found, please log in.");
          return;
        }

        const response = await axios.get(`/api/diraja/get-stock/${shopId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (response.data && response.data.length > 0) {
          setStockData(response.data);
        } else {
          setError("No stock data found.");
        }
      } catch (err) {
        console.error("Error fetching stock:", err);
        setError("Error fetching stock. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchStock();
  }, [shopId]);

  const handleCheckout = async () => {
    setLoading(true);
    setError("");

    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken || !shopId) {
        setError("No access token or shop ID found, please log in.");
        return;
      }

      const payload = { shop_id: shopId, stock_data: stockData };

      const response = await axios.post("/api/diraja/checkout", payload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      alert(response.data.message);
    } catch (err) {
      console.error("Error during checkout:", err);
      setError(err.response?.data?.error || "Failed to checkout stock");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stock-table-container">
      <h2 className="stock-table-title">Stock Information (Shop ID: {shopId})</h2>
      <button onClick={() => setIsRegisterFormOpen(true)} className="register-stock-button">
        Register Stock
      </button>
      <button onClick={() => setIsAddStockFormOpen(true)} className="add-stock-button">
        Add Stock
      </button>
      <button onClick={() => setCheckingIn(true)} className="check-in-button">
        Check In Stock
      </button>
      <button onClick={handleCheckout} className="checkout-button">
        Checkout Stock
      </button>

      {loading && <p className="loading-text">Loading stock data...</p>}
      {error && <p className="error-text">{error}</p>}

      <table className="stock-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Item</th>
            <th>Quantity</th>
            <th>Clock In Quantity</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
          {stockData.map((stock, index) => (
            <tr key={index}>
              <td className="status-icon">
                {dayjs(stock.created_at).format("YYYY-MM-DD") === dayjs().format("YYYY-MM-DD") ? (
                  <FontAwesomeIcon icon={faCircleCheck} className="text-green-500 text-xl" />
                ) : (
                  <FontAwesomeIcon icon={faCircleXmark} className="text-red-500 text-xl" />
                )}
              </td>
              <td>{stock.item_name}</td>
              <td>{stock.current_quantity}</td>
              <td>{stock.clock_in_quantity}</td>
              <td>{dayjs(stock.created_at).format("YYYY-MM-DD HH:mm:ss")}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {isAddStockFormOpen && (
        <AddStockForm onSubmit={() => {}} onClose={() => setIsAddStockFormOpen(false)} />
      )}

      {isRegisterFormOpen && (
        <RegisterStockForm onSubmit={() => {}} onClose={() => setIsRegisterFormOpen(false)} />
      )}

      {checkingIn && (
        <CheckInForm stockData={stockData} onSubmit={() => {}} onClose={() => setCheckingIn(false)} />
      )}
    </div>
  );
};

export default StockTable;
