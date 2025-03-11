import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ExportExcel from '../Components/Download/ExportExcel';
import DownloadPDF from '../Components/Download/DownloadPDF';
import '../Styles/sales.css';
import { isSameDay } from 'date-fns';
import LoadingAnimation from './LoadingAnimation';
import { Link } from 'react-router-dom';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
          setError('No access token found. Please log in.');
          return;
        }

        const response = await axios.get('/api/diraja/allsales', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        setSales(response.data || []);
        setFilteredSales(response.data || []);
        setError('');
      } catch (err) {
        setSales([]);
        setFilteredSales([]);
        setError('Error fetching sales. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  useEffect(() => {
    if (!searchQuery && !selectedDate) {
      setFilteredSales(sales);
      return;
    }

    const searchTerm = searchQuery.toLowerCase().trim();
    const filtered = sales.filter((sale) => {
      const itemMatch = sale.item_name?.toLowerCase().includes(searchTerm) || false;
      const shopMatch = sale.shopname?.toLowerCase().includes(searchTerm) || false;
      const customerMatch = sale.customer_name?.toLowerCase().includes(searchTerm) || false;
      const employeeMatch = sale.username?.toLowerCase().includes(searchTerm) || false;
      
      const matchesDate = selectedDate
        ? isSameDay(new Date(sale.created_at), new Date(selectedDate))
        : true;

      return (itemMatch || shopMatch || customerMatch || employeeMatch) && matchesDate;
    });

    setFilteredSales(filtered);
  }, [searchQuery, selectedDate, sales]);

  if (loading) {
    return <LoadingAnimation />;
  }

  return (
    <div className="sales-container">
      <div className="filter-container">
        <input
          type="text"
          placeholder="Search by item, shop, customer's name, or employee"
          className="search-bar"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <input
          type="date"
          className="date-picker"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      <div className="actions-container">
        <ExportExcel data={filteredSales} fileName="SalesData" />
        <DownloadPDF tableId="sales-table" fileName="SalesData" />
      </div>

      <table className="sales-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Customer</th>
            <th>Shop</th>
            <th>Item</th>
            <th>Quantity</th>
            <th>Amount Paid</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredSales.length > 0 ? (
            filteredSales.map((sale) => (
              <tr key={sale.sale_id}>
                <td>
                <div className="employee-info">
                    <div className="employee-icon">
                      {sale.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="employee-name">{sale.username}</span>
                    </div>
                  </td>
                <td>{sale.customer_name}</td>
                <td>{sale.shopname}</td>
                <td>{sale.item_name}</td>
                <td>{sale.quantity} {sale.metric}</td>
                <td>{sale.total_amount_paid}</td>
                <td>{new Date(sale.created_at).toLocaleDateString()}</td>
                <td>
                <Link to={`/sale/${sale.sale_id}`} className="view-link">View Sale</Link>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7">
                {searchQuery || selectedDate ? "No sales found for the search criteria." : "No sales available."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default Sales;
