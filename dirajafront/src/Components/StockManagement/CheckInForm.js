import { useState, useEffect } from "react";


const CheckInForm = ({ stockData, onSubmit, onClose }) => {
  const [selectedItem, setSelectedItem] = useState("");
  const [checkInQuantity, setCheckInQuantity] = useState("");
  const [mismatchQuantity, setMismatchQuantity] = useState(0);
  const [mismatchReason, setMismatchReason] = useState("");
  const [error, setError] = useState("");

  // Set default selected item when stockData is available
  useEffect(() => {
    if (stockData.length > 0) {
      setSelectedItem(stockData[0].item_name);
    }
  }, [stockData]);

  // Get metric of selected item
  const getSelectedItemMetric = () => {
    const item = stockData.find((stock) => stock.item_name === selectedItem);
    return item ? item.metric : "item"; // Default to "item" if metric not found
  };

  // Detect mismatch quantity and update mismatchReason if necessary
  const handleQuantityChange = (e) => {
    const inputQuantity = parseFloat(e.target.value);
    setCheckInQuantity(inputQuantity);

    const stockItem = stockData.find((stock) => stock.item_name === selectedItem);
    if (stockItem) {
      const previousQuantity = stockItem.current_quantity || 0;
      const mismatch = inputQuantity !== previousQuantity ? inputQuantity - previousQuantity : 0;
      setMismatchQuantity(mismatch);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!selectedItem || checkInQuantity === "" || isNaN(checkInQuantity) || checkInQuantity <= 0) {
      setError("Please select an item and enter a valid check-in quantity.");
      return;
    }

    if (mismatchQuantity !== 0 && !mismatchReason) {
      setError("Mismatch detected! Please provide a reason.");
      return;
    }

    const metric = getSelectedItemMetric(); // Get correct metric

    console.log("Submitting Check-in Data:", {
      selectedItem,
      checkInQuantity,
      metric,
      mismatchQuantity,
      mismatchReason,
    });

    onSubmit(selectedItem, checkInQuantity, metric, mismatchQuantity, mismatchReason);
  };

  // Handle cancel button click
  const handleCancel = () => {
    setMismatchQuantity(0);
    setMismatchReason("");
    setCheckInQuantity("");
    setSelectedItem(stockData[0]?.item_name || ""); // Reset to default item
    onClose(); // Call onClose to close the form
  };

  return (
    <div className="stock-form-container">
      <h2>Check In Stock</h2>
      {error && <p className="error-text">{error}</p>}
      <form onSubmit={handleSubmit} className="stock-mange-form">
      
         
          <label>Select Item:</label>
          <select value={selectedItem} onChange={(e) => setSelectedItem(e.target.value)}>
            {stockData.map((stock, index) => (
              <option key={index} value={stock.item_name}>
                {stock.item_name}
              </option>
            ))}
          </select>
      
          <input
            type="number"
            value={checkInQuantity}
            onChange={handleQuantityChange}
            min="1"
            placeholder="Check-in Quantity:"
          />
        
        {mismatchQuantity !== 0 && (
          <div>
            
            <textarea value={mismatchReason} onChange={(e) => setMismatchReason(e.target.value)}  placeholder="Mismatch Reason:"/>
          </div>
        )}
        <div className="stock-form-actions">
          
          <button type="submit" className="submit-stock">
            Confirm Check In
          </button>
          <button type="button" onClick={handleCancel} className="cancel-button">
            Cancel
          </button>
        </div>
      </form>
      </div>
    
  );
};

export default CheckInForm;
