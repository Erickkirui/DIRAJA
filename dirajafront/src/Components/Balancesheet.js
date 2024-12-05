import React, { useState, useEffect } from "react";
import AddCategoryForm from "./Balancesheet/AddCategoryForm";
import Assets from "./Balancesheet/Assets";
import Liabilities from "./Balancesheet/Liabilities";
import "../Styles/Balancesheet.css";

const BalanceSheet = () => {
  const [cashBreakdown, setCashBreakdown] = useState([
    { subcategory: "Cash at Hand", amount: 0 },
    { subcategory: "Cash in Bank", amount: 0 },
    { subcategory: "Cash in Mpesa", amount: 0 },
  ]);
  const [shopStocks, setShopStocks] = useState([]);
  const [otherAssets, setOtherAssets] = useState([]);
  const [liabilities, setLiabilities] = useState([{ name: "Loans", amount: 0 }]);
  const [equity, setEquity] = useState([{ name: "Owner's Equity", amount: 0 }]);

  const [categoryType, setCategoryType] = useState("Assets");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCashSubcategory, setSelectedCashSubcategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newAmount, setNewAmount] = useState("");

  // Fetch data from the endpoint
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/balancesheet/assets"); // Replace with your API endpoint
        if (!response.ok) {
          throw new Error("Failed to fetch assets data");
        }
        const data = await response.json();

        // Assuming the data structure matches the expected state properties
        setCashBreakdown(data.cashBreakdown || []);
        setShopStocks(data.shopStocks || []);
        setOtherAssets(data.otherAssets || []);
        setLiabilities(data.liabilities || []);
        setEquity(data.equity || []);
      } catch (error) {
        console.error("Error fetching assets data:", error);
      }
    };

    fetchData();
  }, []);

  const handleAddCategory = (e) => {
    e.preventDefault();

    if (!newCategory.trim() || !newAmount || newAmount <= 0) {
      alert("Please enter a valid category name and amount.");
      return;
    }

    if (categoryType === "Assets" && selectedCategory === "Cash" && !selectedCashSubcategory) {
      alert("Please select a Cash subcategory.");
      return;
    }

    if (categoryType === "Assets") {
      if (selectedCategory === "Cash") {
        setCashBreakdown((prev) =>
          prev.map((item) =>
            item.subcategory === selectedCashSubcategory
              ? { ...item, amount: item.amount + parseFloat(newAmount) }
              : item
          )
        );
      } else if (selectedCategory === "Stock") {
        setShopStocks((prev) => [...prev, { name: newCategory, amount: parseFloat(newAmount) }]);
      } else {
        setOtherAssets((prev) => [...prev, { name: newCategory, amount: parseFloat(newAmount) }]);
      }
    } else if (categoryType === "Liabilities") {
      setLiabilities((prev) => [...prev, { name: newCategory, amount: parseFloat(newAmount) }]);
    } else if (categoryType === "Equity") {
      setEquity((prev) => [...prev, { name: newCategory, amount: parseFloat(newAmount) }]);
    }

    setNewCategory("");
    setNewAmount("");
    setSelectedCategory("");
    setSelectedCashSubcategory("");
  };

  const handleClearAll = () => {
    setCategoryType("Assets");
    setSelectedCategory("");
    setSelectedCashSubcategory("");
    setNewCategory("");
    setNewAmount("");
    setCashBreakdown([
      { subcategory: "Cash at Hand", amount: 0 },
      { subcategory: "Cash in Bank", amount: 0 },
      { subcategory: "Cash in Mpesa", amount: 0 },
    ]);
    setShopStocks([]);
    setOtherAssets([]);
    setLiabilities([{ name: "Loans", amount: 0 }]);
    setEquity([{ name: "Owner's Equity", amount: 0 }]);
  };

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

  const calculateTotal = (data) =>
    data.reduce((total, item) => total + (item.amount || 0), 0);

  const assetsTotal =
    calculateTotal(cashBreakdown) + calculateTotal(shopStocks) + calculateTotal(otherAssets);
  const liabilitiesTotal = calculateTotal(liabilities);
  const equityTotal = calculateTotal(equity);

  return (
    <div className="balance-sheet">
      <div className="container">
        <h1 className="title">Balance Sheet</h1>
        <AddCategoryForm
          categoryType={categoryType}
          selectedCategory={selectedCategory}
          selectedCashSubcategory={selectedCashSubcategory}
          newCategory={newCategory}
          newAmount={newAmount}
          handleAddCategory={handleAddCategory}
          handleClearAll={handleClearAll}
          setCategoryType={setCategoryType}
          setSelectedCategory={setSelectedCategory}
          setSelectedCashSubcategory={setSelectedCashSubcategory}
          setNewCategory={setNewCategory}
          setNewAmount={setNewAmount}
          getDropdownOptions={getDropdownOptions}
        />
        <Assets
          cashBreakdown={cashBreakdown}
          shopStocks={shopStocks}
          otherAssets={otherAssets}
        />
        <Liabilities liabilities={liabilities} />
        <div className="totals">
          <h2>Totals</h2>
          <p>Assets: ksh. {assetsTotal.toFixed(2)}</p>
          <p>Liabilities: ksh. {liabilitiesTotal.toFixed(2)}</p>
          <p>Equity: ksh. {equityTotal.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

export default BalanceSheet;
