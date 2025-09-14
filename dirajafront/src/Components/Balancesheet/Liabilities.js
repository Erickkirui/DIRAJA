import React, { useEffect, useState } from 'react';

const Liabilities = ({ startDate, endDate, liabilities }) => {
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLiabilities = async () => {
      if (!startDate || !endDate) {
        console.log('Start date or end date not set.');
        return; // Only fetch if both dates are set
      }
      
      console.log("Fetching data with startDate:", startDate, "endDate:", endDate);
      setLoading(true);
      try {
        const response = await fetch(
          `api/diraja/accountspayable?start_date=${startDate}&end_date=${endDate}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('access_token')}`
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch account payable data');
        }

        const data = await response.json();
        console.log("Raw payable receivable data:", data);

        // Check if data has the expected structure and set totalBalance
        if (data && data.total_balance !== undefined) {
          setTotalBalance(data.total_balance);
        } else {
          console.log('No total_balance data returned.');
          setTotalBalance(0);
        }
      } catch (error) {
        console.error('Error fetching liabilities:', error);
        setTotalBalance(0); // Set totalBalance to 0 in case of error
      } finally {
        setLoading(false);
      }
    };

    fetchLiabilities();
  }, [startDate, endDate]);

  // Function to calculate the total from all liability items, including the api and manually added items
  const calculateTotalLiabilities = () => {
    const addedTotal = liabilities.reduce((total, item) => total + item.value, 0);
    return totalBalance + addedTotal;
  };

  return (
    <div className='asset-container' > 
      <h2 className='balancesheet-titles'>Liabilities</h2>
      {loading ? (
        <p>Loading data...</p>
      ) : (
        <>
          <h3>Account Payable</h3>
         
          <table>
            <tr>
              <td>Total Payable</td>
              <td> ksh {totalBalance.toFixed(2)}</td>
            </tr>
          </table>
          <h3>Other Liabilities</h3>
          <table className='balancesheet-table'>
            <tbody>
              {liabilities.map((item, index) => (
                <tr key={index}>
                  <td>{item.name}</td>
                  <td>{item.value.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className='balancesheet-total-container'>
            <h3>Total Liabilities</h3>
            <h3>ksh {calculateTotalLiabilities().toFixed(2)}</h3>
          </div>
        </>
      )}
    </div>
  );
};

export default Liabilities;
