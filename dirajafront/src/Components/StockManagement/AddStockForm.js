import { useState, useEffect } from "react";
import axios from "axios";

const AddStockForm = ({ onSubmit, onClose }) => {
  const [items, setItems] = useState([]);
  const [itemName, setItemName] = useState("");
  const [metric, setMetric] = useState("");
  const [addedStock, setAddedStock] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const accessToken = localStorage.getItem("access_token");
        const shopId = localStorage.getItem("shop_id");

        if (!accessToken || !shopId) {
          setError("No access token or shop ID found, please log in.");
          return;
        }

        const response = await axios.get(`/api/diraja/get-stock/${shopId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (response.data && response.data.length > 0) {
          setItems(response.data);
        } else {
          setError("No stock items found.");
        }
      } catch (err) {
        setError("Error fetching stock items. Please try again.");
      }
    };

    fetchItems();
  }, []);

  const handleItemChange = (e) => {
    const selectedItem = e.target.value;
    setItemName(selectedItem);
    const selectedItemObj = items.find(item => item.item_name === selectedItem);
    setMetric(selectedItemObj ? selectedItemObj.metric : "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!itemName || !addedStock) {
      setError("All fields are required.");
      return;
    }

    try {
      await onSubmit(itemName, metric, addedStock);
      setSuccess("Stock added successfully!");
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setError("Failed to add stock. Please try again.");
    }
  };

  return (
    <div className="stock-form-container">
      <h3>Add Stock</h3>
      {error && <p className="error-text">{error}</p>}
      {success && <p className="success-text">{success}</p>}
      <form onSubmit={handleSubmit} className="stock-mange-form">
        <label>Item Name</label>
        <select value={itemName} onChange={handleItemChange} required>
          <option value="">Select an item</option>
          {items.map((item) => (
            <option key={item.item_name} value={item.item_name}>
              {item.item_name}
            </option>
          ))}
        </select>
        
        <label>Metric</label>
        <input type="text" value={metric} readOnly />

        <label>Quantity Added Stock</label>
        <input
          type="number"
          value={addedStock}
          onChange={(e) => setAddedStock(e.target.value)}
          required
          min="0"
        />

        <div className="stock-form-actions">
          <button type="submit" className="submit-stock">Submit</button>
          <button type="button" onClick={onClose} className="cancel-button">Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default AddStockForm;