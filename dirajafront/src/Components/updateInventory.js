import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../Styles/inventory.css'

const UpdateInventory = ({ inventoryId, onUpdateSuccess }) => {
  const [inventoryData, setInventoryData] = useState({
    itemname: '',
    initial_quantity: 0,
    metric: '',
    unitCost: 0,
    unitPrice: 0,
    totalCost: 0,
    amountPaid: 0,
    Suppliername: '',
    Supplier_location: '',
    note: '',
    created_at: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [initialData, setInitialData] = useState({}); // Store initial inventory data for reset
  const [formVisible, setFormVisible] = useState(true); // State to control form visibility
  const [cancelClicked, setCancelClicked] = useState(false); // Track cancel action

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        const response = await axios.get(`/api/diraja/inventory/${inventoryId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setInventoryData(response.data);
        setInitialData(response.data); // Save initial data for reset
      } catch (err) {
        setError('Error fetching inventory data.');
      }
    };

    fetchInventory();
  }, [inventoryId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInventoryData((prevData) => {
      const updatedData = { ...prevData, [name]: value };
      if (name === 'initial_quantity' || name === 'unitCost') {
        updatedData.totalCost = updatedData.unitCost * updatedData.initial_quantity;
      }
      return updatedData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // If note is empty, set it to null
      const updatedInventoryData = {
        ...inventoryData,
        note: inventoryData.note.trim() === '' ? null : inventoryData.note,
      };

      const accessToken = localStorage.getItem('access_token');
      await axios.put(`/api/diraja/inventory/${inventoryId}`, updatedInventoryData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setSuccess('Inventory updated successfully.');
      setError('');
      
      // Set form visibility to false after 2 seconds
      setTimeout(() => {
        setFormVisible(false);
        onUpdateSuccess(); // Trigger onUpdateSuccess after form disappears
      }, 2000); // Delay to show success message before hiding the form
    } catch (err) {
      setError('Error updating inventory.');
      setSuccess('');
    }
  };

  const handleCancel = () => {
    setInventoryData(initialData); // Reset to initial data
    setCancelClicked(true); // Mark cancel as clicked
    setSuccess(''); // Hide success message if the user cancels
    setFormVisible(true); // Show the form again
  };

  useEffect(() => {
    if (cancelClicked) {
      setCancelClicked(false); // Reset cancel state after action
      setSuccess(''); // Ensure no success message shows after cancel
    }
  }, [cancelClicked]);

  return (
    <div>
      {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}

      {/* Show success message at the top of the form */}
      {success && formVisible && (
        <p className="success-message" style={{ color: 'green' }}>{success}</p>
      )}

      {/* Update Inventory Form */}
      {formVisible && (
        <form onSubmit={handleSubmit} className='updateform'>
          <div>
            <label>Item Name: </label>
            <input type="text" name="itemname" value={inventoryData.itemname} onChange={handleChange} />
          </div>
          <div>
            <label>Quantity: </label>
            <input type="number" name="initial_quantity" value={inventoryData.initial_quantity} onChange={handleChange} />
          </div>
          <div>
            <label>Metric:</label>
            <input type="text" name="metric" value={inventoryData.metric} onChange={handleChange} />
          </div>
          <div>
            <label>Unit Cost (Ksh): </label>
            <input type="number" name="unitCost" value={inventoryData.unitCost} onChange={handleChange} />
          </div>
          <div>
            <label>Unit Price (Ksh): </label>
            <input type="number" name="unitPrice" value={inventoryData.unitPrice} onChange={handleChange} />
          </div>
          <div>
            <label>Total Cost (Ksh): </label>
            <input type="number" name="totalCost" value={inventoryData.totalCost} disabled />
          </div>
          <div>
            <label>Amount Paid (Ksh): </label>
            <input type="number" name="amountPaid" value={inventoryData.amountPaid} onChange={handleChange} />
          </div>
          <div>
            <label>Supplier Name: </label>
            <input type="text" name="Suppliername" value={inventoryData.Suppliername} onChange={handleChange} />
          </div>
          <div>
            <label>Supplier Location: </label>
            <input type="text" name="Supplier_location" value={inventoryData.Supplier_location} onChange={handleChange} />
          </div>
          <div>
            <label>Note: </label>
            <textarea name="note" value={inventoryData.note} onChange={handleChange} />
          </div>
          <div>
            <label>Date: </label>
            <input type="date" name="created_at" value={inventoryData.created_at} onChange={handleChange} />
          </div>
          <div>
          <button type="submit" className='button'>Update Inventory</button>

          </div>
          
        </form>
      )}

   
    
    </div>
  );
};

export default UpdateInventory;
