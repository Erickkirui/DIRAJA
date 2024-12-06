// AddItemForm.js
import React, { useState } from 'react';

const AddItemForm = ({ onAddAsset, onAddLiability }) => {
  const [itemType, setItemType] = useState('asset'); // 'asset' or 'liability'
  const [name, setName] = useState('');
  const [value, setValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const newItem = { name, value: parseFloat(value) };
    
    if (itemType === 'asset') {
      onAddAsset(newItem);
    } else {
      onAddLiability(newItem);
    }
    setName('');
    setValue('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Add New Item</h2>
      <div>
        <label>Item Type:</label>
        <select value={itemType} onChange={(e) => setItemType(e.target.value)}>
          <option value="asset">Asset</option>
          <option value="liability">Liability</option>
        </select>
      </div>
      <div>
        <label>Item Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Item Value (Ksh.):</label>
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
        />
      </div>
      <button type="submit">Add Item</button>
    </form>
  );
};

export default AddItemForm;
