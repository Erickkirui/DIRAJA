import React, { useState } from 'react';
import axios from 'axios';

const AddInventory = () => {
  const [formData, setFormData] = useState({
    itemname: '',
    quantity: '',
    metric: 'kg', // Default to "kg"
    unitCost: '',
    amountPaid: '',
    unitPrice: '',
    Suppliername: '',
    Supplier_location: '',
    note: '',
    created_at: '',
    source: '', // Just source, no external funding comment needed
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Convert String inputs to numbers where necessary
    const numericFormData = {
      ...formData,
      quantity: Number(formData.quantity),
      unitCost: Number(formData.unitCost),
      amountPaid: Number(formData.amountPaid),
      unitPrice: Number(formData.unitPrice)
    };

    try {
      const response = await axios.post('/api/diraja/newinventory', numericFormData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      setMessage(response.data.message);

      // Clear the form data after successful submission
      setFormData({
        itemname: '',
        quantity: '',
        metric: 'kg', // Reset to default value
        unitCost: '',
        amountPaid: '',
        unitPrice: '',
        Suppliername: '',
        Supplier_location: '',
        note: '',
        created_at: '',
        source: '', // Reset source
      });

    } catch (error) {
      setMessage('Error adding inventory: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div>
      <h2>Add New Inventory</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit} className="form">
        <div>
          <input
            type="text"
            name="itemname"
            value={formData.itemname}
            onChange={handleChange}
            placeholder="Item Name"
            className="input"
            required
          />
        </div>
        <div>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            placeholder="Quantity"
            className="input"
            required
          />
        </div>
        <div>
          <select
            name="metric"
            value={formData.metric}
            onChange={handleChange}
            className="input"
            required
          >
            <option value="kg">Kilograms</option>
            <option value="litres">Litres</option>
            <option value="item">Items</option>
          </select>
        </div>
        {/* Source Dropdown */}
        <div>
          <select name="source" value={formData.source} onChange={handleChange} className="select">
            <option value="">Select Source</option>
            <option value="Mpesa - 0748277960">Mpesa - 0748277960</option>
            <option value="Mpesa - 0116400393">Mpesa - 0116400393</option>
            <option value="Sasapay - Mirema">Sasapay - Mirema</option>
            <option value="Sasapay - TRM">Sasapay - TRM</option>
            <option value="Sasapay - Lumumba Drive">Sasapay - Lumumba Drive</option>
            <option value="Sasapay - Zimmerman shop">Sasapay - Zimmerman shop</option>
            <option value="Sasapay - Zimmerman Store">Sasapay - Zimmerman Store</option>
            <option value="Sasapay - Githurai 44">Sasapay - Githurai 44</option>
            <option value="Sasapay - Kangundo Rd Market">Sasapay - Kangundo Rd Market</option>
            <option value="Sasapay - Ngoingwa">Sasapay - Ngoingwa</option>
            <option value="Sasapay - Thika Market">Sasapay - Thika Market</option>
            <option value="Sasapay - Mabanda">Sasapay - Mabanda</option>
            <option value="Sasapay - Kisumu">Sasapay - Kisumu</option>
            <option value="Sasapay - Pipeline">Sasapay - Pipeline</option>
            <option value="Sasapay - Turi">Sasapay - Turi</option>
            <option value="Sta">Sta</option>
            <option value="Standard Chartered Bank">Standard Chartered Bank</option>
            <option value="External funding">External funding</option>
          </select>
        </div>
        <div>
          <textarea
            name="note"
            value={formData.note}
            onChange={handleChange}
            placeholder="Comments (Optional)"
            className="input"
          />
        </div>
        <div>
          <input
            type="number"
            name="unitCost"
            value={formData.unitCost}
            onChange={handleChange}
            placeholder="Unit Cost"
            className="input"
            required
          />
        </div>
        <div>
          <input
            type="number"
            name="amountPaid"
            value={formData.amountPaid}
            onChange={handleChange}
            placeholder="Amount Paid"
            className="input"
            required
          />
        </div>
        <div>
          <input
            type="number"
            name="unitPrice"
            value={formData.unitPrice}
            onChange={handleChange}
            placeholder="Unit Price"
            className="input"
            required
          />
        </div>
        <div>
          <input
            type="text"
            name="Suppliername"
            value={formData.Suppliername}
            onChange={handleChange}
            placeholder="Supplier Name"
            className="input"
            required
          />
        </div>
        <div>
          <input
            type="text"
            name="Supplier_location"
            value={formData.Supplier_location}
            onChange={handleChange}
            placeholder="Supplier Location"
            className="input"
            required
          />
        </div>
        <div>
          <input
            type="date"
            name="created_at"
            value={formData.created_at}
            onChange={handleChange}
            className="input"
            required
          />
        </div>
        <button type="submit" className="button">Add Inventory</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default AddInventory;
