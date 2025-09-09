import { useEffect, useState } from "react";

const ShopTransferTable = () => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("api/diraja/allshoptransfers", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch shop transfers");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Fetched transfers:", data);
        setTransfers(Array.isArray(data.transfers) ? data.transfers : []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching shop transfers:", error);
        setError(error.message);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h2>Shop Transfers</h2>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: "red" }}>Error: {error}</p>
      ) : transfers.length === 0 ? (
        <p>No transfers found.</p>
      ) : (
        <table className="shopStocks-table">
          <thead>
            <tr>
         
              <th>Item Name</th>
              <th>Quantity</th>
              <th>Metric</th>
              <th>From Shop</th>
              <th>To Shop</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {transfers.map((transfer) => (
              <tr key={transfer.id}>
               
                <td>{transfer.item_name}</td>
                <td>{transfer.quantity}</td>
                <td>{transfer.metric}</td>
                <td>{transfer.fromshop}</td>
                <td>{transfer.toshop}</td>
                <td>{new Date(transfer.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ShopTransferTable;
