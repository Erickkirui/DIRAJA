import React, { useState, useEffect } from 'react';
import AddItemForm from './Balancesheet/AddItemForm';
import Assets from './Balancesheet/Assets';
import Liabilities from './Balancesheet/Liabilities';

const BalanceSheet = () => {
  const [assets, setAssets] = useState([]);
  const [liabilities, setLiabilities] = useState([
    { name: 'Accounts Payable', value: 1500 },
    { name: 'Loans', value: 3000 }
  ]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    // Retrieve stored assets from localStorage on component mount
    const storedAssets = JSON.parse(localStorage.getItem('assets')) || [];
    setAssets(storedAssets);
  }, []);

  const addAsset = (newAsset) => {
    const updatedAssets = [...assets, newAsset];
    setAssets(updatedAssets);
    localStorage.setItem('assets', JSON.stringify(updatedAssets)); // Save updated assets to localStorage
  };

  const addLiability = (newLiability) => {
    const updatedLiabilities = [...liabilities, newLiability];
    setLiabilities(updatedLiabilities);
    localStorage.setItem('liabilities', JSON.stringify(updatedLiabilities)); // Save updated liabilities to localStorage
  };

  const clearData = () => {
    setAssets([]);
    setLiabilities([]);
    localStorage.removeItem('assets');
    localStorage.removeItem('liabilities');
  };

  return (
    <div>
      <h1>Balance Sheet</h1>
      <div>
        <label>
          Start Date:
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label>
          End Date:
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
      </div>
      <AddItemForm onAddAsset={addAsset} onAddLiability={addLiability} />
      <button onClick={clearData}>Clear Data</button>
      {loading && <p>Loading data...</p>}

      <Assets
        setLoading={setLoading}
        addedItems={assets}
        startDate={startDate}
        endDate={endDate}
      />
      <Liabilities
        liabilityItems={liabilities}
        startDate={startDate}
        endDate={endDate}
      />
      
    </div>
  );
};

export default BalanceSheet;
