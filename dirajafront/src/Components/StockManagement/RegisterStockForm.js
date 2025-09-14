import { useState } from "react";
import axios from "axios";

const RegisterStockForm = ({ onSubmit, onClose }) => {
  const [itemName, setItemName] = useState("");
  const [addedStock, setAddedStock] = useState("");
  const [metric, setMetric] = useState("kg"); // Default is "kg"
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!itemName || !addedStock || !metric) {
      setError("Please fill in all fields.");
      return;
    }

    const shopId = localStorage.getItem("shop_id");

    try {
      const accessToken = localStorage.getItem("access_token");

      if (!accessToken || !shopId) {
        setError("No access token or shop ID found, please log in.");
        return;
      }

      const payload = {
        shop_id: shopId,
        item_name: itemName,
        metric: metric, // Send the selected metric (kg/ltrs)
        added_stock: addedStock,
      };

      // Make the request to the RegisterStock endpoint
      await axios.post("api/diraja/registerstock", payload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      setSuccessMessage("Stock registered successfully!");
      setTimeout(() => {
        window.location.reload(); // Refresh the page
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to register stock");
    }
  };

  return (
    <div className="stock-form-container">
      <h3>Add new items</h3>
      {successMessage && <p className="success-text">{successMessage}</p>}
      {error && <p className="error-text">{error}</p>}

      <form onSubmit={handleSubmit} className="stock-mange-form">
        <input
          placeholder="Item name"
          type="text"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          required
        />

        <input
          placeholder="Quantity"
          type="number"
          value={addedStock}
          onChange={(e) => setAddedStock(e.target.value)}
          required
        />

        <label htmlFor="metric">Metric:</label>
        <select
          id="metric"
          value={metric}
          onChange={(e) => setMetric(e.target.value)}
          required
        >
          <option value="kg">kg</option>
          <option value="ltrs">ltrs</option>
          <option value="item">item</option>
        </select>

        <div className="stock-form-actions">
          <button type="submit" className="submit-stock">Register Stock</button>
          <button type="button" className="cancel-button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterStockForm;
