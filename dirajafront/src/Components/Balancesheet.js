import React, { useState, useEffect } from "react";
import "../Styles/Balancesheet.css";

const BalanceSheet = () => {
  const [cashBreakdown, setCashBreakdown] = useState([
    { subcategory: "Cash at Hand", display: "ksh. 0.00" },
    { subcategory: "Cash in Bank", display: "ksh. 0.00" },
    { subcategory: "Cash in Mpesa", display: "ksh. 0.00" },
  ]);

  
  const [shopStocks, setShopStocks] = useState([]);
  const [error, setError] = useState(null);

  const [otherAssets, setOtherAssets] = useState([]);
  //   { name: "Accounts Receivable", amount: 473284.65 },
  // ]);

  const [liabilities, setLiabilities] = useState([
    { name: "Loans", amount: 0 },
  ]);

  const [equity, setEquity] = useState([
    { name: "Owner's Equity", amount: 0 },
  ]);

  const [categoryType, setCategoryType] = useState("Assets");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCashSubcategory, setSelectedCashSubcategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newAmount, setNewAmount] = useState("");

  // Fetch the cash breakdown data
  const fetchCashBreakdown = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.error("Access token not found in local storage");
        return;
      }

      const response = await fetch("/api/diraja/get_payment_totals", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch cash breakdown data");
      }

      const data = await response.json();

      setCashBreakdown([
        { subcategory: "Cash at Hand", display: data.cash },
        { subcategory: "Cash in Bank", display: data.bank },
        { subcategory: "Cash in Mpesa", display: data.mpesa },
      ]);
    } catch (error) {
      console.error("Error fetching cash breakdown data:", error);
      setError(error.message);
    }
  };

  // Fetch the shop stock values
  const fetchShopStocks = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.error("Access token not found in local storage");
        return;
      }

      const response = await fetch("/api/diraja/shopstock/value", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch shop stock data");
      }

      const data = await response.json();

      setShopStocks(
        data.shop_stock_values
          ? Object.values(data.shop_stock_values).map((shop) => ({
              shopName: shop.shop_name,
              stockValue: shop.total_stock_value,
            }))
          : []
      );
    } catch (error) {
      console.error("Error fetching shop stock data:", error);
      setError(error.message);
    }
  };

  const fetchAccountsReceivable = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.error("Access token not found in local storage");
        return;
      }
  
      const response = await fetch("/api/diraja/accountsreceivable", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        throw new Error("Failed to fetch accounts receivable data");
      }
  
      const data = await response.json();

      console.log("Accounts Receivable Response:", data); // Debugging log
  
      const amount = parseFloat(data.amount) || 0; // Ensure amount is a valid number
  
      setOtherAssets((prevAssets) => [
        ...prevAssets.filter((asset) => asset.name !== "Accounts Receivable"),
        { name: "Accounts Receivable", amount },
      ]);
    } catch (error) {
      console.error("Error fetching accounts receivable data:", error);
    }
  };


  const fetchAccountsPayable = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.error("Access token not found in local storage");
        return;
      }
  
      const response = await fetch("/api/diraja/accountspayable", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        throw new Error("Failed to fetch accounts payable data");
      }
  
      const data = await response.json();
  
      console.log("Accounts Payable Response:", data); // Debugging log
  
      const amount = parseFloat(data.amount) || 0; // Ensure amount is a valid number
  
      setLiabilities((prevLiabilities) => [
        ...prevLiabilities.filter((liability) => liability.name !== "Accounts Payable"),
        { name: "Accounts Payable", amount },
      ]);
    } catch (error) {
      console.error("Error fetching accounts payable data:", error);
    }
  };
  
  
  

  useEffect(() => {
    fetchCashBreakdown();
    fetchShopStocks();
    fetchAccountsReceivable();
    fetchAccountsPayable();
  }, []);

  // Add new category to the respective section
  const handleAddCategory = (e) => {
    e.preventDefault();

    const newEntry = {
      name: selectedCategory || newCategory,
      amount: parseFloat(newAmount),
    };

    if (categoryType === "Assets") {
      if (selectedCategory === "Cash") {
        if (selectedCashSubcategory) {
          setCashBreakdown(
            cashBreakdown.map((cash) =>
              cash.subcategory === selectedCashSubcategory
                ? { ...cash, display: `ksh. ${parseFloat(cash.display.replace(/[^0-9.]/g, "")).toFixed(2) + parseFloat(newAmount).toFixed(2)}` }
                : cash
            )
          );
        }
      } else if (selectedCategory === "Stock") {
        const existingShop = shopStocks.find(
          (shop) => shop.shopName === newCategory
        );
        if (existingShop) {
          setShopStocks(
            shopStocks.map((shop) =>
              shop.shopName === newCategory
                ? {
                    ...shop,
                    stockValue: shop.stockValue + parseFloat(newAmount),
                  }
                : shop
            )
          );
        } else {
          setShopStocks([
            ...shopStocks,
            { shopName: newCategory, stockValue: parseFloat(newAmount) },
          ]);
        }
      } else {
        const existingCategory = otherAssets.find(
          (item) => item.name === newEntry.name
        );
        if (existingCategory) {
          setOtherAssets(
            otherAssets.map((item) =>
              item.name === newEntry.name
                ? { ...item, amount: item.amount + newEntry.amount }
                : item
            )
          );
        } else {
          setOtherAssets([...otherAssets, newEntry]);
        }
      }
    } else if (categoryType === "Liabilities") {
      const existingCategory = liabilities.find(
        (item) => item.name === newEntry.name
      );
      if (existingCategory) {
        setLiabilities(
          liabilities.map((item) =>
            item.name === newEntry.name
              ? { ...item, amount: item.amount + newEntry.amount }
              : item
          )
        );
      } else {
        setLiabilities([...liabilities, newEntry]);
      }
    } else if (categoryType === "Equity") {
      const existingCategory = equity.find(
        (item) => item.name === newEntry.name
      );
      if (existingCategory) {
        setEquity(
          equity.map((item) =>
            item.name === newEntry.name
              ? { ...item, amount: item.amount + newEntry.amount }
              : item
          )
        );
      } else {
        setEquity([...equity, newEntry]);
      }
    }

    setSelectedCategory("");
    setNewCategory("");
    setNewAmount("");
    setSelectedCashSubcategory("");
  };

  // Clear all data and reset
  const handleClearAll = () => {
    setCashBreakdown([
      { subcategory: "Cash at Hand", display: "ksh. 0.00" },
      { subcategory: "Cash in Bank", display: "ksh. 0.00" },
      { subcategory: "Cash in Mpesa", display: "ksh. 0.00" },
    ]);
    setShopStocks([]);
    setOtherAssets([{ name: "Accounts Receivable", amount: 473284.65 }]);
    setLiabilities([
      { name: "Accounts Payable", amount: 1091686.17 },
      { name: "Loans", amount: 0 },
    ]);
    setEquity([{ name: "Owner's Equity", amount: 0 }]);
    setCategoryType("Assets");
    setSelectedCategory("");
    setSelectedCashSubcategory("");
    setNewCategory("");
    setNewAmount("");
  };

  // Get dropdown options based on category type
  const getDropdownOptions = () => {
    if (categoryType === "Assets") {
      return ["Cash", "Stock", ...otherAssets.map((item) => item.name)];
    } else if (categoryType === "Liabilities") {
      return liabilities.map((item) => item.name);
    } else if (categoryType === "Equity") {
      return equity.map((item) => item.name);
    }
    return [];
  };

  // Calculate totals
  const totalCash = cashBreakdown.reduce((acc, cash) => {
    // Ensure `display` exists and clean the number format
    const amount = parseFloat(
      cash.display?.replace(/[^0-9.]/g, "") || "0"
    );
    return acc + amount;
  }, 0);
  

  const totalShopStock = shopStocks.reduce(
    (acc, shop) => acc + (shop.stockValue || 0),
    0
  );
  
  const totalOtherAssets = otherAssets.reduce(
    (acc, item) => acc + (item.amount || 0),
    0
  );

  const totalAssets = totalCash + totalShopStock + totalOtherAssets;

  

  const totalLiabilities = liabilities.reduce((acc, item) => acc + item.amount, 0);
  const totalEquity = equity.reduce((acc, item) => acc + item.amount, 0);

  return (
    <div className="balance-sheet">
      <div className="container">
        <h1 className="title">Balance Sheet</h1>

        {/* Form for adding categories */}
        <form onSubmit={handleAddCategory}>
          <select
            value={categoryType}
            onChange={(e) => setCategoryType(e.target.value)}
          >
            <option value="Assets">Assets</option>
            <option value="Liabilities">Liabilities</option>
            <option value="Equity">Equity</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Select Category</option>
            {getDropdownOptions().map((option, idx) => (
              <option key={idx} value={option}>
                {option}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="New category"
          />
          <input
            type="number"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            placeholder="Amount"
          />

          <button type="submit">Add Category</button>
        </form>

        <button onClick={handleClearAll}>Clear All</button>

        {/* Rest of the balance sheet content */}
        <div className="categories">
          <h2>Assets</h2>
          <div>
            <h3>Cash Breakdown</h3>
            <ul>
              {cashBreakdown.map((cash, index) => (
                <li key={index}>
                  {cash.subcategory}: {cash.display}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3>Shop Stocks</h3>
            {shopStocks.length > 0 ? (
              <ul>
                {shopStocks.map((shop, index) => (
                  <li key={index}>
                    {shop.shopName}: ksh {shop.stockValue.toLocaleString()}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No shop stock data available</p>
            )}
          </div>

          <div>
            <h3>Other Assets</h3>
            <ul>
              {otherAssets.map((item, index) => (
                <li key={index}>
                  {item.name}: ksh {}
                  {item.amount !== undefined
                    ? item.amount.toLocaleString()
                    : "0.00"}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="categories">
          <h2>Liabilities</h2>
          <ul>
            {liabilities.map((item, index) => (
              <li key={index}>
                {item.name}: ksh {""}
                {item.amount !== undefined ? item.amount.toLocaleString() : "0.00"}
              </li>
            ))}
          </ul>
        </div>

        <div className="categories">
          <h2>Equity</h2>
          <ul>
            {equity.map((item, index) => (
              <li key={index}>
                {item.name}: ksh {item.amount.toLocaleString()}
              </li>
            ))}
          </ul>
        </div>

        <div className="totals">
          <h2>Totals</h2>
          <p>Total Assets: ksh {totalAssets.toLocaleString()}</p>
          <p>Total Liabilities: ksh {totalLiabilities.toLocaleString()}</p>
          <p>Total Equity: ksh {totalEquity.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default BalanceSheet;
