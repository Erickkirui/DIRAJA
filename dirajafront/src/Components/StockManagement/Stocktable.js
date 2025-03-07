import { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import CheckInForm from "./CheckInForm";
import RegisterStockForm from "./RegisterStockForm";
import AddStockForm from "./AddStockForm";
import TransferStockForm from "./TransferStockForm"; // Import TransferStockForm
import Checkout from "./Checkout";
import LoadingAnimation from "../LoadingAnimation";

const StockTable = () => {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRegisterFormOpen, setIsRegisterFormOpen] = useState(false);
  const [isAddStockFormOpen, setIsAddStockFormOpen] = useState(false);
  const [isTransferFormOpen, setIsTransferFormOpen] = useState(false); // State for TransferStockForm
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

        setStockData(response.data || []);
      } catch (err) {
        console.error("Error fetching stock:", err);
        setError(err.response?.data?.error || "Error fetching stock. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchStock();
  }, [shopId]);


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
        metric,
        clock_in_quantity: parseFloat(checkInQuantity),
        mismatch_reason: mismatchQuantity !== 0 ? mismatchReason : null,
      };

      const response = await axios.post("/api/diraja/stockcheckin", payload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

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

  const handleAddStock = async (itemName, metric, addedStock) => {
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
        metric,
        added_stock: parseFloat(addedStock),
      };

      const response = await axios.post("/api/diraja/addstock", payload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      setStockData((prevStock) =>
        prevStock.map((stock) =>
          stock.item_name === itemName
            ? {
                ...stock,
                current_quantity: (stock.current_quantity || 0) + parseFloat(addedStock),
              }
            : stock
        )
      );
    } catch (err) {
      console.error("Error during stock addition:", err);
      setError(err.response?.data?.error || "Failed to add stock");
    } finally {
      setLoading(false);
    }
  };

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
        metric,
        added_stock: parseFloat(addedStock),
      };

      const response = await axios.post("/api/diraja/registerstock", payload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      setStockData((prevStock) => [
        ...prevStock,
        {
          ...response.data,
          item_name: itemName,
          metric,
          added_stock: 0,
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

  const handleTransferSuccess = (itemName, transferredQuantity) => {
    setStockData((prevStock) =>
      prevStock.map((stock) =>
        stock.item_name === itemName
          ? { ...stock, current_quantity: (stock.current_quantity || 0) - transferredQuantity }
          : stock
      )
    );
  };

  return (
    <div className="stock-table-container">
      <div className="stock-nav-buttons">
        <button onClick={() => setCheckingIn(true)} className="stock-button-checkin">
          Open Stock
        </button>
        <button onClick={() => setIsRegisterFormOpen(true)} className="stock-button">
          New Items
        </button>
        <button onClick={() => setIsAddStockFormOpen(true)} className="stock-button">
          Add Stock
        </button>
        <button onClick={() => setIsTransferFormOpen(true)} className="stock-button">
          Transfer Stock
        </button>

        <Checkout shopId={shopId} stockData={stockData} />
      </div>

      {isAddStockFormOpen && <AddStockForm onSubmit={handleAddStock} onClose={() => setIsAddStockFormOpen(false)} />}
      {isRegisterFormOpen && <RegisterStockForm onSubmit={handleRegisterStockSubmit} onClose={() => setIsRegisterFormOpen(false)} />}
      {checkingIn && <CheckInForm stockData={stockData} onSubmit={handleCheckInSubmit} onClose={() => setCheckingIn(false)} />}
      {isTransferFormOpen && <TransferStockForm stockData={stockData} onClose={() => setIsTransferFormOpen(false)} onTransferSuccess={handleTransferSuccess} />}

      {loading && <LoadingAnimation />}
      {error && <p className="error-text">{error}</p>}

      <table className="stock-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Item name</th>
            <th>Current Quantity</th>
            <th>Added Quantity</th>
          </tr>
        </thead>
        <tbody>
          {stockData.map((stock, index) => (
            <tr key={index}>
              <td className="status-icon">
                <FontAwesomeIcon 
                  icon={stock.clock_out_quantity === 0 ? faCircleCheck : faCircleXmark} 
                  size="1x" 
                  style={{ color: stock.clock_out_quantity === 0 ? '#088F8F' : '#e53e3e' }} 
                />
              </td>

              <td>{stock.item_name}</td>
              <td>{stock.current_quantity} <span>{stock.metric}</span></td>
              <td>{stock.added_stock} <span>{stock.metric}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StockTable;
