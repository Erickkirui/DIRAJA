import React, { useEffect, useState } from 'react';

const ProfitAndLoss = () => {
  const [salesData, setSalesData] = useState([]);
  const [expensesData, setExpensesData] = useState([]);
  const [purchasesData, setPurchasesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch and validate data
        const fetchAndValidate = async (url) => {
          const response = await fetch(url);
          const data = await response.json();
          return Array.isArray(data) ? data : [];
        };

        // Fetch all data
        const sales = await fetchAndValidate('/api/diraja/allsales');
        const expenses = await fetchAndValidate('/api/diraja/allexpenses');
        const purchases = await fetchAndValidate('/api/diraja/transfer');

        // Set state
        setSalesData(sales);
        setExpensesData(expenses);
        setPurchasesData(purchases);
      } catch (err) {
        setError('Failed to fetch data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalSales = salesData.reduce((sum, sale) => sum + (sale.amount_paid || 0), 0);
  const totalExpenses = expensesData.reduce((sum, expense) => sum + (expense.amountPaid || 0), 0);
  const totalPurchases = purchasesData.reduce((sum, purchase) => sum + (purchase.amountPaid || 0), 0);
  const netProfit = totalSales - (totalExpenses + totalPurchases);

  if (loading) {
    return <p>Loading data...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
      <h1>Profit and Loss Statement</h1>
      <table style={{ border: '1px solid black', width: '100%', textAlign: 'left' }}>
        <thead>
          <tr>
            <th style={{ padding: '8px' }}>Category</th>
            <th style={{ padding: '8px' }}>Amount ($)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: '8px' }}>Total Sales</td>
            <td style={{ padding: '8px' }}>{totalSales.toFixed(2)}</td>
          </tr>
          <tr>
            <td style={{ padding: '8px' }}>Total Expenses</td>
            <td style={{ padding: '8px' }}>-{totalExpenses.toFixed(2)}</td>
          </tr>
          <tr>
            <td style={{ padding: '8px' }}>Total Purchases</td>
            <td style={{ padding: '8px' }}>-{totalPurchases.toFixed(2)}</td>
          </tr>
          <tr>
            <td style={{ padding: '8px', fontWeight: 'bold' }}>Net Profit</td>
            <td style={{ padding: '8px', fontWeight: 'bold' }}>{netProfit.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ProfitAndLoss;
