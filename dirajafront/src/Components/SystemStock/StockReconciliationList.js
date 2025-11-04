import React, { useEffect, useState } from 'react';
import '../../Styles/shopstock.css';
import LoadingAnimation from '../LoadingAnimation';
import GeneralTableLayout from '../GeneralTableLayout';

const StockReconciliationList = () => {
    const [reconciliations, setReconciliations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Fetch reconciliation records
    useEffect(() => {
        const fetchReconciliations = async () => {
            try {
                const accessToken = localStorage.getItem('access_token');
                if (!accessToken) {
                    setError('No access token found. Please log in.');
                    setLoading(false);
                    return;
                }

                const params = new URLSearchParams();
                if (searchQuery) params.append('item_name', searchQuery);
                if (statusFilter) params.append('status', statusFilter);
                if (dateFrom) params.append('date_from', dateFrom);
                if (dateTo) params.append('date_to', dateTo);

                const response = await fetch(`/api/diraja/stock-reconciliation?${params.toString()}`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) throw new Error('Failed to fetch reconciliation records');

                const data = await response.json();
                setReconciliations(data.reconciliations || []);
                setLoading(false);
            } catch (error) {
                setError(error.message);
                setLoading(false);
            }
        };

        fetchReconciliations();
    }, [searchQuery, statusFilter, dateFrom, dateTo]);

    // Table columns
    const columns = [
        { header: 'ID', key: 'id', render: (rec) => rec.id },
        { header: 'Shop ID', key: 'shop_id', render: (rec) => rec.shop_id },
        { header: 'User ID', key: 'user_id', render: (rec) => rec.user_id },
        { header: 'Item', key: 'item', render: (rec) => rec.item },
        { header: 'Stock Value', key: 'stock_value', render: (rec) => rec.stock_value.toFixed(2) },
        { header: 'Report Value', key: 'report_value', render: (rec) => rec.report_value.toFixed(2) },
        { header: 'Difference', key: 'difference', render: (rec) => rec.difference.toFixed(2) },
        { 
            header: 'Status', 
            key: 'status', 
            render: (rec) => (
                <span className={`status-badge ${rec.status === 'Solved' ? 'solved' : 'unsolved'}`}>
                    {rec.status}
                </span>
            )
        },
        { header: 'Comment', key: 'comment', render: (rec) => rec.comment || '-' },
        { 
            header: 'Date', 
            key: 'created_at', 
            render: (rec) => new Date(rec.created_at).toLocaleString() 
        }
    ];

    if (loading) return <LoadingAnimation />;
    if (error) return <p>Error: {error}</p>;

    return (
        <div className="shopStocks-container">
            {/* Filters */}
            <div className="filter-container">
                <input
                    type="text"
                    placeholder="Search by item name"
                    className="search-bar"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />

                <select
                    className="status-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="">All Status</option>
                    <option value="Solved">Solved</option>
                    <option value="Unsolved">Unsolved</option>
                </select>

                <div className="date-filter">
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                    />
                    <span>to</span>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <GeneralTableLayout 
                data={reconciliations}
                columns={columns}
                rowClassName={(rec) => rec.status === 'Unsolved' ? 'unsolved-row' : ''}
            />
        </div>
    );
};

export default StockReconciliationList;
