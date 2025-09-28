
import React, { useState, useEffect } from "react";
import axios from "axios";

const BrokenEggs = () => {
  const shopIdFromStorage = localStorage.getItem("shop_id");

  const [formData, setFormData] = useState({
    shop_id: shopIdFromStorage || "",
    pack_quantity: "",
    piece_quantity: "",
    reason: ""
  });

  const [message, setMessage] = useState({ type: "", text: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [remainingStock, setRemainingStock] = useState(0);
  const [displayQuantity, setDisplayQuantity] = useState("");

  // 🔎 Fetch available eggs stock in this shop
  useEffect(() => {
    const fetchEggsStock = async () => {
      if (!formData.shop_id) return;

      try {
        const response = await axios.get("api/diraja/shop-itemdetailsv2", {
          params: {
            item_name: "Eggs (Grade)",
            shop_id: formData.shop_id
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });

        const { quantity } = response.data;
        setRemainingStock(quantity || 0);

        // Convert to trays/pieces
        const trays = Math.floor((quantity || 0) / 30);
        const pieces = (quantity || 0) % 30;
        setDisplayQuantity(
          trays > 0
            ? `${trays} tray${trays !== 1 ? "s" : ""}${pieces > 0 ? `, ${pieces} pcs` : ""}`
            : `${pieces} pcs`
        );
      } catch (error) {
        setMessage({ type: "error", text: "Failed to fetch eggs stock" });
      }
    };

    fetchEggsStock();
  }, [formData.shop_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if ((name === "pack_quantity" || name === "piece_quantity") && value !== "") {
      if (!/^\d*$/.test(value)) {
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let trays = parseInt(formData.pack_quantity || 0, 10);
    let pieces = parseInt(formData.piece_quantity || 0, 10);

    const finalQuantity = trays * 30 + pieces;

    if (finalQuantity <= 0) {
      setMessage({ type: "error", text: "Quantity must be greater than 0" });
      return;
    }

    if (finalQuantity > remainingStock) {
      setMessage({ type: "error", text: "Quantity exceeds available stock" });
      return;
    }

    setIsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await axios.post(
        `/api/diraja/shops/${formData.shop_id}/stock/broken-eggs`,
        {
          quantity_to_move: finalQuantity,
          reason: formData.reason
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      setMessage({
        type: "success",
        text: response.data.message || "Broken eggs recorded successfully",
      });

      setFormData((prev) => ({
        ...prev,
        pack_quantity: "",
        piece_quantity: "",
        reason: "",
      }));

      // Refresh remaining stock
      const traysLeft = Math.floor((remainingStock - finalQuantity) / 30);
      const piecesLeft = (remainingStock - finalQuantity) % 30;
      setRemainingStock(remainingStock - finalQuantity);
      setDisplayQuantity(
        traysLeft > 0
          ? `${traysLeft} tray${traysLeft !== 1 ? "s" : ""}${
              piecesLeft > 0 ? `, ${piecesLeft} pcs` : ""
            }`
          : `${piecesLeft} pcs`
      );
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to record broken eggs";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="broken-eggs-container">
      <h1>Record Broken Eggs</h1>

      {message.text && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}

      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label>Available Eggs</label>
          <p>{displayQuantity}</p>
        </div>

        <div className="form-group">
          <label>Quantity Broken</label>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              name="pack_quantity"
              type="text"
              value={formData.pack_quantity}
              onChange={handleChange}
              placeholder="No. of trays"
              className="input"
            />
            <input
              name="piece_quantity"
              type="text"
              value={formData.piece_quantity}
              onChange={handleChange}
              placeholder="No. of pieces"
              className="input"
            />
          </div>
          <small className="text-muted">1 tray = 30 eggs</small>
        </div>

        <div className="form-group">
          <label>Reason (optional)</label>
          <input
            name="reason"
            type="text"
            value={formData.reason}
            onChange={handleChange}
            placeholder="Reason for breakage"
            className="input"
          />
        </div>

        <button
          type="submit"
          className="button"
          disabled={isLoading || !formData.shop_id}
        >
          {isLoading ? "Recording..." : "Record Broken Eggs"}
        </button>
      </form>
    </div>
  );
};

export default BrokenEggs;

