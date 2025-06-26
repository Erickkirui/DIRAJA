import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DistributeInventoryModal from './DistributeInventoryModal';
import GeneralTableLayout from '../GeneralTableLayout';
import '../../Styles/inventory.css';

const ProcurementTable = () => {
  const [inventory, setInventory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedInventory, setSelectedInventory] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const fetchUserRole = () => {
      try {
        const token = localStorage.getItem('access_token');
        if (token) {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const decodedPayload = JSON.parse(atob(base64));
          console.log('Decoded JWT payload:', decodedPayload);

          const roleFromToken =
            decodedPayload.role || decodedPayload.user?.role || 'procurement';
          setUserRole(roleFromToken);
        } else {
          setError('No access token found');
        }
      } catch (err) {
        console.error('Error parsing JWT:', err);
        setError('Invalid token');
      }
    };

    fetchUserRole();
  }, []);

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
            'X-User-Role': 'procurement',
          },
        });
        setInventory(response.data);
      } catch (err) {
        if (err.response && err.response.status === 403) {
          setError('Access denied: You do not have permission to view this data.');
        } else {
          setError('Error fetching inventory. Please try again.');
        }
      }
    };

    fetchInventory();
  }, []);

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
        .map((inv) => inv.inventory_id);
      setSelectedInventory(currentPageIds);
    } else {
      setSelectedInventory([]);
    }
  };

  const handleAction = () => {
    if (selectedAction === 'distribute') {
      setShowModal(true);
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
              .every((item) => selectedInventory.includes(item.inventory_id))
          }
          className="select-all-checkbox"
        />
      ),
      key: 'inventory_id',
      render: (item) => (
        <input
          type="checkbox"
          checked={selectedInventory.includes(item.inventory_id)}
          onChange={() => handleCheckboxChange(item.inventory_id)}
          className="item-checkbox"
        />
      ),
      className: 'checkbox-column',
    },
    {
      header: 'Date',
      key: 'created_at',
      render: (item) => {
        const date = new Date(item.created_at);
        return (
          <span className="date-cell">
            {date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        );
      },
      className: 'date-column',
    },
    {
      header: 'Item',
      key: 'itemname',
      className: 'item-column',
    },
    {
      header: 'Batch No',
      key: 'batchnumber',
      render: (item) => <span className="batch-number-cell">{item.batchnumber}</span>,
      className: 'batch-number-column',
    },
    {
      header: 'Initial Quantity',
      key: 'initial_quantity',
      render: (item) => (
        <span className="quantity-cell">
          {`${item.initial_quantity} ${item.metric}`}
        </span>
      ),
      className: 'quantity-column',
    },
    {
      header: 'Remaining Quantity',
      key: 'remaining_quantity',
      render: (item) => (
        <span className="quantity-cell">
          {`${item.remaining_quantity} ${item.metric}`}
        </span>
      ),
      className: 'quantity-column',
    },
    {
      header: 'Unit Cost (Ksh)',
      key: 'unitCost',
      className: 'cost-column',
    },
  ];

  if (!userRole && !error) {
    return <div className="loading">Loading user permissions...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (userRole && !['procurement', 'manager'].includes(userRole)) {
    return (
      <div className="error-message">
        Access Denied: You don't have permission to view this page.
      </div>
    );
  }

  return (
    <div className="inventory-container">
      <h1>Distribute Inventory</h1>
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
            <select
              onChange={(e) => setSelectedAction(e.target.value)}
              value={selectedAction}
              disabled={selectedInventory.length === 0}
            >
              <option value="">With selected, choose an action</option>
              <option value="distribute">Distribute</option>
            </select>
            <button
              onClick={handleAction}
              className="action-button"
              disabled={selectedAction === '' || selectedInventory.length === 0}
            >
              Apply
            </button>
          </div>
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

export default ProcurementTable;
