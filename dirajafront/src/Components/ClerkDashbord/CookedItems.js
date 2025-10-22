import React, { useState, useEffect } from "react";
import axios from "axios";

const AddCookedItems = () => {
  const shopIdFromStorage = localStorage.getItem("shop_id");

  const [formData, setFormData] = useState({
    shop_id: shopIdFromStorage || "",
    from_itemname: "",
    to_itemname: "",
    quantity_to_move: ""
  });

  const [message, setMessage] = useState({ type: "", text: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [remainingStock, setRemainingStock] = useState(0);
  const [availableItems, setAvailableItems] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [displayQuantity, setDisplayQuantity] = useState("");
  const [selectedItemInfo, setSelectedItemInfo] = useState(null);
  const [packQuantity, setPackQuantity] = useState(0);
  const [packetInput, setPacketInput] = useState("");
  const [pieceInput, setPieceInput] = useState("");

  // 🔎 Fetch available items for the shop
  useEffect(() => {
    const fetchAvailableItems = async () => {
      if (!formData.shop_id) return;

      try {
        const response = await axios.get("api/diraja/batches/available-by-shopv2", {
          params: {
            shop_id: formData.shop_id
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });

        setAvailableItems(response.data || []);
      } catch (error) {
        setMessage({ type: "error", text: "Failed to fetch available items" });
      }
    };

    fetchAvailableItems();
  }, [formData.shop_id]);

  // 🔎 Fetch stock items data for pack quantities
  useEffect(() => {
    const fetchStockItems = async () => {
      try {
        const response = await axios.get("api/diraja/stockitems", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
        setStockItems(response.data.stock_items || []);
      } catch (error) {
        console.error("Failed to fetch stock items:", error);
      }
    };

    fetchStockItems();
  }, []);

  // 🔎 Fetch stock for selected source item and format display
  useEffect(() => {
    const fetchItemStock = async () => {
      if (!formData.from_itemname || !formData.shop_id) return;

      try {
        const response = await axios.get("api/diraja/shop-itemdetailsv2", {
          params: {
            item_name: formData.from_itemname,
            shop_id: formData.shop_id
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });

        const { quantity, metric } = response.data;
        setRemainingStock(quantity || 0);

        // Find item info from stock items for pack quantity
        const itemInfo = stockItems.find(item => 
          item.item_name === formData.from_itemname
        );
        setSelectedItemInfo(itemInfo);

        // Set pack quantity based on item type
        if (metric && metric.toLowerCase() === "kgs") {
          setPackQuantity(1);
        } else if (formData.from_itemname.toLowerCase().includes("egg")) {
          setPackQuantity(itemInfo?.pack_quantity || 30);
        } else if (itemInfo?.pack_quantity > 0) {
          setPackQuantity(itemInfo.pack_quantity);
        } else {
          setPackQuantity(1);
        }

        // Reset quantity inputs
        setPacketInput("");
        setPieceInput("");
        setFormData(prev => ({ ...prev, quantity_to_move: "" }));

        // Format display based on item type and pack quantity
        let displayText = "";

        // Kgs stay as kgs
        if (metric && metric.toLowerCase() === "kgs") {
          displayText = `${quantity || 0} kgs`;
        }
        // Eggs → trays + pieces
        else if (formData.from_itemname.toLowerCase().includes("egg")) {
          const packQty = itemInfo?.pack_quantity || 30;
          const trays = Math.floor((quantity || 0) / packQty);
          const pieces = (quantity || 0) % packQty;
          displayText = trays > 0
            ? `${trays} tray${trays !== 1 ? "s" : ""}${pieces > 0 ? `, ${pieces} pcs` : ""}`
            : `${pieces} pcs`;
        }
        // Other items with pack quantity → pkts + pcs
        else if (itemInfo?.pack_quantity > 0) {
          const packets = Math.floor((quantity || 0) / itemInfo.pack_quantity);
          const pieces = (quantity || 0) % itemInfo.pack_quantity;
          displayText = packets > 0
            ? `${packets} pkt${packets !== 1 ? "s" : ""}${pieces > 0 ? `, ${pieces} pcs` : ""}`
            : `${pieces} pcs`;
        }
        // Fallback to metric or pcs
        else {
          displayText = `${quantity || 0} ${metric || "pcs"}`;
        }

        setDisplayQuantity(displayText);

      } catch (error) {
        setMessage({ type: "error", text: "Failed to fetch item stock" });
        setDisplayQuantity("0 pcs");
      }
    };

    fetchItemStock();
  }, [formData.from_itemname, formData.shop_id, stockItems]);

  const handleItemChange = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      from_itemname: value,
      quantity_to_move: ""
    }));
  };

  const handlePacketInputChange = (value) => {
    if (value !== "" && !/^\d*$/.test(value)) return;
    
    setPacketInput(value);
    const packets = parseInt(value || 0, 10);
    const pieces = parseInt(pieceInput || 0, 10);
    const totalPieces = (packets * packQuantity) + pieces;
    setFormData(prev => ({ ...prev, quantity_to_move: totalPieces.toString() }));
  };

  const handlePieceInputChange = (value) => {
    if (value !== "" && !/^\d*$/.test(value)) return;
    
    setPieceInput(value);
    const packets = parseInt(packetInput || 0, 10);
    const pieces = parseInt(value || 0, 10);
    const totalPieces = (packets * packQuantity) + pieces;
    setFormData(prev => ({ ...prev, quantity_to_move: totalPieces.toString() }));
  };

  const handleKgQuantityChange = (value) => {
    if (value !== "" && !/^\d*$/.test(value)) return;
    setFormData(prev => ({ ...prev, quantity_to_move: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const quantity = parseInt(formData.quantity_to_move || 0, 10);

    if (quantity <= 0) {
      setMessage({ type: "error", text: "Quantity must be greater than 0" });
      return;
    }

    if (quantity > remainingStock) {
      setMessage({ type: "error", text: "Quantity exceeds available stock" });
      return;
    }

    if (!formData.from_itemname) {
      setMessage({ type: "error", text: "Source item is required" });
      return;
    }

    setIsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await axios.post(
        `/api/diraja/shops/${formData.shop_id}/stock/cooked`,
        {
          from_itemname: formData.from_itemname,
          to_itemname: formData.to_itemname || undefined,
          quantity_to_move: quantity
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      setMessage({
        type: "success",
        text: response.data.message || "Items reclassified successfully",
      });

      setFormData((prev) => ({
        ...prev,
        from_itemname: "",
        to_itemname: "",
        quantity_to_move: "",
      }));

      // Reset all quantity states
      setPacketInput("");
      setPieceInput("");

      // Refresh remaining stock
      setRemainingStock(remainingStock - quantity);
      
      // Update display quantity after successful submission
      const itemInfo = selectedItemInfo;
      let newDisplayText = "";
      const newQuantity = remainingStock - quantity;

      if (selectedItemInfo?.metric?.toLowerCase() === "kgs") {
        newDisplayText = `${newQuantity} kgs`;
      } else if (formData.from_itemname.toLowerCase().includes("egg")) {
        const packQty = itemInfo?.pack_quantity || 30;
        const trays = Math.floor(newQuantity / packQty);
        const pieces = newQuantity % packQty;
        newDisplayText = trays > 0
          ? `${trays} tray${trays !== 1 ? "s" : ""}${pieces > 0 ? `, ${pieces} pcs` : ""}`
          : `${pieces} pcs`;
      } else if (itemInfo?.pack_quantity > 0) {
        const packets = Math.floor(newQuantity / itemInfo.pack_quantity);
        const pieces = newQuantity % itemInfo.pack_quantity;
        newDisplayText = packets > 0
          ? `${packets} pkt${packets !== 1 ? "s" : ""}${pieces > 0 ? `, ${pieces} pcs` : ""}`
          : `${pieces} pcs`;
      } else {
        newDisplayText = `${newQuantity} pcs`;
      }

      setDisplayQuantity(newDisplayText);

    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to reclassify items";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const renderQuantityInput = () => {
    const isEggs = formData.from_itemname.toLowerCase().includes("egg");
    const hasPackets = selectedItemInfo?.pack_quantity > 0 && !isEggs;
    const isKgs = selectedItemInfo?.metric?.toLowerCase() === "kgs";

    if (isKgs) {
      return (
        <div className="form-group">
          <label>Quantity to cook (kg)</label>
          <input
            type="text"
            value={formData.quantity_to_move}
            onChange={(e) => handleKgQuantityChange(e.target.value)}
            placeholder="Enter quantity in kg"
            className="input"
            style={{ width: "50%" }}
            required
          />
          <small className="text-muted">Enter quantity in kilograms</small>
        </div>
      );
    }

    if (isEggs) {
      return (
        <div className="form-group">
          <label>Quantity to cook</label>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              value={packetInput}
              onChange={(e) => handlePacketInputChange(e.target.value)}
              placeholder="No. of trays"
              className="input"
              style={{ width: "50%" }}
            />
            <input
              type="text"
              value={pieceInput}
              onChange={(e) => handlePieceInputChange(e.target.value)}
              placeholder="No. of pieces"
              className="input"
              style={{ width: "50%" }}
            />
          </div>
          <small className="text-muted">1 tray = {packQuantity} eggs</small>
        </div>
      );
    }

    if (hasPackets) {
      return (
        <div className="form-group">
          <label>Quantity to cook</label>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              value={packetInput}
              onChange={(e) => handlePacketInputChange(e.target.value)}
              placeholder="No. of packets"
              className="input"
              style={{ width: "50%" }}
            />
            <input
              type="text"
              value={pieceInput}
              onChange={(e) => handlePieceInputChange(e.target.value)}
              placeholder="No. of pieces"
              className="input"
              style={{ width: "50%" }}
            />
          </div>
          <small className="text-muted">1 packet = {packQuantity} pieces</small>
        </div>
      );
    }

    // Default pieces input
    return (
      <div className="form-group">
        <label>Quantity to cook</label>
        <input
          type="text"
          value={formData.quantity_to_move}
          onChange={(e) => handleKgQuantityChange(e.target.value)}
          placeholder="Enter quantity in pieces"
          className="input"
          style={{ width: "50%" }}
          required
        />
        <small className="text-muted">Enter quantity in individual pieces</small>
      </div>
    );
  };

  return (
    <div className="add-cooked-items-container">
      <h3>Cooked Items</h3>

      {message.text && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}

      <form onSubmit={handleSubmit} className="form">
        

        <div className="form-group">
          <label>Select Cooking Item</label>
          <select
            name="from_itemname"
            value={formData.from_itemname}
            onChange={handleItemChange}
            className="input"
            required
          >
            <option value="">Select item</option>
            {availableItems.map((item, index) => (
              <option key={index} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="shortcuts" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px',
          border: '1px solid var(--primary)',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '15px'
        }}>
          <label style={{ margin: 0, fontWeight: 'bold' }}>Available Stock:</label>
          <p style={{ margin: 0 }}>{displayQuantity}</p>
        </div>

        {formData.from_itemname && renderQuantityInput()}

        <button
          type="submit"
          className="button"
          disabled={isLoading || !formData.shop_id}
        >
          {isLoading ? "Reclassifying..." : "Create cooked item"}
        </button>
      </form>
    </div>
  );
};

export default AddCookedItems;