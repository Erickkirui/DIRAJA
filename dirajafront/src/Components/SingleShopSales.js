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
        const formattedEnd = dateRange.endDate ? format(dateRange.endDate, "yyyy-MM-dd") : formattedStart;

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
          <p><strong>Sales total:</strong> {salesData.total_sales_amount_paid}</p>
          
          <div className="date-filters">

            <DateRangePicker dateRange={dateRange} setDateRange={setDateRange} />

          </div>
          
          <div className="actions-container">
            {salesData.shop_name ? (
              <>
                <ExportExcel data={salesData} fileName="ShopSalesData" />

                <DownloadPDF 
                  tableId="singleshopstock-table" 
                  fileName={salesData?.shop_name ? salesData.shop_name.replace(/\s+/g, '_') : 'ShopSalesData'} 
                />

              </>
            ) : (
              <>
                {/* <ExportExcel data={salesData} fileName="ShopSalesData" /> */}
                {/* <DownloadPDF tableId="singleshopstock-table" fileName="ShopSalesData" /> */}
              </>
            )}
          </div>

          <h3>Sales Records</h3>
          <table id="singleshopstock-table" className="singleshopstock-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Total price</th>
                <th>Amount paid</th>
                <th>Sale date</th>
              </tr>
            </thead>
            <tbody>
              {salesData.sales_records.map((sale) => (
                <tr key={sale.sale_id}>
                  <td>{sale.item_name}</td>
                  <td>{sale.quantity} {sale.metric}</td>
                  <td>Ksh {sale.total_price}</td>
                  <td>
                    {sale.payment_methods.map((payment, index) => (
                      <div key={index}>
                        {payment.payment_method}: Ksh {payment.amount_paid}
                      </div>
                    ))}
                  </td>
                  <td>{new Date(sale.created_at).toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour12: true }).replace(',', '')}</td>
                </tr>
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
