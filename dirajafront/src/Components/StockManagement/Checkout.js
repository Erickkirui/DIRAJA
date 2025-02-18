import { useState } from "react";
import axios from "axios";

const Checkout = ({ shopId, stockData }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCheckout = async () => {
    setLoading(true);
    setError("");

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

      alert(response.data.message);
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
