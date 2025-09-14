import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ExportExcel from '../../Download/ExportExcel';
import DownloadPDF from '../../Download/DownloadPDF';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const itemsPerPage = 50;

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
          setError('No access token found, please log in.');
          return;
        }

        const response = await axios.get('api/diraja/getmabandasale', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        setSales(response.data);
      } catch (err) {
        setError('Error fetching sales. Please try again.');
      }
    };

    fetchSales();
  }, []);

  const filteredSales = sales.filter((sale) => {
    const itemName = sale.itemname ? sale.itemname.toLowerCase() : "";
    const userName = sale.username ? sale.username.toLowerCase() : "";

    const matchesSearch =
      itemName.includes(searchQuery.toLowerCase()) ||
      userName.includes(searchQuery.toLowerCase());

    const matchesDate = selectedDate
      ? new Date(sale.sale_date).toISOString().split('T')[0] === selectedDate
      : true;

    return matchesSearch && matchesDate;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSales = filteredSales.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);

  return (
    <div className="purchases-container">
      <div className="filter-container">
        <input
          type="text"
          placeholder="Search by item "
          className="search-bar"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
        />
        <input
          type="date"
          className="date-picker"
          value={selectedDate}
          onChange={(e) => {
            setSelectedDate(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      <div className='actions-container'>
        <ExportExcel data={filteredSales} fileName="SalesData" />
        <DownloadPDF tableId="sales-table" fileName="SalesData" />
      </div>

      {filteredSales.length > 0 ? (
        <>
          <table id="sales-table" className="purchases-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Price(Ksh)</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {currentSales.map((sale) => (
                <tr key={`${sale.itemname}-${sale.sale_date}`}>
                  <td>{sale.itemname}</td>
                  <td>{sale.quantity_sold}</td>
                  <td>{sale.amount_paid}</td>
                  <td>{new Date(sale.sale_date).toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(',', '')}</td>

                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                className={`page-button ${currentPage === index + 1 ? 'active' : ''}`}
                onClick={() => setCurrentPage(index + 1)}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </>
      ) : (
        <p>No sales found.</p>
      )}
    </div>
  );
};

export default Sales;
