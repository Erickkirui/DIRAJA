import React, { useState } from "react";

const BalanceSheet = () => {
  const [cashBreakdown, setCashBreakdown] = useState([
    { subcategory: "Cash at Hand", amount: 1331372.25 },
    { subcategory: "Cash in Bank", amount: 34900 },
    { subcategory: "Cash in Mpesa", amount: -1539036.18 },
  ]);

  const [shopStocks, setShopStocks] = useState([
    { shopName: "Githurai 44", stockValue: -97109.64 },
    { shopName: "Mirema", stockValue: 314299.97 },
    { shopName: "Office Admin", stockValue: 122842.29 },
    { shopName: "TRM", stockValue: -67060.45 },
    { shopName: "Zimmerman", stockValue: 573868.38 },
    { shopName: "Lummba Drive", stockValue: -46190.47 },
  ]);

  const [otherAssets, setOtherAssets] = useState([
    { name: "Accounts Receivable", amount: 473284.65 },
  ]);

  const [liabilities, setLiabilities] = useState([
    { name: "Accounts Payable", amount: 1091686.17 },
    { name: "Loans", amount: 0 },
  ]);

  const [equity, setEquity] = useState([
    { name: "Owner's Equity", amount: 0 },
  ]);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [newAmount, setNewAmount] = useState(0);
  const [categoryType, setCategoryType] = useState("Assets");
  const [newCategory, setNewCategory] = useState("");
  const [selectedCashSubcategory, setSelectedCashSubcategory] = useState("");

  const totalCash = cashBreakdown.reduce((acc, cash) => acc + cash.amount, 0);
  const totalShopStock = shopStocks.reduce((acc, shop) => acc + shop.stockValue, 0);
  const totalAssets =
    totalCash +
    totalShopStock +
    otherAssets.reduce((acc, item) => acc + item.amount, 0);
  const totalLiabilities = liabilities.reduce((acc, item) => acc + item.amount, 0);
  const totalEquity = equity.reduce((acc, item) => acc + item.amount, 0);

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
                ? { ...cash, amount: cash.amount + parseFloat(newAmount) }
                : cash
            )
          );
        }
      } else if (selectedCategory === "Stock") {
        setShopStocks([
          ...shopStocks,
          { shopName: newCategory, stockValue: parseFloat(newAmount) },
        ]);
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
    setNewAmount(0);
    setSelectedCashSubcategory("");
  };
  

  const handleClearAll = () => {
    // Reset all categories and subcategories
    setCashBreakdown([
      { subcategory: "Cash at Hand", amount: 1331372.25 },
      { subcategory: "Cash in Bank", amount: 34900 },
      { subcategory: "Cash in Mpesa", amount: -1539036.18 },
    ]);
    setShopStocks([
      { shopName: "Githurai 44", stockValue: -97109.64 },
      { shopName: "Mirema", stockValue: 314299.97 },
      { shopName: "Office Admin", stockValue: 122842.29 },
      { shopName: "TRM", stockValue: -67060.45 },
      { shopName: "Zimmerman", stockValue: 573868.38 },
      { shopName: "Lummba Drive", stockValue: -46190.47 },
    ]);
    setOtherAssets([
      { name: "Accounts Receivable", amount: 473284.65 },
    ]);
    setLiabilities([
      { name: "Accounts Payable", amount: 1091686.17 },
      { name: "Loans", amount: 0 },
    ]);
    setEquity([
      { name: "Owner's Equity", amount: 0 },
    ]);
    
    // Reset all form fields
    setSelectedCategory("");
    setNewCategory("");
    setNewAmount(0);
    setSelectedCashSubcategory("");
  };

  const getDropdownOptions = () => {
    if (categoryType === "Assets") {
      const assetCategories = [
        "Cash", 
        "Stock", 
        ...otherAssets.map((item) => item.name)
      ];
      return assetCategories;
    } else if (categoryType === "Liabilities") {
      return liabilities.map((item) => item.name);
    } else if (categoryType === "Equity") {
      return equity.map((item) => item.name);
    }
    return [];
  };

  return (
    <div className="balance-sheet">
      <div className="container">
        <h1 className="title">Balance Sheet</h1>

        {/* Form for adding a category */}
        <form onSubmit={handleAddCategory} className="add-category-form">
          <select
            value={categoryType}
            onChange={(e) => setCategoryType(e.target.value)}
            className="category-type-dropdown"
          >
            <option value="Assets">Assets</option>
            <option value="Liabilities">Liabilities</option>
            <option value="Equity">Equity</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-dropdown"
          >
            <option value="">Select Category</option>
            {getDropdownOptions().map((category, index) => (
              <option key={index} value={category}>
                {category}
              </option>
            ))}
          </select>

          {selectedCategory === "Cash" && (
            <select
              value={selectedCashSubcategory}
              onChange={(e) => setSelectedCashSubcategory(e.target.value)}
              className="subcategory-dropdown"
            >
              <option value="">Select Cash Subcategory</option>
              <option value="Cash at Hand">Cash at Hand</option>
              <option value="Cash in Bank">Cash in Bank</option>
              <option value="Cash in Mpesa">Cash in Mpesa</option>
            </select>
          )}

          <input
            type="text"
            placeholder="New Category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="new-category-input"
          />
          <input
            type="number"
            placeholder="Amount"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            className="amount-input"
          />
          <button type="submit" className="add-category-button">
            Add Category
          </button>
        </form>

        <button onClick={handleClearAll} className="clear-all-button">
          Clear All
        </button>

        {/* Display categories and amounts */}
        <div className="categories">
          <h2>Assets</h2>
          <div className="section">
            <h3>Cash Breakdown</h3>
            <ul>
              {cashBreakdown.map((cash, index) => (
                <li key={index} className="item">
                  <span>{cash.subcategory}</span>
                  <span>ksh {cash.amount.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="section">
            <h3>Shop Stocks</h3>
            <ul>
              {shopStocks.map((shop, index) => (
                <li key={index} className="item">
                  <span>- {shop.shopName}</span>
                  <span>ksh {shop.stockValue.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="section">
            <h3>Other Assets</h3>
            <ul>
              {otherAssets.map((asset, index) => (
                <li key={index} className="item">
                  <span>- {asset.name}</span>
                  <span>ksh {asset.amount.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Liabilities */}
        <div className="section">
          <h2>Liabilities</h2>
          <ul>
            {liabilities.map((item, index) => (
              <li key={index} className="item">
                <span>{item.name}</span>
                <span>ksh {item.amount.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Equity */}
        <div className="section">
          <h2>Equity</h2>
          <ul>
            {equity.map((item, index) => (
              <li key={index} className="item">
                <span>{item.name}</span>
                <span>ksh {item.amount.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BalanceSheet;
