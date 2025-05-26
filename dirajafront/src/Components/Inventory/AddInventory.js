import React, { useState, useEffect } from 'react';
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
    paymentRef:'',
    source: '', // Just source, no external funding comment needed
  });

  const [message, setMessage] = useState('');
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await axios.get('/api/diraja/all-acounts', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });

        console.log('Accounts Response:', response.data); // Optional log for debugging

        if (Array.isArray(response.data.accounts)) {
          setAccounts(response.data.accounts);
        } else {
          console.error('Accounts response is not an array');
          setAccounts([]);
        }
      } catch (error) {
        console.error('Error fetching accounts:', error);
        setAccounts([]);
      }
    };

    fetchAccounts();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.paymentRef.trim()) {
      setMessage('Error: Payment reference must be provided.');
      return;
    }

    // Convert String inputs to numbers where necessary
    const numericFormData = {
      ...formData,
      quantity: Number(formData.quantity),
      unitCost: Number(formData.unitCost),
      amountPaid: Number(formData.amountPaid),
      unitPrice: Number(formData.unitPrice),
    };

    try {
      const response = await axios.post('/api/diraja/newinventory', numericFormData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
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
        paymentRef:'',
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
            {Array.isArray(accounts) && accounts.length > 0 ? (
              accounts.map((acc, index) => (
                <option key={index} value={acc.Account_name}>{acc.Account_name}</option>
              ))
            ) : (
              <option value="">No accounts available</option>
            )}
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
            type="text"
            name="paymentRef"
            value={formData.paymentRef}
            onChange={handleChange}
            placeholder="Payment Ref (Transaction code)"
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
