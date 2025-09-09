import { useState, useEffect } from "react";
import axios from "axios";
import { Stack, Alert } from "@mui/material";  // Import Material UI components

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
          `api/diraja/singletransfer/${transferId}`,
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

    // Recalculate total cost if unitCost or quantity is changed
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
  
      // Create a new payload by excluding the 'created_at' field
      const { created_at, ...updatedFormData } = formData; // Exclude created_at field
  
      const response = await axios.put(
        `api/diraja/updatetransfer/${transferId}`,
        updatedFormData, // Send the updated data excluding created_at
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      setMessage(response.data.message);
      setError("");
  
      // Remove the page reload on success
      setFormData({}); // Clear the form fields (optional)
    } catch (error) {
      console.error("Error updating transfer:", error);
      setError("Error updating transfer.");
    }
  };
  

  return (
    <div className="update-transfer-container">
      <h2 className="title">Update Transfer</h2>

      

      <form onSubmit={handleSubmit} className="updateform">
          {/* Success Message */}
        {message && (
          <Stack sx={{ width: '100%' }} spacing={2}>
            <Alert severity="success" variant="outlined">
              {message}
            </Alert>
          </Stack>
        )}

        {/* Error Message */}
        {error && (
          <Stack sx={{ width: '100%' }} spacing={2}>
            <Alert severity="error" variant="outlined">
              {error}
            </Alert>
          </Stack>
        )}
        {["itemname", "unitCost", "quantity", "amountPaid", "totalCost", "date"].map((key) => (
          <div className="input-group" key={key}>
            <label htmlFor={key} className="input-label">
              {key.replace(/_/g, " : ")}
            </label>
            {key === "date" ? (
              <input
                type="date"
                id={key}
                name={key}
                value={formData[key] || ""} // Pre-fill the date from formData
                onChange={handleChange}
                className="input-field"
              />
            ) : (
              <input
                type="text"
                id={key}
                name={key}
                value={formData[key] || ""} // Pre-fill the rest of the fields
                onChange={handleChange}
                className="input-field"
                readOnly={key === "totalCost"} // Make totalCost read-only
              />
            )}
          </div>
        ))}
        
        <button type="submit" className="button">
          Update Transfer
        </button>

        
        
      </form>
    </div>
  );
};

export default UpdateTransfer;
