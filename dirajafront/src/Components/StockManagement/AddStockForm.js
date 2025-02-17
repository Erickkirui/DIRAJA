import { useState, useEffect } from "react";
import axios from "axios";

const AddStockForm = ({ onSubmit, onClose }) => {
  const [items, setItems] = useState([]); // Store fetched items
  const [itemName, setItemName] = useState(""); // Selected item name
  const [metric, setMetric] = useState(""); // Automatically set metric
  const [addedStock, setAddedStock] = useState(""); // Amount of added stock
  const [error, setError] = useState(""); // Error handling

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const accessToken = localStorage.getItem("access_token");
        const shopId = localStorage.getItem("shop_id");

        if (!accessToken) {
          setError("No access token found, please log in.");
          return;
        }

        if (!shopId) {
          setError("No shop ID found in local storage.");
          return;
        }

        // Fetch stock items for the shop
        const response = await axios.get(`/api/diraja/get-stock/${shopId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.data && response.data.length > 0) {
          setItems(response.data);
        } else {
          setError("No stock items found.");
        }
      } catch (err) {
        console.error("Error fetching items:", err);
        setError("Error fetching stock items. Please try again.");
      }
    };

    fetchItems();
  }, []);

  const handleItemChange = (e) => {
    const selectedItem = e.target.value;
    setItemName(selectedItem);
    
    // Find the metric from the selected item
    const selectedItemObj = items.find(item => item.item_name === selectedItem);
    if (selectedItemObj) {
      setMetric(selectedItemObj.metric);
    } else {
      setMetric("");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!itemName || !addedStock) {
      setError("All fields are required.");
      return;
    }

    onSubmit(itemName, metric, addedStock);
  };

  return (
    <div className="add-stock-form">
      <h3>Add Stock</h3>
      <form onSubmit={handleSubmit}>
        {error && <p className="error-text">{error}</p>}

        <div className="form-group">
          <label>Item Name</label>
          <select value={itemName} onChange={handleItemChange} required>
            <option value="">Select an item</option>
            {items.map((item) => (
              <option key={item.item_name} value={item.item_name}>
                {item.item_name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Metric</label>
          <input type="text" value={metric} readOnly />
        </div>

        <div className="form-group">
          <label>Added Stock</label>
          <input
            type="number"
            value={addedStock}
            onChange={(e) => setAddedStock(e.target.value)}
            required
            min="0"
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-button">Submit</button>
          <button type="button" onClick={onClose} className="cancel-button">Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default AddStockForm;
