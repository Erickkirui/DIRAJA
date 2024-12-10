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

      const salesResponse = await fetch(
        `/api/diraja/allsales?start_date=${startDate}&end_date=${endDate}`,
        { headers }
      );
      const purchasesResponse = await fetch(
        `/api/diraja/alltransfers?start_date=${startDate}&end_date=${endDate}`,
        { headers }
      );
      const expensesResponse = await fetch(
        `/api/diraja/allexpenses?start_date=${startDate}&end_date=${endDate}`,
        { headers }
      );

      if (!salesResponse.ok || !purchasesResponse.ok || !expensesResponse.ok) {
        throw new Error("Failed to fetch data. Please check your API.");
      }

      const sales = await salesResponse.json();
      const purchases = await purchasesResponse.json();
      const expenses = await expensesResponse.json();

      console.log("Sales data:", sales);
      console.log("Purchases data:", purchases);
      console.log("Expenses data:", expenses);

      const profitAndLossData = calculateProfitAndLoss(sales, purchases, expenses);
      console.log("Processed Profit and Loss Data:", profitAndLossData);

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
    sales.forEach((sale) => {
      const { shopname, item_name, amount_paid } = sale;
      if (!shopname || !item_name || !amount_paid) {
        console.warn("Skipping invalid sale record:", sale);
        return;
      }

      if (!salesByShop[shopname]) salesByShop[shopname] = {};
      if (!salesByShop[shopname][item_name]) salesByShop[shopname][item_name] = 0;
      salesByShop[shopname][item_name] += amount_paid;
      totalSales += amount_paid;
    });

    const purchasesByShop = {};
    purchases.forEach((purchase) => {
      const { shopname, itemname, amountPaid } = purchase;

      const shop = shopname || "Unknown Shop";

      if (!purchasesByShop[shop]) purchasesByShop[shop] = {};
      if (!purchasesByShop[shop][itemname]) purchasesByShop[shop][itemname] = 0;
      purchasesByShop[shop][itemname] += amountPaid;

      totalPurchases += amountPaid;
    });

    const expensesDetails = [];
    expenses.forEach((expense) => {
      const { description, amountPaid } = expense;
      if (!amountPaid) {
        console.warn("Skipping invalid expense record:", expense);
        return;
      }

      expensesDetails.push({ name: description || "Miscellaneous", amountPaid });
      totalExpenses += amountPaid;
    });

    const grossProfit = totalSales - totalPurchases;
    const netProfit = grossProfit - totalExpenses;

    return {
      salesByShop,
      purchasesByShop,
      expensesDetails,
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
          <p><strong>Total Income:</strong> {profitAndLoss.totalSales.toFixed(2)}</p>

          <h2>Cost of Goods Sold</h2>
          <h3>Purchases</h3>
          {Object.entries(profitAndLoss.purchasesByShop).map(([shop, items]) => (
            <div key={shop}>
              <h4>Shop: {shop}</h4>
              {Object.entries(items).map(([item, amount]) => (
                <p key={item}>
                  {item}: {amount.toFixed(2)}
                </p>
              ))}
            </div>
          ))}
          <p><strong>Total Purchases:</strong> {profitAndLoss.totalPurchases.toFixed(2)}</p>
          <p><strong>Gross Profit:</strong> {profitAndLoss.grossProfit.toFixed(2)}</p>

          <h2>Expenses</h2>
          {profitAndLoss.expensesDetails.map((expense, index) => (
            <p key={index}>
              {expense.name}: {expense.amountPaid.toFixed(2)}
            </p>
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
