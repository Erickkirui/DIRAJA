import React, { useState, useEffect } from 'react';

const Assets = ({ setLoading, addedItems, startDate, endDate }) => {
  const [assetData, setAssetData] = useState([]);
  const [shopStockData, setShopStockData] = useState([]);
  const [accountsReceivableData, setAccountsReceivableData] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);


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
          console.log('Raw asset data:', data);
      
          // Ensure correct parsing of values
          const parsedData = [
            { name: 'Bank', value: parseFloat(data.bank.replace(/[^\d.-]/g, '')) },
            { name: 'Cash', value: parseFloat(data.cash.replace(/[^\d.-]/g, '')) },
            { name: 'Mpesa', value: parseFloat(data.mpesa.replace(/[^\d.-]/g, '')) }
          ];
      
          // Check for improperly scaled values and adjust if necessary
          const scaledData = parsedData.map((item) => ({
            ...item,
            value: item.value < 1 ? item.value * 100 : item.value // Fix improperly scaled values
          }));
      
          console.log('Parsed asset data:', scaledData);
          setAssetData(scaledData);
        } catch (error) {
          console.error('Error fetching asset data:', error);
        }
      };
    

    const fetchShopStockData = async () => {
      try {
        const response = await fetch(
          `/api/diraja/shopstock/bydate?start_date=${startDate}&end_date=${endDate}`,
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
        console.log('Raw shop stock data:', data);

        // Check if shop_stocks is an array and process it
        const parsedShopStock = Array.isArray(data.shop_stocks)
          ? data.shop_stocks.map((item) => ({
              name: item.shop_name,
              value: item.total_value
            }))
          : [];

        console.log('Parsed shop stock data:', parsedShopStock);

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
              Authorization: `Bearer ${localStorage.getItem('access_token')}`,
            },
          }
        );
    
        if (!response.ok) {
          throw new Error('Failed to fetch accounts receivable data');
        }
    
        const data = await response.json();
        console.log("Raw accounts receivable data:", data);
    
        // Ensure the total_balance is set in state if needed
        if (data.total_balance !== undefined) {
          setTotalBalance(data.total_balance); // Assume `setTotalBalance` is defined to set the state
        }
    
        const parsedReceivables = data.map((item) => ({
          name: item.customerName || "Unknown Customer",
          value: parseFloat(item.amountDue) || 0,
        }));
    
        setAccountsReceivableData(parsedReceivables);
      } catch (error) {
        console.error("Error fetching accounts receivable data:", error.message, error);
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
        <p>Total Balance: Ksh. {totalBalance.toFixed(2)}</p>

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
