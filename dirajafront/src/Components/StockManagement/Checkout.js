import { useState } from "react";
import axios from "axios";

const Checkout = ({ shopId, stockData }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");  // New state for success message
  const [showConfirmation, setShowConfirmation] = useState(false);  // State to control the confirmation popup

  const handleCheckout = async () => {
    setLoading(true);
    setError("");
    setSuccessMessage("");  // Reset the success message before starting checkout

    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken || !shopId) {
        setError("No access token or shop ID found, please log in.");
        return;
      }

      const payload = { shop_id: shopId, stock_data: stockData };

      const response = await axios.post("https://kulima.co.ke/api/diraja/checkout", payload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Set the success message upon successful checkout
      setSuccessMessage("Shop closed successfully!");

      // Refresh the page
      window.location.reload(); // This will reload the page after success

    } catch (err) {
      console.error("Error during checkout:", err);
      setError(err.response?.data?.error || "Failed to checkout stock");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmClose = () => {
    setShowConfirmation(false);  // Hide confirmation popup
    handleCheckout();  // Proceed with checkout if confirmed
  };

  const handleCancelClose = () => {
    setShowConfirmation(false);  // Hide confirmation popup if canceled
  };

  return (
    <div>
      {error && <p className="text-red-500">{error}</p>}
      {successMessage && <p className="text-green-500">{successMessage}</p>}  {/* Display success message */}

      {/* Show confirmation popup if showConfirmation is true */}
      {showConfirmation && (
        <div className="confirmation-popup">
          <div className="confirmation-card">
            <p>Are you sure you want to close the shop?</p>
            <div className="confirmation-buttons">
            <button onClick={handleCancelClose} className="cancel-button">cancel</button>
              <button onClick={handleConfirmClose} className="confirm-button">Close Shop</button>
              
            </div>
          </div>
        </div>
      )}

      {/* Close Shop Button */}
      <button 
        onClick={() => setShowConfirmation(true)}  // Show confirmation popup when clicked
        className="stock-button-ckeckout"
        disabled={loading}
      >
        {loading ? "Processing..." : "Close Shop"}
      </button>
    </div>
  );
};

export default Checkout;
