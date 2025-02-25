import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import '../Styles/singleshopsale.css';
import ExportExcel from '../Components/Download/ExportExcel';
import DownloadPDF from '../Components/Download/DownloadPDF';


const ShopSalesDetails = () => {
  const { shop_id } = useParams();
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const today = new Date();
  const [dateRange, setDateRange] = useState([today, null]);
  const [startDate, endDate] = dateRange;

  useEffect(() => {
    if (!shop_id || !startDate) return;

    const fetchSales = async () => {
      setLoading(true);
      setError("");

      try {
        const accessToken = localStorage.getItem("access_token");
        let url = `/api/diraja/totalsalesbyshop/${shop_id}`;

        // ✅ Fix: Convert to local YYYY-MM-DD format to avoid timezone issues
        const formattedStart = startDate.toLocaleDateString("en-CA"); // YYYY-MM-DD
        const formattedEnd = endDate ? endDate.toLocaleDateString("en-CA") : formattedStart;

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
  }, [shop_id, startDate, endDate]);

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
            <label>Select a date or range: </label>
            <DatePicker
            selected={startDate}
            onChange={(update) => setDateRange(update)}
            startDate={startDate}
            endDate={endDate}
            selectsRange
            isClearable
            placeholderText="mm/dd/yyyy"
            dateFormat="MM/dd/yyyy"
        />
        </div>
        <div className="actions-container">
            {salesData && salesData.shop_name ? (
                <>
                <ExportExcel data={salesData} fileName={salesData.shop_name.replace(/\s+/g, '_')} />
                <DownloadPDF tableId="singleshopstock-table" fileName={salesData.shop_name.replace(/\s+/g, '_')} />
                </>
            ) : (
                <>
                <ExportExcel data={salesData} fileName="ShopSalesData" />
                <DownloadPDF tableId="singleshopstock-table" fileName="ShopSalesData" />
                </>
            )}
        </div>


          <h3>Sales Records</h3>
          <table id="singleshopstock-table" className="singleshopstock-table">
            <thead>
              <tr>
                {/* <th>Customer</th> */}
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
                  {/* <td>{sale.customer_name}</td> */}
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
                  {/* <td>{sale.created_at}</td> */}
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




// import React, { useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
// import axios from "axios";
// import '../Styles/singleshopsale.css';
// import ExportExcel from '../Components/Download/ExportExcel';
// import DownloadPDF from '../Components/Download/DownloadPDF';


// const ShopSalesDetails = () => {
//   const { shop_id } = useParams();
//   const [salesData, setSalesData] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   // Default date is today
//   const today = new Date();
//   const [dateRange, setDateRange] = useState([today, null]);
//   const [startDate, endDate] = dateRange;

//   useEffect(() => {
//     if (!shop_id || !startDate) return;

//     const fetchSales = async () => {
//       setLoading(true);
//       setError("");

//       try {
//         const accessToken = localStorage.getItem("access_token");
//         let url = `/api/diraja/totalsalesbyshop/${shop_id}`;

//         // Format date as YYYY-MM-DD for API
//         const formattedStart = startDate.toISOString().split("T")[0];
//         const formattedEnd = endDate ? endDate.toISOString().split("T")[0] : formattedStart;
//         url += `?start_date=${formattedStart}&end_date=${formattedEnd}`;

//         const response = await axios.get(url, {
//           headers: { Authorization: `Bearer ${accessToken}` },
//         });

//         setSalesData(response.data);
//       } catch (err) {
//         console.error("Error fetching sales data:", err);
//         setError("Failed to fetch sales data.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchSales();
//   }, [shop_id, startDate, endDate]);

//   if (!shop_id) return <p>No shop selected.</p>;

//   return (

//     <div className="singleshopstock-table">

//     <div className='actions-container' >
//         <ExportExcel data={salesData} fileName="singleshopsalesData" />
//         <DownloadPDF tableId="singleshopstock-table" fileName="singleshopsalesData" />
//     </div>
//       <h2>Sales Data</h2>

//       <div className="date-filters">
//         <label>Select Date or Range: </label>
//         <DatePicker
//           selected={startDate}
//           onChange={(update) => setDateRange(update)}
//           startDate={startDate}
//           endDate={endDate}
//           selectsRange
//           isClearable
//           placeholderText="mm/dd/yyyy"
//           dateFormat="MM/dd/yyyy"
//         />
//       </div>

//       {loading ? (
//         <p>Loading sales data...</p>
//       ) : error ? (
//         <p className="error">{error}</p>
//       ) : salesData ? (
//         <div>
//           <h3>Total Sales for {salesData.shop_name}</h3>
//           <p><strong>Amount Paid:</strong> {salesData.total_sales_amount_paid}</p>

//           <h3>Sales Records</h3>
//           <table>
//             <thead>
//               <tr>
//                 <th>Sale ID</th>
//                 <th>Created At</th>
//                 <th>Customer</th>
//                 <th>Item</th>
//                 <th>Quantity</th>
//                 <th>Total Price</th>
//                 <th>Payment Methods</th>
//               </tr>
//             </thead>
//             <tbody>
//               {salesData.sales_records.map((sale) => (
//                 <tr key={sale.sale_id}>
//                   <td>{sale.sale_id}</td>
//                   <td>{sale.created_at}</td>
//                   <td>{sale.customer_name}</td>
//                   <td>{sale.item_name}</td>
//                   <td>{sale.quantity} {sale.metric}</td>
//                   <td>Ksh {sale.total_price}</td>
//                   <td>
//                     {sale.payment_methods.map((payment, index) => (
//                       <div key={index}>
//                         {payment.payment_method}: Ksh {payment.amount_paid}
//                       </div>
//                     ))}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       ) : (
//         <p>No sales data available.</p>
//       )}
//     </div>
//   );
// };

// export default ShopSalesDetails;
