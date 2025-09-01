import { useEffect, useState } from "react";
import axios from "axios";

const UpdateInventory = ({ inventoryId, onClose, onUpdateSuccess }) => {
  const [updatedData, setUpdatedData] = useState({
    itemname: '',
    batchnumber: '',
    initial_quantity: '',
    unitCost: '',
    unitPrice: '',
    totalCost: '',
    amountPaid: '',
    Suppliername: '',
    Supplier_location: '',
    note: '',
    created_at: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formVisible, setFormVisible] = useState(true);

  // Fetch existing inventory details when component mounts
  useEffect(() => {
    const fetchInventoryDetails = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        const response = await axios.get(`https://kulima.co.ke/api/diraja/v2/inventory/${inventoryId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        setUpdatedData(response.data);
        setError("");
      } catch (error) {
        console.error("Error fetching inventory details:", error);
        setError("Failed to load inventory data.");
      }
    };

    if (inventoryId) {
      fetchInventoryDetails();
      window.scrollTo({ top: 0, behavior: "smooth" }); // Scroll to top when opened
    }
  }, [inventoryId]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUpdatedData(prevData => {
      const newData = { ...prevData, [name]: value };

      // Auto-calculate total cost if initial_quantity or unitCost changes
      if (name === "initial_quantity" || name === "unitCost") {
        const quantity = name === "initial_quantity" ? value : prevData.initial_quantity;
        const unitCost = name === "unitCost" ? value : prevData.unitCost;
        newData.totalCost = (parseFloat(quantity) || 0) * (parseFloat(unitCost) || 0);
      }

      return newData;
    });
  };

  // Handle update request
  const handleUpdate = async (e) => {
    e.preventDefault();
    console.log("Data being sent to backend:", updatedData);

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        console.error("No access token found.");
        setError("Unauthorized: Please log in again.");
        setLoading(false);
        return;
      }

      const response = await axios.put(`https://kulima.co.ke/api/diraja/v2/inventory/${inventoryId}`, updatedData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      console.log("Update response:", response.data);
      setSuccess("Inventory updated successfully!");
      onUpdateSuccess(); // Refresh inventory list

      // Delay closing for better UX
      setTimeout(() => {
        setFormVisible(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error updating inventory:", error);
      setError("Update failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}
      {success && <p className="success-message" style={{ color: 'green' }}>{success}</p>}

      {formVisible && (
        <form onSubmit={handleUpdate} className="updateform">
          <div>
            <label>Item Name:</label>
            <input type="text" name="itemname" value={updatedData.itemname} onChange={handleChange} />
          </div>
          <div>
            <label>Initial Quantity:</label>
            <input type="number" name="initial_quantity" value={updatedData.initial_quantity} onChange={handleChange} />
          </div>
          <div>
            <label>Unit Cost (Ksh):</label>
            <input type="number" name="unitCost" value={updatedData.unitCost} onChange={handleChange} />
          </div>
          <div>
            <label>Unit Price (Ksh):</label>
            <input type="number" name="unitPrice" value={updatedData.unitPrice} onChange={handleChange} />
          </div>
          <div>
            <label>Total Cost (Ksh):</label>
            <input type="number" name="totalCost" value={updatedData.totalCost} disabled />
          </div>
          <div>
            <label>Amount Paid (Ksh):</label>
            <input type="number" name="amountPaid" value={updatedData.amountPaid} onChange={handleChange} />
          </div>
          <div>
            <label>Supplier Name:</label>
            <input type="text" name="Suppliername" value={updatedData.Suppliername} onChange={handleChange} />
          </div>
          <div>
            <label>Supplier Location:</label>
            <input type="text" name="Supplier_location" value={updatedData.Supplier_location} onChange={handleChange} />
          </div>
          <div>
            <label>Note:</label>
            <textarea name="note" value={updatedData.note} onChange={handleChange} />
          </div>
          <div>
            <label>Date:</label>
            <input type="date" name="created_at" value={updatedData.created_at} onChange={handleChange} />
          </div>
          <div>
            <button type="submit" className="button" disabled={loading}>
              {loading ? "Updating..." : "Update Inventory"}
            </button>
            <button type="button" onClick={() => { setFormVisible(false); onClose(); }} className="button">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default UpdateInventory;
