import { useEffect, useState } from "react";
import axios from "axios";

const UpdateExpenses = ({ expenseId, onClose, onUpdateSuccess }) => {
  const [updatedData, setUpdatedData] = useState({
    item: '',
    description: '',
    category: '',
    quantity: '',
    totalPrice: '',
    amountPaid: '',
    paidTo: '',
    source: '',
    paymentRef: '',
    comments: '',
    created_at: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formVisible, setFormVisible] = useState(true);

  // Fetch existing expense details when component mounts
  useEffect(() => {
    const fetchExpenseDetails = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        const response = await axios.get(`/api/diraja/expense/${expenseId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        setUpdatedData(response.data);
        setError("");
      } catch (error) {
        console.error("Error fetching expense details:", error);
        setError("Failed to load expense data.");
      }
    };

    if (expenseId) {
      fetchExpenseDetails();
      window.scrollTo({ top: 0, behavior: "smooth" }); // Scroll to top when opened
    }
  }, [expenseId]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUpdatedData(prevData => ({
      ...prevData,
      [name]: value
    }));
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

      const response = await axios.put(`/api/diraja/expense/${expenseId}`, updatedData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      console.log("Update response:", response.data);
      setSuccess("Expense updated successfully!");
      onUpdateSuccess(); // Refresh expenses list

      // Delay closing for better UX
      setTimeout(() => {
        setFormVisible(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error updating expense:", error);
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
            <label>Item:</label>
            <input type="text" name="item" value={updatedData.item} onChange={handleChange} />
          </div>
          <div>
            <label>Description:</label>
            <input type="text" name="description" value={updatedData.description} onChange={handleChange} />
          </div>
          <div>
            <label>Category:</label>
            <input type="text" name="category" value={updatedData.category} onChange={handleChange} />
          </div>
          <div>
            <label>Quantity:</label>
            <input type="number" name="quantity" value={updatedData.quantity} onChange={handleChange} />
          </div>
          <div>
            <label>Total Price (Ksh):</label>
            <input type="number" name="totalPrice" value={updatedData.totalPrice} onChange={handleChange} />
          </div>
          <div>
            <label>Amount Paid (Ksh):</label>
            <input type="number" name="amountPaid" value={updatedData.amountPaid} onChange={handleChange} />
          </div>
          <div>
            <label>Paid To:</label>
            <input type="text" name="paidTo" value={updatedData.paidTo} onChange={handleChange} />
          </div>
          <div>
            <label>Source:</label>
            <input type="text" name="source" value={updatedData.source} onChange={handleChange} />
          </div>
          <div>
            <label>Payment Reference:</label>
            <input type="text" name="paymentRef" value={updatedData.paymentRef} onChange={handleChange} />
          </div>
          <div>
            <label>Comments:</label>
            <textarea name="comments" value={updatedData.comments} onChange={handleChange} />
          </div>
          <div>
            <label>Date:</label>
            <input type="date" name="created_at" value={updatedData.created_at} onChange={handleChange} />
          </div>
          <div>
            <button type="submit" className="button" disabled={loading}>
              {loading ? "Updating..." : "Update Expense"}
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

export default UpdateExpenses;