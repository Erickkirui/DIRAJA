import { useState } from "react";
import axios from "axios";

const RegisterStockForm = ({ onSubmit, onClose }) => {
  const [itemName, setItemName] = useState("");
  const [addedStock, setAddedStock] = useState("");
  const [metric, setMetric] = useState("kg"); // Default is "kg"
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

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
      const response = await axios.post("/api/diraja/registerstock", payload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      alert(response.data.message); // Display the success message
      onSubmit(); // Notify parent to update stock data
      onClose(); // Close the modal
    } catch (err) {
      setError(err.response?.data?.error || "Failed to register stock");
    }
  };

  return (
    <div className="register-stock-form">
      <h3>Register Stock</h3>
      {error && <p className="error-text">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="item-name">Item Name:</label>
          <input
            type="text"
            id="item-name"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="added-stock">Added Stock:</label>
          <input
            type="number"
            id="added-stock"
            value={addedStock}
            onChange={(e) => setAddedStock(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
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
        </div>

        <button type="submit" className="submit-button">Register Stock</button>
        <button type="button" className="cancel-button" onClick={onClose}>
          Cancel
        </button>
      </form>
    </div>
  );
};

export default RegisterStockForm;
