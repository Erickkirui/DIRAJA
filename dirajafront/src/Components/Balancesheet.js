import React, { useState, useEffect } from 'react';
import AddItemForm from './Balancesheet/AddItemForm';
import Assets from './Balancesheet/Assets';
import Liabilities from './Balancesheet/Liabilities';
import DownloadPDF from './Download/DownloadPDF'; // Import the PDF download component
import '../Styles/Balancesheet.css';

const BalanceSheet = () => {
  const [assets, setAssets] = useState([]);
  const [liabilities, setLiabilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const storedAssets = JSON.parse(localStorage.getItem('assets')) || [];
    setAssets(storedAssets);
  }, []);

  useEffect(() => {
    const storedLiabilities = JSON.parse(localStorage.getItem('liabilities')) || [];
    setLiabilities(storedLiabilities);
  }, []);

  const addAsset = (newAsset) => {
    const updatedAssets = [...assets, newAsset];
    setAssets(updatedAssets);
    localStorage.setItem('assets', JSON.stringify(updatedAssets));
  };

  const addLiability = (newLiability) => {
    const updatedLiabilities = [...liabilities, newLiability];
    setLiabilities(updatedLiabilities);
    localStorage.setItem('liabilities', JSON.stringify(updatedLiabilities));
  };

  const clearData = () => {
    setAssets([]);
    setLiabilities([]);
    localStorage.removeItem('assets');
    localStorage.removeItem('liabilities');
  };

  const calculateNetCurrentAssets = () => {
    const totalCurrentAssets = assets.reduce((total, asset) => total + asset.value, 0);
    const totalCurrentLiabilities = liabilities.reduce((total, liability) => total + liability.value, 0);
    return totalCurrentAssets - totalCurrentLiabilities;
  };

  return (
    <div id="balancesheet-container" className='BalancesheetContainer'>
      <div className='balancesheet-top-section'>
        <h1>Balance Sheet</h1>
        <h3>For the period </h3>
        {startDate && endDate && (
            <h3 className='period-display'>
              {startDate} - {endDate}
            </h3>
          )}
        <div className='period-for-balancesheet'>
          <label>
            Start Date:
            <input
              className="date-picker"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <label>
            End Date:
            <input
              className="date-picker"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
        </div>
      </div>
      <div className='form-area-balancesheet'>
        <AddItemForm onAddAsset={addAsset} onAddLiability={addLiability} />
        <button onClick={clearData}>Clear Data</button>
        {loading && <p>Loading data...</p>}
      </div>

      <Assets
        setLoading={setLoading}
        addedItems={assets}
        startDate={startDate}
        endDate={endDate}
      />
      <Liabilities
        startDate={startDate}
        endDate={endDate}
        liabilities={liabilities}
      />

      <h2>Calculations</h2>
      <p>Net Current Assets: ksh {calculateNetCurrentAssets().toFixed(2)}</p>

      {/* Include the download button here */}
      <DownloadPDF containerId="balancesheet-container" fileName="BalanceSheet" />
    </div>
  );
};

export default BalanceSheet;
