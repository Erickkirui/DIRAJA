import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import CapturePayment from "./CapturePayment"; // Import CapturePayment component

const SingleSaleShop = () => {
  const { shopId, salesId } = useParams();
  const [sale, setSale] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSaleDetails = async () => {
    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        setError("Missing authentication token.");
        setLoading(false);
        return;
      }

      if (!shopId || !salesId) {
        setError("Invalid shop ID or sale ID.");
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `/api/diraja/sale/${shopId}/${salesId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (response.data && response.data.sale) {
        const formattedSale = {
          ...response.data.sale,
          created_at: new Date(response.data.sale.created_at).toLocaleString(),
          payment_methods: response.data.sale.payment_methods.map((pm) => ({
            ...pm,
            created_at: new Date(pm.created_at).toLocaleString(),
          })),
          sold_items: response.data.sale.sold_items || [],
        };

        setSale(formattedSale);
      } else {
        setError("Sale details not found.");
      }
    } catch (error) {
      console.error("Error fetching sale details:", error);
      setError("Could not fetch sale details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaleDetails();
  }, [shopId, salesId]);

  if (loading) return <p>Loading sale details...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div className="sale-details">
      <h2>Sale Details</h2>
      {sale ? (
        <>
          <div className="sale-top">
            <p><strong>Sale Status:</strong> {sale.status}</p>
            <p><strong>Sale Date:</strong> {sale.created_at}</p>
            <p><strong>Total Amount Paid:</strong> Ksh {sale.total_amount_paid}</p>
            <p><strong>Amount due:</strong> Ksh {sale.balance}</p>
          </div>

          <div className="sale-details-container">
            <h3>Customer</h3>
            <div className="sale-section">
              <p>Name: {sale.customer_name || "N/A"}</p>
              <p>Number: {sale.customer_number || "N/A"}</p>
            </div>
          </div>

          <div className="sale-details-container">
            <h3>Item Details</h3>
            {sale.sold_items.length > 0 ? (
              sale.sold_items.map((item, index) => (
                <div key={index} className="sale-section">
                  <p><strong>Item Name:</strong> {item.item_name}</p>
                  <p><strong>Quantity:</strong> {item.quantity} {item.metric}</p>
                  <p><strong>Unit Price:</strong> Ksh {item.unit_price}</p>
                  <p><strong>Total Price:</strong> Ksh {item.total_price}</p>
                </div>
              ))
            ) : (
              <p>No sold items found for this sale.</p>
            )}
          </div>

          <h3>Payment Made</h3>
          <ul>
            {sale.payment_methods.map((payment, index) => (
              <li key={index}>
                <p><strong>Method:</strong> {payment.payment_method}</p>
                {payment.payment_method !== "not payed" && (
                  <>
                    <p><strong>Amount:</strong> Ksh {payment.amount_paid}</p>
                    <p><strong>Payment Date:</strong> {payment.created_at}</p>
                  </>
                )}
              </li>
            ))}
          </ul>

          {/* Integrating CapturePayment Component */}
          <CapturePayment saleId={salesId} onPaymentSuccess={fetchSaleDetails} />
        </>
      ) : (
        <p>No sale details available.</p>
      )}
    </div>
  );
};

export default SingleSaleShop;
