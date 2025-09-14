import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../Styles/singleshopsale.css";
import ExportExcel from "../Components/Download/ExportExcel";
import DownloadPDF from "../Components/Download/DownloadPDF";
import DateRangePicker from "../Components/DateRangePicker";
import { format } from "date-fns";
import PaginationTable from "../PaginationTable";

const ShopSalesDetails = () => {
  const { shop_id } = useParams();

  const [data, setData] = useState([]);
  const [shopName, setShopName] = useState("");
  const [totalSalesAmount, setTotalSalesAmount] = useState("Ksh 0.00");
  const [totalSasapay, setTotalSasapay] = useState(0);
  const [totalCash, setTotalCash] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    return {
      startDate: yesterday,
      endDate: today,
    };
  });

  const fetchSales = async () => {
    if (!shop_id || !dateRange.startDate) return;
    setLoading(true);
    setError("");

    try {
      const accessToken = localStorage.getItem("access_token");

      const formattedStart = format(dateRange.startDate, "yyyy-MM-dd");
      const formattedEnd = dateRange.endDate
        ? format(dateRange.endDate, "yyyy-MM-dd")
        : formattedStart;

      const url = `/api/diraja/totalsalesbyshop/${shop_id}?start_date=${formattedStart}&end_date=${formattedEnd}&limit=${itemsPerPage}&page=${currentPage}`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const sales = Array.isArray(response.data.sales_records)
        ? response.data.sales_records
        : [];

      setData(sales);
      setShopName(response.data.shop_name || "");
      setTotalSalesAmount(response.data.total_sales_amount_paid || "Ksh 0.00");

      // 🆕 set totals by method
      setTotalSasapay(response.data.total_sasapay || 0);
      setTotalCash(response.data.total_cash || 0);
      setTotalCredit(response.data.total_credit || 0);

      setTotalCount(response.data.total_count || sales.length);
      setTotalPages(response.data.total_pages || 1);

      if (currentPage !== 1 && sales.length === 0) {
        setCurrentPage(1); // Reset to page 1 if filtering results in empty page
      }
    } catch (err) {
      console.error("Error fetching sales data:", err);
      setError("Failed to fetch sales data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [shop_id, dateRange, currentPage, itemsPerPage]);

  const columns = [
    {
      header: "Sale Date",
      key: "created_at",
      render: (item) =>
        new Date(item.created_at).toLocaleString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
    },
    {
      header: "Username",
      key: "username",
      render: (item) => item.username || "N/A",
    },
    {
      header: "Status",
      key: "status",
      render: (item) => item.status || "N/A",
    },
    {
      header: "Total Amount",
      key: "total_amount_paid",
      render: (item) =>
        item.total_amount_paid !== undefined
          ? `Ksh ${Number(item.total_amount_paid).toLocaleString()}`
          : "Ksh 0.00",
    },
    {
      header: "Items",
      key: "items",
      render: (item) =>
        Array.isArray(item.items)
          ? item.items.map((si, idx) => (
              <div key={idx}>
                {si.item_name} × {si.quantity} {si.metric} @ Ksh {si.unit_price} = Ksh{" "}
                {si.total_price}
                <br />
                <small>Batch: {si.batch_number}</small>
              </div>
            ))
          : "No items",
    },
    {
      header: "Payment Methods",
      key: "payment_methods",
      render: (item) =>
        Array.isArray(item.payment_methods)
          ? item.payment_methods.map((pm, idx) => (
              <div key={idx}>
                {pm.payment_method}: Ksh {pm.amount_paid}
                {pm.balance !== null && pm.balance !== undefined
                  ? ` (Balance: Ksh ${pm.balance})`
                  : ""}
              </div>
            ))
          : "N/A",
    },
    {
      header: "PaymentRef",
      key: "payment_methods",
      render: (item) =>
        Array.isArray(item.payment_methods)
          ? item.payment_methods.map((pm, idx) => (
              <div key={idx}>{pm.transaction_code}</div>
            ))
          : "N/A",
    },
  ];

  return (
    <>
      {error && <p className="error">{error}</p>}
      {loading && <p>Loading sales data...</p>}

      {!loading && !error && (
        <>
          <h2>Sales for {shopName}</h2>
          <p>
            <strong>Sales total:</strong> {totalSalesAmount}
          </p>
          <p>
            <strong>Total Sasapay:</strong> Ksh {totalSasapay.toLocaleString()}
          </p>
          <p>
            <strong>Total Cash:</strong> Ksh {totalCash.toLocaleString()}
          </p>
          <p>
            <strong>Total Credit:</strong> Ksh {totalCredit.toLocaleString()}
          </p>

          <DateRangePicker dateRange={dateRange} setDateRange={setDateRange} />

          <div className="actions-container">
            <ExportExcel data={data} fileName="ShopSalesData" />
            <DownloadPDF
              tableId="singleshopstock-table"
              fileName={shopName.replace(/\s+/g, "_") || "ShopSalesData"}
            />
          </div>

          {data.length === 0 ? (
            <p>No sales data available for this range.</p>
          ) : (
            <PaginationTable
              data={data}
              columns={columns}
              pagination={{
                currentPage,
                setCurrentPage,
                itemsPerPage,
                setItemsPerPage,
                totalCount,
                totalPages,
              }}
            />
          )}
        </>
      )}
    </>
  );
};

export default ShopSalesDetails;
