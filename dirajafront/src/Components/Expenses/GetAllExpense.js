import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import ExportExcel from '../Download/ExportExcel';
import DownloadPDF from '../Download/DownloadPDF';
import UpdateExpenses from '../UpdateExpense';
import PaginationTable from '../../PaginationTable';
import SearchComponent from './SearchComponent';
import '../../Styles/expenses.css';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    shopname: '',
    start_date: '',
    end_date: '',
  });
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [loading, setLoading] = useState(false);
  const editExpenseRef = useRef(null);

  const fetchExpenses = async (page = currentPage, perPage = itemsPerPage, searchFilters = filters) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      // Build params object, only include non-empty filters
      const params = {
        page,
        per_page: perPage,
        ...searchFilters
      };

      // Remove empty filter values
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await axios.get('/api/diraja/allexpenses', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      console.log('API Response:', response.data);

      setExpenses(response.data.expenses || []);
      setCurrentPage(response.data.pagination?.page || 1);
      setTotalPages(response.data.pagination?.total_pages || 1);
      setTotalCount(response.data.pagination?.total_items || 0);
      
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError('Failed to fetch expenses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [currentPage, itemsPerPage]);

  const handleSearch = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    fetchExpenses(1, itemsPerPage, newFilters);
  };

  const handleClearSearch = () => {
    const emptyFilters = {
      search: '',
      category: '',
      shopname: '',
      start_date: '',
      end_date: '',
    };
    setFilters(emptyFilters);
    setCurrentPage(1);
    fetchExpenses(1, itemsPerPage, emptyFilters);
  };

  const handleEditClick = (expenseId) => {
    setEditingExpenseId(expenseId);
    editExpenseRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCloseUpdate = () => {
    setEditingExpenseId(null);
  };

  // Helper functions for employee avatar
  const getFirstLetter = (username) => username?.charAt(0).toUpperCase() || 'U';
  const getFirstName = (username) => username?.split(' ')[0] || 'Unknown';

  const columns = [
    { 
      header: 'Employee', 
      key: 'username',
      render: (item) => (
        <div className="employee-info">
          <div className="employee-icon">{getFirstLetter(item.username)}</div>
          <span className="employee-name">{getFirstName(item.username)}</span>
        </div>
      )
    },
    { header: 'Shop', key: 'shop_name' },
    { header: 'Item', key: 'item' },
    { header: 'Category', key: 'category' },
    { header: 'Description', key: 'description' },
    { 
      header: 'Amount Paid (Ksh)', 
      key: 'amountPaid',
      render: (item) => item.amountPaid?.toLocaleString() || '0'
    },
    { header: 'Payment Ref', key: 'paymentRef' },
    { header: 'From', key: 'source' },
    { header: 'Comments', key: 'comments' },
    { header: 'Paid To', key: 'paidTo' },
    {
      header: 'Date',
      render: (item) =>
        new Date(item.created_at).toLocaleDateString('en-CA'),
    },
    {
      header: 'Action',
      render: (item) => (
        <button
          className="editeInventory"
          onClick={() => handleEditClick(item.expense_id)}
        >
          Edit
        </button>
      ),
    },
  ];

  // Pagination object for PaginationTable
  const pagination = {
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalCount,
    totalPages,
  };

  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="expenses-container">
      {/* 🔍 Search Component */}
      <SearchComponent 
        onSearch={handleSearch}
        onClear={handleClearSearch}
        loading={loading}
      />

      {/* 📦 Actions */}
      <div className="actions-container">
        <ExportExcel data={expenses} fileName="ExpensesData" />
        <DownloadPDF tableId="expenses-table" fileName="ExpensesData" />
        <Link to="/addexpensecategory" className="mabandabutton">
          Add Expense Category
        </Link>
      </div>

      {/* ✏️ Edit Form */}
      {editingExpenseId && (
        <div ref={editExpenseRef}>
          <UpdateExpenses
            expenseId={editingExpenseId}
            onClose={handleCloseUpdate}
            onUpdateSuccess={() => fetchExpenses(currentPage, itemsPerPage, filters)}
          />
        </div>
      )}

      {/* 📊 Table */}
      {loading ? (
        <div className="loading-message">Loading expenses...</div>
      ) : (
        <PaginationTable
          data={expenses}
          columns={columns}
          pagination={pagination}
          tableId="expenses-table"
        />
      )}
    </div>
  );
};

export default Expenses;