import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../Styles/singleshopsale.css";
import ExportExcel from "../Components/Download/ExportExcel";
import DownloadPDF from "../Components/Download/DownloadPDF";
import DateRangePicker from "../Components/DateRangePicker";
import { format } from "date-fns";

const ShopSalesDetails = () => {
  const { shop_id } = useParams();
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(),
    endDate: new Date(),
  });

  useEffect(() => {
    if (!shop_id || !dateRange.startDate) return;

    const fetchSales = async () => {
      setLoading(true);
      setError("");

      try {
        const accessToken = localStorage.getItem("access_token");
        let url = `/api/diraja/totalsalesbyshop/${shop_id}`;

        const formattedStart = format(dateRange.startDate, "yyyy-MM-dd");
        const formattedEnd = dateRange.endDate
          ? format(dateRange.endDate, "yyyy-MM-dd")
          : formattedStart;

        url += `?start_date=${formattedStart}&end_date=${formattedEnd}`;

        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        setSalesData(response.data);
      } catch (err) {
        console.error("Error fetching sales data:", err);
        setError("Failed to fetch sales data.");
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, [shop_id, dateRange]);

  if (!shop_id) return <p>No shop selected.</p>;

  return (
    <div className="singleshopstock-table">
      {loading ? (
        <p>Loading sales data...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : salesData ? (
        <div>
          <h2>Sales for {salesData.shop_name}</h2>
          <p>
            <strong>Sales total:</strong> {salesData.total_sales_amount_paid}
          </p>

          <div className="input-container">
            <label>Filter by Date Range:</label>
            <DateRangePicker dateRange={dateRange} setDateRange={setDateRange} />
          </div>

          <div className="actions-container">
            {salesData.shop_name && (
              <>
                <ExportExcel 
                  data={salesData} 
                  fileName={salesData.shop_name.replace(/\s+/g, "_")} 
                />
                <DownloadPDF
                  tableId="singleshopstock-table"
                  fileName={salesData.shop_name.replace(/\s+/g, "_")}
                />
              </>
            )}
          </div>

          <h3>Sales Records</h3>
          <table id="singleshopstock-table" className="singleshopstock-table">
            <thead>
              <tr>
                {/* <th>Sale ID</th> */}
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {salesData.sales_records.map((sale) => (
                <React.Fragment key={sale.sale_id}>
                  {sale.items.map((item, itemIndex) => (
                    <tr key={`${sale.sale_id}-${itemIndex}`}>
                      {/* <td>{itemIndex === 0 ? sale.sale_id : ''}</td> */}
                      <td>{itemIndex === 0 ? 
                        new Date(sale.created_at).toLocaleString(undefined, {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour12: true,
                        }).replace(",", "") : ''}
                      </td>
                      <td>{itemIndex === 0 ? sale.customer_name || 'N/A' : ''}</td>
                      <td>{item.item_name}</td>
                      <td>{item.quantity} {item.metric}</td>
                      <td>Ksh {item.unit_price.toFixed(2)}</td>
                      <td>Ksh {item.total_price.toFixed(2)}</td>
                      <td>
                        {itemIndex === 0 ? (
                          sale.payment_methods.map((payment, index) => (
                            <div key={index}>
                              {payment.payment_method}: Ksh {payment.amount_paid.toFixed(2)}
                            </div>
                          ))
                        ) : ''}
                      </td>
                      <td>{itemIndex === 0 ? sale.status : ''}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No sales data available.</p>
      )}
    </div>
  );
};

export default ShopSalesDetails;