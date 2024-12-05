import React, { useState, useEffect } from "react";


const Assets = () => {
  const [cashBreakdown, setCashBreakdown] = useState([
    { subcategory: "Cash at Hand", display: "ksh. 0.00" },
    { subcategory: "Cash in Bank", display: "ksh. 0.00" },
    { subcategory: "Cash in Mpesa", display: "ksh. 0.00" },
  ]);

  const [shopStocks, setShopStocks] = useState([]);
  const [otherAssets, setOtherAssets] = useState([]);
  const [error, setError] = useState(null);

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
  
      // Remove the 'ksh. ' prefix and convert to a float
      setCashBreakdown([
        {
          subcategory: "Cash at Hand",
          display: `ksh. ${parseFloat(data.cash.replace(/[^0-9.-]+/g, "")).toFixed(2)}`,
        },
        {
          subcategory: "Cash in Bank",
          display: `ksh. ${parseFloat(data.bank.replace(/[^0-9.-]+/g, "")).toFixed(2)}`,
        },
        {
          subcategory: "Cash in Mpesa",
          display: `ksh. ${parseFloat(data.mpesa.replace(/[^0-9.-]+/g, "")).toFixed(2)}`,
        },
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

  // Fetch other assets like accounts receivable
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
      const amount = parseFloat(data.amount) || 0;

      setOtherAssets((prevAssets) => [
        ...prevAssets.filter((asset) => asset.name !== "Accounts Receivable"),
        { name: "Accounts Receivable", amount },
      ]);
    } catch (error) {
      console.error("Error fetching accounts receivable data:", error);
    }
  };

  useEffect(() => {
    fetchCashBreakdown();
    fetchShopStocks();
    fetchAccountsReceivable();
  }, []);

  return (
    <div className="assets">
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
              {item.name}: ksh {item.amount.toLocaleString()}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Assets;
