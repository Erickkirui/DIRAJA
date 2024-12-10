import React, { useState } from "react";

const ProfitAndLoss = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [profitAndLoss, setProfitAndLoss] = useState(null);

  const fetchData = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      alert("Access token is missing. Please log in.");
      return;
    }

    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      // Fetch sales, purchases, and expenses data
      const [salesResponse, purchasesResponse, expensesResponse] = await Promise.all([
        fetch(`/api/diraja/allsales?start_date=${startDate}&end_date=${endDate}`, { headers }),
        fetch(`/api/diraja/alltransfers?start_date=${startDate}&end_date=${endDate}`, { headers }),
        fetch(`/api/diraja/allexpenses?start_date=${startDate}&end_date=${endDate}`, { headers }),
      ]);

      if (!salesResponse.ok || !purchasesResponse.ok || !expensesResponse.ok) {
        throw new Error("Failed to fetch data. Please check your API.");
      }

      const [sales, purchases, expenses] = await Promise.all([
        salesResponse.json(),
        purchasesResponse.json(),
        expensesResponse.json(),
      ]);

      console.log("Sales data:", sales);
      console.log("Purchases data:", purchases);
      console.log("Expenses data:", expenses);

      const profitAndLossData = calculateProfitAndLoss(sales, purchases, expenses);
      setProfitAndLoss(profitAndLossData);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("An error occurred while generating the report. Please try again.");
    }
  };

  const calculateProfitAndLoss = (sales, purchases, expenses) => {
    let totalSales = 0;
    let totalPurchases = 0;
    let totalExpenses = 0;

    const salesByShop = {};
    const purchasesByShop = {};
    const expensesByShop = {};

    // Filter sales by date and group by shop
    sales.filter(sale => {
      const saleDate = new Date(sale.created_at);
      return saleDate >= new Date(startDate) && saleDate <= new Date(endDate);
    }).forEach((sale) => {
      const { shopname = "Unknown Shop", item_name, amount_paid } = sale;
      if (!amount_paid || !item_name) return;

      if (!salesByShop[shopname]) salesByShop[shopname] = {};
      if (!salesByShop[shopname][item_name]) salesByShop[shopname][item_name] = 0;

      salesByShop[shopname][item_name] += amount_paid;
      totalSales += amount_paid;
    });

    // Filter purchases by date and group by shop
    purchases.filter(purchase => {
      const purchaseDate = new Date(purchase.created_at);
      return purchaseDate >= new Date(startDate) && purchaseDate <= new Date(endDate);
    }).forEach((purchase) => {
      const { shop_name = "Unknown Shop", itemname, amountPaid } = purchase;
      if (!amountPaid || !itemname) return;

      if (!purchasesByShop[shop_name]) purchasesByShop[shop_name] = {};
      if (!purchasesByShop[shop_name][itemname]) purchasesByShop[shop_name][itemname] = 0;

      purchasesByShop[shop_name][itemname] += amountPaid;
      totalPurchases += amountPaid;
    });

    // Filter expenses by date and group by shop
    expenses.filter(expense => {
      const expenseDate = new Date(expense.created_at);
      return expenseDate >= new Date(startDate) && expenseDate <= new Date(endDate);
    }).forEach((expense) => {
      const { shop_name = "Unknown Shop", description, amountPaid } = expense;
      if (!amountPaid) return;

      if (!expensesByShop[shop_name]) expensesByShop[shop_name] = [];
      expensesByShop[shop_name].push({
        description: description || "Miscellaneous",
        amountPaid,
      });
      totalExpenses += amountPaid;
    });

    const grossProfit = totalSales - totalPurchases;
    const netProfit = grossProfit - totalExpenses;

    return {
      salesByShop,
      purchasesByShop,
      expensesByShop,
      totalSales,
      totalPurchases,
      totalExpenses,
      grossProfit,
      netProfit,
    };
  };

  return (
    <div>
      <h1>Profit and Loss Statement</h1>
      <div>
        <label>
          Start Date:
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label>
          End Date:
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>
        <button onClick={fetchData}>Generate</button>
      </div>
      {profitAndLoss && (
        <div>
          <h2>Income</h2>
          <h3>Sales</h3>
          {Object.entries(profitAndLoss.salesByShop).map(([shop, items]) => (
            <div key={shop}>
              <h4>Shop: {shop}</h4>
              {Object.entries(items).map(([item, amount]) => (
                <p key={item}>
                  {item}: {amount.toFixed(2)}
                </p>
              ))}
            </div>
          ))}
          <p><strong>Total Sales:</strong> {profitAndLoss.totalSales.toFixed(2)}</p>

          <h2>Cost of Goods Sold</h2>
          <h3>Purchases</h3>
          {Object.entries(profitAndLoss.purchasesByShop).map(([shop, items]) => (
            <div key={shop}>
              <h4>Shop: {shop}</h4>
              {Object.entries(items).map(([item, cost]) => (
                <p key={item}>
                  {item}: {cost.toFixed(2)}
                </p>
              ))}
            </div>
          ))}
          <p><strong>Total Purchases:</strong> {profitAndLoss.totalPurchases.toFixed(2)}</p>
          <p><strong>Gross Profit:</strong> {profitAndLoss.grossProfit.toFixed(2)}</p>

          <h2>Expenses</h2>
          {Object.entries(profitAndLoss.expensesByShop).map(([shop, expenses]) => (
            <div key={shop}>
              <h4>Shop: {shop}</h4>
              {expenses.map((expense, index) => (
                <p key={index}>
                  {expense.description}: {expense.amountPaid.toFixed(2)}
                </p>
              ))}
            </div>
          ))}
          <p><strong>Total Expenses:</strong> {profitAndLoss.totalExpenses.toFixed(2)}</p>

          <h2>Net Profit</h2>
          <p><strong>Net Ordinary Income:</strong> {profitAndLoss.grossProfit.toFixed(2)}</p>
          <p><strong>Profit of the Year:</strong> {profitAndLoss.netProfit.toFixed(2)}</p>
        </div>
      )}
    </div>
  );
};

export default ProfitAndLoss;
