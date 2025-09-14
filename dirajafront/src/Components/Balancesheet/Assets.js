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
          `api/diraja/get_payment_totals?start_date=${startDate}&end_date=${endDate}`,
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

        const parsedData = [
          { name: 'Bank', value: parseFloat(data.bank.replace(/[^\d.-]/g, '')) },
          { name: 'Cash', value: parseFloat(data.cash.replace(/[^\d.-]/g, '')) },
          { name: 'Mpesa', value: parseFloat(data.mpesa.replace(/[^\d.-]/g, '')) }
        ];

        const scaledData = parsedData.map((item) => ({
          ...item,
          value: item.value < 1 ? item.value * 100 : item.value
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
          `api/diraja/shopstock/bydate?start_date=${startDate}&end_date=${endDate}`,
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
          `api/diraja/accountsreceivable?start_date=${startDate}&end_date=${endDate}`,
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
        console.log('Raw accounts receivable data:', data);

        if (data.total_balance !== undefined) {
          setTotalBalance(data.total_balance);
        }

        const parsedReceivables = data.map((item) => ({
          name: item.customerName || 'Unknown Customer',
          value: parseFloat(item.amountDue) || 0
        }));

        setAccountsReceivableData(parsedReceivables);
      } catch (error) {
        console.error('Error fetching accounts receivable data:', error.message, error);
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
    <div className='asset-container'>
      <h2 className='balancesheet-titles'>Assets</h2>
      
      <h3>Cash Breakdown</h3>
      <table>
        <tbody>
          {assetData.map((item, index) => (
            <tr key={`dynamic-${index}`}>
              <td>{item.name}</td>
              <td> ksh {item.value.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Stock </h3>
      <table>
        <tbody>
          {shopStockData.map((item, index) => (
            <tr key={`shop-${index}`}>
              <td>{item.name}</td>
              <td> ksh {item.value.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Accounts Receivable</h3>
      <table>
        <tbody>
          <tr>
            <td>total receivable</td>
            <td>ksh {totalBalance.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
      
  
      <h3>Other Assets</h3>
      <table>
        <tbody>
          {addedItems.map((item, index) => (
            <tr key={`user-${index}`}>
              <td>{item.name}</td>
              <td>{item.value.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className='balancesheet-total-container'>
        <h3>Total Assets</h3>
        <h3>ksh {calculateTotalAssets().toFixed(2)}</h3>
      </div>
    </div>
  );
};

export default Assets;
