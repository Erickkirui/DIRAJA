import { useState, useEffect } from "react";
import axios from "axios";

const UpdateTransfer = ({ transferId }) => {
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTransfer = async () => {
      try {
        const accessToken = localStorage.getItem("access_token");
        if (!accessToken) {
          setError("Unauthorized: No access token found.");
          return;
        }

        const response = await axios.get(
          `/api/diraja/singletransfer/${transferId}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        setFormData(response.data);
        setError("");
      } catch (error) {
        console.error("Error fetching transfer details:", error);
        setError("Failed to load transfer details.");
      }
    };

    if (transferId) {
      fetchTransfer();
      window.scrollTo({ top: 0, behavior: "smooth" }); // Scroll to top when opened
    }
  }, [transferId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedFormData = { ...formData, [name]: value };
    
    if (name === "unitCost" || name === "quantity") {
      const unitCost = parseFloat(updatedFormData.unitCost) || 0;
      const quantity = parseFloat(updatedFormData.quantity) || 0;
      updatedFormData.totalCost = (unitCost * quantity).toFixed(2);
    }
    
    setFormData(updatedFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        setError("Unauthorized: No access token found.");
        return;
      }

      const response = await axios.put(
        `/api/diraja/updatetransfer/${transferId}`,
        formData,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      setMessage(response.data.message);
      setError("");
      setTimeout(() => {
        window.location.reload();
      }, 2000); // Reload page after success message
    } catch (error) {
      console.error("Error updating transfer:", error);
      setError("Error updating transfer.");
    }
  };

  return (
    <div className="update-transfer-container">
      <h2 className="title">Update Transfer</h2>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit} className="update-form">
        {["itemname", "unitCost", "quantity", "amountPaid", "totalCost"].map((key) => (
          <div className="input-group" key={key}>
            <label htmlFor={key} className="input-label">
              {key.replace(/_/g, "  : ")}
            </label>
            <input
              type="text"
              id={key}
              name={key}
              value={formData[key] || ""}
              onChange={handleChange}
              className="input-field"
              readOnly={key === "totalCost"}
            />
          </div>
        ))}
        <button type="submit" className="submit-button">
          Update Transfer
        </button>
      </form>
    </div>
  );
};

export default UpdateTransfer;
