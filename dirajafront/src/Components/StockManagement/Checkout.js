import { useState } from "react";
import axios from "axios";

const Checkout = ({ shopId, stockData }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");  // New state for success message

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

      const response = await axios.post("/api/diraja/checkout", payload, {
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

  return (
    <div>
      {error && <p className="text-red-500">{error}</p>}
      {successMessage && <p className="text-green-500">{successMessage}</p>}  {/* Display success message */}
      <button 
        onClick={handleCheckout} 
        className="stock-button-ckeckout"
        disabled={loading}
      >
        {loading ? "Processing..." : "Close Shop"}
      </button>
    </div>
  );
};

export default Checkout;
