import { useState, useEffect } from "react";
import axios from "axios";

const TransferStockForm = ({ stockData, isVisible, onClose, onTransferSuccess }) => {
  const [selectedItem, setSelectedItem] = useState("");
  const [transferQuantity, setTransferQuantity] = useState("");
  const [receivingShopId, setReceivingShopId] = useState("");
  const [shops, setShops] = useState([]);
  const [shopError, setShopError] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await axios.get("api/diraja/allshops", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });

        setShops(response.data);
        if (response.data.length === 0) {
          setShopError(true);
        }
      } catch (error) {
        console.error("Error fetching shops:", error);
        setShopError(true);
      }
    };

    fetchShops();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const accessToken = localStorage.getItem("access_token");
    const fromShopId = localStorage.getItem("shop_id");

    if (!accessToken || !fromShopId) {
      setError("No access token or shop ID found, please log in.");
      setLoading(false);
      return;
    }

    if (!receivingShopId) {
      setError("Please select a receiving shop.");
      setLoading(false);
      return;
    }

    if (fromShopId === receivingShopId) {
      setError("Shops must be different for stock transfer.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        from_shop_id: parseInt(fromShopId, 10),
        to_shop_id: parseInt(receivingShopId, 10),
        item_name: selectedItem,
        transfer_quantity: parseFloat(transferQuantity),
      };

      await axios.post("api/diraja/transfer-shop-stock", payload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      onTransferSuccess(selectedItem, parseFloat(transferQuantity));
      onClose();
    } catch (err) {
      console.error("Error transferring stock:", err);
      setError(err.response?.data?.error || "Failed to transfer stock");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stock-form-container">
      <div className={`transfer-stock-form ${isVisible ? "visible" : "hidden"}`} >
      <h2>Transfer Stock</h2>
      {error && <p className="error-text">{error}</p>}
      <form onSubmit={handleSubmit} className="stock-mange-form">
        
          <select value={selectedItem} onChange={(e) => setSelectedItem(e.target.value)} required>
            <option value="">-- Select an item --</option>
            {stockData.map((stock, index) => (
              <option key={index} value={stock.item_name}>
                {stock.item_name}
              </option>
            ))}
          </select>
       

          <input
            type="number"
            placeholder="Transfer Qunatity"
            value={transferQuantity}
            onChange={(e) => setTransferQuantity(e.target.value)}
            required
          />
       

          <select
            value={receivingShopId}
            onChange={(e) => setReceivingShopId(e.target.value)}
            required
          >
            <option value="">-- Select a shop --</option>
            {shops.length > 0 ? (
              shops.map((shop) => (
                <option key={shop.shop_id} value={shop.shop_id}>
                  {shop.shopname}
                </option>
              ))
            ) : (
              <option disabled>No shops available</option>
            )}
          </select>
        
        {shopError && <p className="text-red-500 mt-1">No shops available</p>}

        <div  className="stock-form-actions">
        <button type="submit" disabled={loading}  className="submit-stock">
          {loading ? "Transferring..." : "Transfer"}
        </button>
        <button type="button"  className="cancel-button" onClick={onClose}>
          Cancel
        </button>
        </div>
      </form>
    </div>
    </div>
  );
};

export default TransferStockForm;
