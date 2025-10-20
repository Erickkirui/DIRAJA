import React, { useState } from "react";
import axios from "axios";

const CapturePayment = ({ saleId, onPaymentSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [transactionCode, setTransactionCode] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]); // Default to today’s date
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    if (!paymentMethod || !amountPaid || !paymentDate) {
      setError("Payment method, amount, and date are required.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        setError("Authentication required. Please log in.");
        setLoading(false);
        return;
      }

      const response = await axios.post(
        `/api/diraja/sales/${saleId}/capture-payment`,
        {
          payment_method: paymentMethod,
          amount_paid: parseFloat(amountPaid),
          transaction_code: transactionCode || "NONE", // Default transaction code
          created_at: paymentDate, // Send selected date
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (response.status === 200) {
        setSuccessMessage("Payment recorded successfully!");
        setPaymentMethod("");
        setAmountPaid("");
        setTransactionCode("");
        setPaymentDate(new Date().toISOString().split("T")[0]); // Reset to today’s date

        // Refresh sale details in parent component
        if (onPaymentSuccess) {
          onPaymentSuccess();
        }
      }
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to process payment. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div >
      <h3>Capture Payment</h3>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}
      
      <form onSubmit={handlePaymentSubmit} className="payment-method">
        <label>Payment Method:</label>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          required
        >
          <option value="">Select a method</option>
          <option value="cash">Cash</option>
          <option value="sasapay">Sasapay</option>
          <option value="mpesa">Mpesa</option>
          {/* <option value="credit_card">Credit Card</option> */}
        </select>

        <label>Amount Paid (Ksh):</label>
        <input
          type="number"
          value={amountPaid}
          onChange={(e) => setAmountPaid(e.target.value)}
          required
        />

        <label>Transaction Code (Optional):</label>
        <input
          type="text"
          required
          value={transactionCode}
          onChange={(e) => setTransactionCode(e.target.value)}
          placeholder="Enter transaction code (if available)"
        />

        <label>Payment Date:</label>
        <input
          type="date"
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
          required
        />

        <button type="submit" disabled={loading} className="button">
          {loading ? "Processing..." : "Submit Payment"}
        </button>
      </form>
    </div>
  );
};

export default CapturePayment;
