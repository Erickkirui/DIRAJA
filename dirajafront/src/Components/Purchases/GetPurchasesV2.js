import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import ExportExcel from '../../Components/Download/ExportExcel';
import DownloadPDF from '../../Components/Download/DownloadPDF';
import UpdateTransfer from './UpdtaeTransfers';
import GeneralTableLayout from '../../Components/GeneralTableLayout';
import { Link } from 'react-router-dom';
import '../../Styles/purchases.css';

const PurchasesV2 = () => {
  const [purchases, setPurchases] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTransferId, setSelectedTransferId] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [loading, setLoading] = useState(false);

  // Improved egg detection function
  const isEggItem = useCallback((itemName) => {
    if (!itemName) return false;
    
    const eggKeywords = ['egg', 'eggs', 'mayai', 'yai', 'yaii', 'yeye', 'maai'];
    const normalizedName = itemName.toLowerCase().trim();
    
    return eggKeywords.some(keyword => normalizedName.includes(keyword));
  }, []);

  // Process quantity data into human-readable display
  const processQuantityData = useCallback((quantity, metric, itemname, items) => {
    const itemInfo = items.find((item) => item.item_name === itemname);

    if (!itemInfo) return `${quantity} ${metric || "pcs"}`;

    // Kgs stay as kgs
    if (metric && metric.toLowerCase() === "kgs") {
      return `${quantity} kgs`;
    }

    // Eggs → trays + pieces (using improved egg detection)
    const isEggs = isEggItem(itemname) || isEggItem(itemInfo.item_name);
    
    if (isEggs && itemInfo.pack_quantity > 0) {
      const trays = Math.floor(quantity / itemInfo.pack_quantity);
      const pieces = quantity % itemInfo.pack_quantity;
      return trays > 0
        ? `${trays} tray${trays !== 1 ? "s" : ""}${
            pieces > 0 ? `, ${pieces} pcs` : ""
          }`
        : `${pieces} pcs`;
    }

    // Other items with pack quantity → pkts + pcs
    if (itemInfo.pack_quantity > 0) {
      const packets = Math.floor(quantity / itemInfo.pack_quantity);
      const pieces = quantity % itemInfo.pack_quantity;
      return packets > 0
        ? `${packets} pkt${packets !== 1 ? "s" : ""}${
            pieces > 0 ? `, ${pieces} pcs` : ""
          }`
        : `${pieces} pcs`;
    }

    // Fallback
    return `${quantity} ${metric || "pcs"}`;
  }, [isEggItem]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
          setError('No access token found, please log in.');
          setLoading(false);
          return;
        }

        // Fetch stock items first
        const itemsResponse = await axios.get("api/diraja/stockitems", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const items = itemsResponse.data.stock_items || [];
        setStockItems(items);

        // Then fetch transfers
        const response = await axios.get('api/diraja/v2/transfers', {
          headers: { 
            Authorization: `Bearer ${accessToken}`,
            'X-User-Role': 'manager'
          },
        });

        // Handle the structured response
        if (response.data && response.data.status === "success") {
          // Sort by created_at in descending order (newest first)
          const sortedPurchases = response.data.data.sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
          );
          
          // Process quantities for display
          const processedPurchases = sortedPurchases.map(purchase => ({
            ...purchase,
            displayQuantity: processQuantityData(
              purchase.quantity, 
              purchase.metric, 
              purchase.itemname, 
              items
            )
          }));
          
          setPurchases(processedPurchases);
        } else {
          throw new Error(response.data.message || 'Invalid response format');
        }
      } catch (err) {
        setError(err.message || 'Error fetching purchases. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [processQuantityData]);

  const getFirstName = (username) => {
    return username?.split(' ')[0] || '';
  };

  const getFirstLetter = (username) => {
    return username?.charAt(0).toUpperCase() || '';
  };

  const handleEdit = (transferId) => {
    setSelectedTransferId(transferId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeUpdateForm = () => {
    setSelectedTransferId(null);
  };
  
  // Filter and maintain the descending order by created_at
  const filteredPurchases = purchases
    .filter((purchase) => {
      const matchesSearch =
        purchase.itemname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        purchase.shop_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        purchase.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        purchase.batchnumber?.toLowerCase().includes(searchQuery.toLowerCase());
    
      const matchesDate = selectedDate
        ? new Date(purchase.created_at).toLocaleDateString() ===
          new Date(selectedDate).toLocaleDateString()
        : true;
    
      return matchesSearch && matchesDate;
    })
    // Ensure filtered results are also sorted by created_at descending
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const columns = [
    {
      header: 'Employee',
      key: 'username',
      render: (purchase) => (
        <div className="employee-info">
          <div className="employee-icon">{getFirstLetter(purchase.username)}</div>
          <span className="employee-name">{getFirstName(purchase.username)}</span>
        </div>
      )
    },
    { header: 'Shop', key: 'shop_name' },
    { header: 'Item', key: 'itemname' },
    { header: 'Batch', key: 'BatchNumber' },
    {
      header: 'Quantity',
      key: 'quantity',
      render: (purchase) => purchase.displayQuantity || `${purchase.quantity} ${purchase.metric}`
    },
    // { header: 'Unit Cost (Ksh)', key: 'unitCost' },
    // { header: 'Total Cost (Ksh)', key: 'total_cost' },
    // { header: 'Amount Paid (Ksh)', key: 'amountPaid' },
    { header: 'Status', key: 'status' },
    {
      header: 'Date',
      key: 'created_at',
      render: (purchase) => new Date(purchase.created_at).toLocaleDateString()
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (purchase) => (
        <button
          className='editeInventory'
          onClick={() => handleEdit(purchase.transfer_id)}
        >
          Edit
        </button>
      )
    }
  ];

  return (
    <div className="purchases-container">
      <div className="filter-container">
        <input
          type="text"
          placeholder="Search by item, shop, or employee"
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
        <ExportExcel data={filteredPurchases} fileName="PurchasesData" />
        <DownloadPDF data={filteredPurchases} columns={columns} fileName="PurchasesData" />
        <Link to="/mabandapurchasesmanager" className='mabandabutton'>
          View Mabanda Purchases
        </Link>
      </div>

      {selectedTransferId && (
        <div className="update-form-container">
          <UpdateTransfer transferId={selectedTransferId} />
          <button className="close-button" onClick={closeUpdateForm}>Close</button>
        </div>
      )}

      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : filteredPurchases.length > 0 ? (
        <GeneralTableLayout
          data={filteredPurchases}
          columns={columns}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      ) : (
        <p>No purchases found.</p>
      )}
    </div>
  );
};

export default PurchasesV2;