// AddItemForm.js
import React, { useState } from 'react';
import '../../Styles/Balancesheet.css'


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
    <>
    
    <form onSubmit={handleSubmit} className='balancesheet-form'>
      
      <div>
        
        <select value={itemType} onChange={(e) => setItemType(e.target.value)}>
          <option value="asset">Asset</option>
          <option value="liability">Liability</option>
        </select>
      </div>
      <div>
        
        <input
        placeholder='Input item name (eg Lories)'
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <input
        placeholder='Input item value(eg 1000)'
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
        />
      </div>
      <button type="submit">Add Item</button>
    </form>
    </>
  );
};

export default AddItemForm;
