import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import ExportExcel from '../Download/ExportExcel';
import DownloadPDF from '../Download/DownloadPDF';
import DistributeInventoryModal from './DistributeInventoryModal';
import SpoiltInventoryModal from './SpoiltInventoryModal'; // Import the SpoiltModal
import UpdateInventory from '../updateInventory';
import GeneralTableLayout from '../GeneralTableLayout';
import '../../Styles/inventory.css';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedInventory, setSelectedInventory] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showSpoiltModal, setShowSpoiltModal] = useState(false); // New state for spoilt modal
  const [editingInventoryId, setEditingInventoryId] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [stockItems, setStockItems] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const editInventoryRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
          setError('No access token found, please log in.');
          return;
        }

        // Fetch inventory
        const inventoryResponse = await axios.get('api/diraja/v2/allinventories', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        // Fetch stock items metadata
        const itemsRes = await axios.get('api/diraja/stockitems', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const stockItemsData = itemsRes.data.stock_items || [];
        setStockItems(stockItemsData);

        // Apply display formatting to inventory
        const processedInventory = inventoryResponse.data.map((item) => {
          const itemInfo = stockItemsData.find(
            (stockItem) => stockItem.item_name === item.itemname
          );

          if (!itemInfo) {
            return {
              ...item,
              initial_display: `${item.initial_quantity} ${item.metric || 'pcs'}`,
              remaining_display: `${item.remaining_quantity} ${item.metric || 'pcs'}`,
            };
          }

          const initialDisplay = formatQuantityDisplay(item.initial_quantity, item.metric, itemInfo);
          const remainingDisplay = formatQuantityDisplay(item.remaining_quantity, item.metric, itemInfo);

          return {
            ...item,
            initial_display: initialDisplay,
            remaining_display: remainingDisplay,
          };
        });

        setInventory(processedInventory);
      } catch (err) {
        setError('Error fetching data. Please try again.');
      }
    };

    fetchData();
  }, []);

  // Helper function to format quantity display
  const formatQuantityDisplay = (quantity, metric, itemInfo) => {
    if (metric && metric.toLowerCase() === 'kgs') {
      return `${quantity} kgs`;
    }

    // Eggs logic → trays and pieces
    if (
      itemInfo.item_name.toLowerCase().includes('eggs') &&
      (itemInfo.pack_quantity > 0 || !itemInfo.pack_quantity)
    ) {
      const packQty =
        itemInfo.pack_quantity && itemInfo.pack_quantity > 0
          ? itemInfo.pack_quantity
          : 30; // default tray size
      const trays = Math.floor(quantity / packQty);
      const pieces = quantity % packQty;
      return trays > 0
        ? `${trays} tray${trays !== 1 ? 's' : ''}${pieces > 0 ? `, ${pieces} pcs` : ''}`
        : `${pieces} pcs`;
    }

    // Other items with pack_quantity → pkts and pcs
    if (itemInfo.pack_quantity > 0) {
      const packets = Math.floor(quantity / itemInfo.pack_quantity);
      const pieces = quantity % itemInfo.pack_quantity;
      return packets > 0
        ? `${packets} pkt${packets !== 1 ? 's' : ''}${pieces > 0 ? `, ${pieces} pcs` : ''}`
        : `${pieces} pcs`;
    }

    return `${quantity} ${metric || 'pcs'}`;
  };

  useEffect(() => {
    if (editingInventoryId !== null) {
      // Small timeout to ensure the DOM has updated
      setTimeout(() => setIsModalVisible(true), 10);
      editInventoryRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      setIsModalVisible(false);
    }
  }, [editingInventoryId]);

  const handleCheckboxChange = (inventoryId) => {
    setSelectedInventory((prevSelected) =>
      prevSelected.includes(inventoryId)
        ? prevSelected.filter((id) => id !== inventoryId)
        : [...prevSelected, inventoryId]
    );
  };

  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      const currentPageIds = filteredInventory
        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
        .map((inv) => inv.inventoryV2_id);
      setSelectedInventory(currentPageIds);
    } else {
      setSelectedInventory([]);
    }
  };

  const handleAction = () => {
    if (selectedInventory.length === 0) {
      setError('Please select at least one inventory item.');
      return;
    }

    switch (selectedAction) {
      case 'distribute':
        setShowModal(true);
        break;
      case 'spoilt':
        setShowSpoiltModal(true);
        break;
      case 'delete':
        handleDelete();
        break;
      default:
        setError('Please select a valid action.');
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete the selected inventory items? This action cannot be undone.'
    );
    if (!confirmDelete) return;

    const accessToken = localStorage.getItem('access_token');
    try {
      await Promise.all(
        selectedInventory.map((inventoryId) =>
          axios.delete(`api/diraja/v2/inventory/${inventoryId}`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          })
        )
      );
      setInventory((prev) => prev.filter((inv) => !selectedInventory.includes(inv.inventoryV2_id)));
      setSelectedInventory([]);
      setSelectedAction('');
      setError('');
    } catch (error) {
      setError('Error deleting inventory. Please try again.');
    }
  };

  const handleDistributeSuccess = () => {
    // Refresh inventory data after successful distribution
    fetchInventory();
    setSelectedInventory([]);
    setSelectedAction('');
    setError('');
  };

  const handleSpoiltSuccess = () => {
    // Refresh inventory data after successful spoilt recording
    fetchInventory();
    setSelectedInventory([]);
    setSelectedAction('');
    setError('');
  };

  const handleEditClick = (inventoryId) => {
    setEditingInventoryId(inventoryId);
  };

  const handleCloseUpdate = () => {
    setIsModalVisible(false);
    // Small delay to allow slide-out animation to complete
    setTimeout(() => setEditingInventoryId(null), 300);
  };

  // Function to refresh inventory data
  const fetchInventory = async () => {
    try {
      const accessToken = localStorage.getItem('access_token');
      const inventoryResponse = await axios.get('api/diraja/v2/allinventories', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Apply display formatting to inventory
      const processedInventory = inventoryResponse.data.map((item) => {
        const itemInfo = stockItems.find(
          (stockItem) => stockItem.item_name === item.itemname
        );

        if (!itemInfo) {
          return {
            ...item,
            initial_display: `${item.initial_quantity} ${item.metric || 'pcs'}`,
            remaining_display: `${item.remaining_quantity} ${item.metric || 'pcs'}`,
          };
        }

        const initialDisplay = formatQuantityDisplay(item.initial_quantity, item.metric, itemInfo);
        const remainingDisplay = formatQuantityDisplay(item.remaining_quantity, item.metric, itemInfo);

        return {
          ...item,
          initial_display: initialDisplay,
          remaining_display: remainingDisplay,
        };
      });

      setInventory(processedInventory);
    } catch (err) {
      setError('Error refreshing inventory data.');
    }
  };

  const filteredInventory = inventory
    .filter((inventoryItem) => {
      const searchString = searchTerm.toLowerCase();
      const matchesSearch =
        (inventoryItem.itemname && inventoryItem.itemname.toLowerCase().includes(searchString)) ||
        (inventoryItem.batchnumber && inventoryItem.batchnumber.toLowerCase().includes(searchString)) ||
        (inventoryItem.note && inventoryItem.note.toLowerCase().includes(searchString));

      const matchesDateRange =
        selectedDate === '' ||
        new Date(inventoryItem.created_at).toISOString().split('T')[0] === selectedDate;

      return matchesSearch && matchesDateRange;
    })
    .sort((a, b) => {
      if (a.remaining_quantity === 0 && b.remaining_quantity !== 0) return 1;
      if (a.remaining_quantity !== 0 && b.remaining_quantity === 0) return -1;
      return 0;
    });

  const columns = [
    {
      header: (
        <input
          type="checkbox"
          onChange={(e) => handleSelectAll(e.target.checked)}
          checked={
            selectedInventory.length > 0 &&
            filteredInventory
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .every((item) => selectedInventory.includes(item.inventoryV2_id)) &&
            filteredInventory
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .length > 0
          }
        />
      ),
      key: 'inventoryV2_id',
      render: (item) => (
        <input
          type="checkbox"
          checked={selectedInventory.includes(item.inventoryV2_id)}
          onChange={() => handleCheckboxChange(item.inventoryV2_id)}
        />
      ),
    },
    {
      header: 'Date',
      key: 'created_at',
      render: (item) => {
        const date = new Date(item.created_at);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      },
    },
    { header: 'Item', key: 'itemname' },
    {
      header: 'Batch No',
      key: 'batchnumber',
      render: (item) => <span style={{ fontSize: '12px' }}>{item.batchnumber}</span>,
    },
    {
      header: 'Initial Quantity',
      key: 'initial_quantity',
      render: (item) => item.initial_display || `${item.initial_quantity} ${item.metric}`,
    },
    {
      header: 'Remaining Quantity',
      key: 'remaining_quantity',
      render: (item) => item.remaining_display || `${item.remaining_quantity} ${item.metric}`,
    },
    { header: 'Unit Cost (Ksh)', key: 'unitCost' },
    { header: 'Amount Paid (Ksh)', key: 'amountPaid' },
    {
      header: 'Payment Ref',
      key: 'paymentRef',
      render: (item) => <span style={{ fontSize: '12px' }}>{item.paymentRef}</span>,
    },
    { header: 'Source', key: 'source' },
    {
      header: 'Actions',
      key: 'actions',
      render: (item) => (
        <button className="editeInventory" onClick={() => handleEditClick(item.inventoryV2_id)}>
          Edit
        </button>
      ),
    },
    { header: 'Comments', key: 'note' },
  ];

  // Inline styles for the modal
  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
    display: editingInventoryId ? 'block' : 'none',
    transition: 'opacity 0.3s ease-in-out',
    opacity: isModalVisible ? 1 : 0,
  };

  const modalContainerStyle = {
    position: 'fixed',
    top: 0,
    right: isModalVisible ? 0 : '-400px',
    width: '400px',
    height: '100vh',
    backgroundColor: 'white',
    boxShadow: '2px 0 10px rgba(0, 0, 0, 0.3)',
    zIndex: 1000,
    transition: 'left 0.3s ease-in-out',
    overflowY: 'auto',
    padding: '20px',
  };

  const closeButtonStyle = {
    position: 'absolute',
    top: '10px',
    right: '15px',
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666',
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
  };

  const closeButtonHoverStyle = {
    backgroundColor: '#f0f0f0',
    color: '#000',
  };

  const [isCloseHovered, setIsCloseHovered] = useState(false);

  return (
    <div className="inventory-container">
      {error && <div className="error-message">{error}</div>}

      <div className="inventory-controls">
        <input
          type="text"
          placeholder="Search by item, batch number, or note"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-bar"
        />
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="date-picker"
        />

        <div className="actions-container">
          <div className="actions">
            <select onChange={(e) => setSelectedAction(e.target.value)} value={selectedAction}>
              <option value="">With selected, choose an action</option>
              <option value="distribute">Distribute</option>
              <option value="spoilt">Mark as Spoilt</option> {/* New option */}
              <option value="delete">Delete</option>
            </select>
            <button onClick={handleAction} className="action-button">
              Apply
            </button>
          </div>

          <ExportExcel data={inventory} fileName="InventoryData" />
          <DownloadPDF data={filteredInventory} columns={columns} fileName="InventoryData" />
        </div>
      </div>

      {showModal && (
        <DistributeInventoryModal
          selectedInventory={selectedInventory}
          inventory={inventory}
          onClose={() => setShowModal(false)}
          onDistributeSuccess={handleDistributeSuccess}
        />
      )}

      {showSpoiltModal && (
        <SpoiltInventoryModal
          selectedInventory={selectedInventory}
          inventory={inventory}
          onClose={() => setShowSpoiltModal(false)}
          onSpoiltSuccess={handleSpoiltSuccess}
        />
      )}

      {editingInventoryId && (
        <>
          {/* Overlay */}
          <div 
            style={overlayStyle}
            onClick={handleCloseUpdate}
          />
          
          {/* Slide-in modal */}
          <div 
            style={modalContainerStyle}
            ref={editInventoryRef}
          >
            <button 
              style={{
                ...closeButtonStyle,
                ...(isCloseHovered ? closeButtonHoverStyle : {})
              }}
              onClick={handleCloseUpdate}
              onMouseEnter={() => setIsCloseHovered(true)}
              onMouseLeave={() => setIsCloseHovered(false)}
            >
              ×
            </button>
            <UpdateInventory
              inventoryId={editingInventoryId}
              onClose={handleCloseUpdate}
              onUpdateSuccess={() => {
                setInventory([...inventory]);
                handleCloseUpdate();
              }}
            />
          </div>
        </>
      )}

      <GeneralTableLayout
        data={filteredInventory}
        columns={columns}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
      />
    </div>
  );
};

export default Inventory;