import React, { useState, useEffect } from 'react';

const Assets = ({ setLoading, addedItems, startDate, endDate }) => {
  const [assetData, setAssetData] = useState([]);
  const [shopStockData, setShopStockData] = useState([]);
  const [accountsReceivableData, setAccountsReceivableData] = useState([]);

  useEffect(() => {
    const fetchAssetData = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/diraja/get_payment_totals?start_date=${startDate}&end_date=${endDate}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('access_token')}`
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch asset data');
        }

        const data = await response.json();
        const parsedData = [
          { name: 'Bank', value: parseFloat(data.bank.replace(/[^\d.-]/g, '')) },
          { name: 'Cash', value: parseFloat(data.cash.replace(/[^\d.-]/g, '')) },
          { name: 'Mpesa', value: parseFloat(data.mpesa.replace(/[^\d.-]/g, '')) }
        ];
        setAssetData(parsedData);
      } catch (error) {
        console.error('Error fetching asset data:', error);
      }
    };

    const fetchShopStockData = async () => {
      try {
        const response = await fetch(
          `/api/diraja/shopstock/value?start_date=${startDate}&end_date=${endDate}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('access_token')}`
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch shop stock data');
        }

        const data = await response.json();
        const parsedShopStock = Object.keys(data.shop_stock_values).map((key) => ({
          name: data.shop_stock_values[key].shop_name,
          value: data.shop_stock_values[key].total_stock_value
        }));

        setShopStockData(parsedShopStock);
      } catch (error) {
        console.error('Error fetching shop stock data:', error);
      }
    };

    const fetchAccountsReceivableData = async () => {
      try {
        const response = await fetch(
          `/api/diraja/accountsreceivable?start_date=${startDate}&end_date=${endDate}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('access_token')}`
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch accounts receivable data');
        }

        const data = await response.json();
        const parsedReceivables = data.map((item) => ({
          name: item.customerName, // Adjust as per your response structure
          value: parseFloat(item.amountDue) // Adjust as per your response structure
        }));

        setAccountsReceivableData(parsedReceivables);
      } catch (error) {
        console.error('Error fetching accounts receivable data:', error);
      }
    };

    if (startDate && endDate) {
      fetchAssetData();
      fetchShopStockData();
      fetchAccountsReceivableData();
      setLoading(false);
    }
  }, [setLoading, startDate, endDate]);

  const calculateTotalAssets = () => {
    const allAssets = [...assetData, ...addedItems, ...shopStockData, ...accountsReceivableData];
    return allAssets.reduce((total, item) => total + item.value, 0);
  };

  return (
    <div>
      <h2>Assets</h2>
      <ul>
        <h3>Cash Breakdown</h3>
        {assetData.map((item, index) => (
          <li key={`dynamic-${index}`}>{item.name}: Ksh. {item.value.toFixed(2)}</li>
        ))}

        <h3>Shop Stock Values</h3>
        {shopStockData.map((item, index) => (
          <li key={`shop-${index}`}>{item.name}: Ksh. {item.value.toFixed(2)}</li>
        ))}

        <h3>Accounts Receivable</h3>
        {accountsReceivableData.map((item, index) => (
          <li key={`receivable-${index}`}>{item.name}: Ksh. {item.value.toFixed(2)}</li>
        ))}

        <h3>Other Assets</h3>
        {addedItems.map((item, index) => (
          <li key={`user-${index}`}>{item.name}: Ksh. {item.value.toFixed(2)}</li>
        ))}
      </ul>

      <h3>Total Assets: Ksh. {calculateTotalAssets().toFixed(2)}</h3>
    </div>
  );
};

export default Assets;
