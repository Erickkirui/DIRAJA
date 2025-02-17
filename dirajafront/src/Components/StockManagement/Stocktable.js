import { useState, useEffect } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import CheckInForm from "./CheckInForm"; // Import the CheckInForm component
import RegisterStockForm from "./RegisterStockForm"; // Import RegisterStockForm component

const StockTable = () => {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRegisterFormOpen, setIsRegisterFormOpen] = useState(false); // State to show Register Stock form
  const [checkingIn, setCheckingIn] = useState(false); // State to show CheckInForm

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

  // Function to determine stock status
  const getStockStatus = (timestamp) => {
    const stockDate = dayjs(timestamp).format("YYYY-MM-DD");
    const todayDate = dayjs().format("YYYY-MM-DD");
    const yesterdayDate = dayjs().subtract(1, "day").format("YYYY-MM-DD");

    if (stockDate === todayDate) {
      return "today"; // ✅ Stock checked in today
    } else if (stockDate === yesterdayDate) {
      return "yesterday"; // ❌ Stock checked in yesterday
    } else {
      return "older"; // ❌ Stock older than yesterday
    }
  };

  // Handle check-in submission from the CheckInForm component
  const handleCheckInSubmit = async (selectedItem, checkInQuantity, metric, mismatchQuantity, mismatchReason) => {
    setCheckingIn(true);
    setError("");

    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken || !shopId) {
        setError("No access token or shop ID found, please log in.");
        return;
      }

      const payload = {
        shop_id: shopId,
        item_name: selectedItem,
        metric: metric, // ✅ Sending correct metric
        clock_in_quantity: parseFloat(checkInQuantity),
        mismatch_reason: mismatchQuantity !== 0 ? mismatchReason : null,
      };

      console.log("Sending request with payload:", payload);

      const response = await axios.post("/api/diraja/stockcheckin", payload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      console.log("Response Data:", response.data);
      alert(response.data.message);

      // Refresh stock data after successful check-in
      setStockData((prevStock) =>
        prevStock.map((stock) =>
          stock.item_name === selectedItem
            ? { ...stock, clock_in_quantity: parseFloat(checkInQuantity), timestamp: new Date().toISOString() }
            : stock
        )
      );
    } catch (err) {
      console.error("Error during check-in:", err);
      setError(err.response?.data?.error || "Failed to check in stock");
    } finally {
      setCheckingIn(false);
    }
  };

  // Handle register stock submission
  const handleRegisterStockSubmit = async (itemName, metric, addedStock) => {
    setLoading(true);
    setError("");

    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken || !shopId) {
        setError("No access token or shop ID found, please log in.");
        return;
      }

      const payload = {
        shop_id: shopId,
        item_name: itemName,
        metric: metric,
        added_stock: parseFloat(addedStock),
      };

      const response = await axios.post("/api/diraja/register-stock", payload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      alert(response.data.message);

      // Refresh stock data after successful stock registration
      setStockData((prevStock) => [
        ...prevStock,
        {
          ...response.data,
          item_name: itemName,
          metric: metric,
          added_stock: 0, // As specified in the API
          current_quantity: response.data.current_quantity,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error("Error during stock registration:", err);
      setError(err.response?.data?.error || "Failed to register stock");
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
      <button onClick={() => setCheckingIn(true)} className="check-in-button">
        Check In Stock
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
                {getStockStatus(stock.created_at) === "today" ? (
                  <FontAwesomeIcon icon={faCircleCheck} className="text-green-500 text-xl" />
                ) : getStockStatus(stock.created_at) === "yesterday" ? (
                  <FontAwesomeIcon icon={faCircleXmark} className="text-red-500 text-xl" />
                ) : (
                  <FontAwesomeIcon icon={faCircleXmark} className="text-gray-500 text-xl" />
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

      {/* Show CheckInForm and RegisterStockForm below the table */}
      {isRegisterFormOpen && (
        <RegisterStockForm
          onSubmit={handleRegisterStockSubmit}
          onClose={() => setIsRegisterFormOpen(false)}
        />
      )}

      {checkingIn && (
        <CheckInForm
          stockData={stockData}
          onSubmit={handleCheckInSubmit}
          onClose={() => setCheckingIn(false)}
        />
      )}
    </div>
  );
};

export default StockTable;
