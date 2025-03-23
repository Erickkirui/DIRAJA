import { useState, useEffect } from "react";

const CheckInForm = ({ stockData, onSubmit, onClose }) => {
  const [selectedItem, setSelectedItem] = useState("");
  const [checkInQuantity, setCheckInQuantity] = useState("");
  const [mismatchQuantity, setMismatchQuantity] = useState(0);
  const [mismatchReason, setMismatchReason] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (stockData.length > 0) {
      setSelectedItem(stockData[0].item_name);
    }
  }, [stockData]);

  const getSelectedItemMetric = () => {
    const item = stockData.find((stock) => stock.item_name === selectedItem);
    return item ? item.metric : "item";
  };

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

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!selectedItem || checkInQuantity === "" || isNaN(checkInQuantity) || checkInQuantity <= 0) {
      setError("Please select an item and enter a valid check-in quantity.");
      return;
    }

    if (mismatchQuantity !== 0 && !mismatchReason.trim()) {
      setError("Mismatch detected! Please provide a reason.");
      return;
    }

    const metric = getSelectedItemMetric();

    console.log("Submitting Check-in Data:", {
      selectedItem,
      checkInQuantity,
      metric,
      mismatchQuantity,
      mismatchReason,
    });

    onSubmit(selectedItem, checkInQuantity, metric, mismatchQuantity, mismatchReason);
    setSuccessMessage("Check-in successful!");

    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  const handleCancel = () => {
    setMismatchQuantity(0);
    setMismatchReason("");
    setCheckInQuantity("");
    setSelectedItem(stockData[0]?.item_name || "");
    onClose();
  };

  return (
    <div className="stock-form-container">
      <h2>Check In Stock</h2>
      {error && <p className="error-text">{error}</p>}
      {successMessage && <p className="success-text">{successMessage}</p>}
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
        
          placeholder="Check-in Quantity:"
        />

        {mismatchQuantity !== 0 && (
          <textarea
            value={mismatchReason}
            onChange={(e) => setMismatchReason(e.target.value)}
            placeholder="Mismatch Reason:"
          />
        )}

        <div className="stock-form-actions">
          <button 
            type="submit" 
            className="submit-stock" 
            disabled={mismatchQuantity !== 0 && mismatchReason.trim() === ""}
          >
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

