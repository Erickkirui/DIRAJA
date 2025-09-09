import React, { useEffect, useState } from "react";
import axios from "axios";

const ShopNameDisplay = () => {
  const [shopName, setShopName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const shopId = localStorage.getItem("shop_id");
    const access_token = localStorage.getItem("access_token");

    if (!shopId) {
      setError("No shop assigned.");
      return;
    }

    if (!access_token) {
      setError("Authentication required.");
      return;
    }

    const fetchShopName = async () => {
      try {
        const response = await axios.get("api/diraja/allshops", {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        });

        const shops = response.data;
        const shop = shops.find((s) => s.shop_id === parseInt(shopId));

        if (shop) {
          setShopName(shop.shopname);

          // ✅ Update localStorage with report_status (as a string)
          localStorage.setItem("report_status", shop.report_status ? "true" : "false");
        } else {
          setError("Shop not found.");
        }
      } catch (err) {
        setError("Failed to fetch shop name.");
      }
    };

    fetchShopName();
  }, []);

  return (
    <div className="shop-name">
      {error ? <p className="error-text">{error}</p> : <p>{shopName}</p>}
    </div>
  );
};

export default ShopNameDisplay;
