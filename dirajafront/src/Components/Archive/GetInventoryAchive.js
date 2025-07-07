import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import ExportExcel from '../Download/ExportExcel';
import DownloadPDF from '../Download/DownloadPDF';
import DistributeInventoryModal from '../Inventory/DistributeInventoryModal';
import UpdateInventory from '../updateInventory';
import GeneralTableLayout from '../GeneralTableLayout';
import '../../Styles/inventory.css';

const InventoryAchive = () => {
  const [inventory, setInventory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedInventory, setSelectedInventory] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingInventoryId, setEditingInventoryId] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const editInventoryRef = useRef(null);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
          setError('No access token found, please log in.');
          return;
        }

        const response = await axios.get('/api/diraja/allinventories', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'X-User-Role': 'manager',
          },
        });
        setInventory(response.data);
      } catch (err) {
        setError('Error fetching inventory. Please try again.');
      }
    };
    fetchInventory();
  }, []);

  useEffect(() => {
    if (editingInventoryId !== null) {
      editInventoryRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    if (selectedAction === 'distribute') {
      setShowModal(true);
    } else if (selectedAction === 'delete') {
      handleDelete();
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete the selected inventory items? This action cannot be undone."
    );
    if (!confirmDelete) return;

    const accessToken = localStorage.getItem('access_token');
    try {
      await Promise.all(
        selectedInventory.map((inventoryId) =>
          axios.delete(`/api/diraja/v2/inventory/${inventoryId}`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'X-User-Role': 'manager',
            },
          })
        )
      );
      setInventory((prev) => prev.filter((inv) => !selectedInventory.includes(inv.inventoryV2_id)));
      setSelectedInventory([]);
      setSelectedAction('');
    } catch (error) {
      setError('Error deleting inventory. Please try again.');
    }
  };

  const handleDistributeSuccess = () => {
    setSelectedInventory([]);
    setSelectedAction('');
  };

  const filteredInventory = inventory
    .filter((inventoryItem) => {
      const searchString = searchTerm.toLowerCase();
      const matchesSearch =
        (inventoryItem.itemname && inventoryItem.itemname.toLowerCase().includes(searchString)) ||
        (inventoryItem.batchnumber && inventoryItem.batchnumber.toLowerCase().includes(searchString)) ||
        (inventoryItem.note && inventoryItem.note.toLowerCase().includes(searchString));

      const matchesDateRange =
        selectedDate === '' || new Date(inventoryItem.created_at).toISOString().split('T')[0] === selectedDate;

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
              .every(item => selectedInventory.includes(item.inventoryV2_id)) &&
            filteredInventory
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .length > 0
          }
          indeterminate={
            selectedInventory.length > 0 &&
            !filteredInventory
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .every(item => selectedInventory.includes(item.inventoryV2_id)) &&
            filteredInventory
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .some(item => selectedInventory.includes(item.inventoryV2_id))
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
      )
    },
    {
      header: 'Date',
      key: 'created_at',
      render: (item) => {
        const date = new Date(item.created_at);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    },
    { header: 'Item', key: 'itemname' },
    {
      header: 'Batch No',
      key: 'batchnumber',
      render: (item) => (
        <span style={{ fontSize: '12px' }}>
          {item.batchnumber}
        </span>
      )
    },
    {
      header: 'Initial Quantity',
      key: 'initial_quantity',
      render: (item) => `${item.initial_quantity} ${item.metric}`
    },
    {
      header: 'Remaining Quantity',
      key: 'remaining_quantity',
      render: (item) => `${item.remaining_quantity} ${item.metric}`
    },
    { header: 'Unit Cost (Ksh)', key: 'unitCost' },
    { header: 'Amount Paid (Ksh)', key: 'amountPaid' },
    {
      header: 'Payment Ref',
      key: 'paymentRef',
      render: (item) => (
        <span style={{ fontSize: '12px' }}>
          {item.paymentRef}
        </span>
      )
    },
    { header: 'Source', key: 'source' },
    {
      header: 'Actions',
      key: 'actions',
      render: (item) => (
        <button
          className='editeInventory'
          onClick={() => handleEditClick(item.inventoryV2_id)}
        >
          Edit
        </button>
      )
    },
    { header: 'Comments', key: 'note' },
  ];

  const handleEditClick = (inventoryId) => {
    setEditingInventoryId(inventoryId);
  };

  const handleCloseUpdate = () => {
    setEditingInventoryId(null);
  };

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
              <option value="delete">Delete</option>
            </select>
            <button onClick={handleAction} className="action-button">Apply</button>
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

      {editingInventoryId && (
        <div ref={editInventoryRef}>
          <UpdateInventory
            inventoryId={editingInventoryId}
            onClose={handleCloseUpdate}
            onUpdateSuccess={() => setInventory([...inventory])}
          />
        </div>
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

export default InventoryAchive;