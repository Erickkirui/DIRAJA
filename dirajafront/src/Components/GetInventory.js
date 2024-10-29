import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ExportExcel from '../Components/Download/ExportExcel';
import DownloadPDF from '../Components/Download/DownloadPDF';
import '../Styles/inventory.css';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedInventory, setSelectedInventory] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [shopId, setShopId] = useState('');
  const [quantity, setQuantity] = useState('');
  const itemsPerPage = 50;

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
          setError('No access token found, please log in.');
          return;
        }
        const response = await axios.get('/diraja/allinventories', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setInventory(response.data);
      } catch (err) {
        setError('Error fetching inventory. Please try again.');
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

  const handleSelectAll = () => {
    setSelectedInventory(
      selectedInventory.length === inventory.length ? [] : inventory.map((inv) => inv.inventory_id)
    );
  };

  const handleAction = () => {
    if (selectedAction === 'distribute') {
      setShowModal(true); // Open modal to input shop_id and quantity
    } else if (selectedAction === 'delete') {
      handleDelete();
    }
  };

  const handleDelete = async () => {
    const accessToken = localStorage.getItem('access_token');
    await Promise.all(
      selectedInventory.map((inventoryId) =>
        axios.delete(`/diraja/inventory/${inventoryId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
      )
    );
    setInventory((prev) => prev.filter((inv) => !selectedInventory.includes(inv.inventory_id)));
    setSelectedInventory([]);
    setSelectedAction('');
  };

  const handleDistribute = async (e) => {
    e.preventDefault();
    const accessToken = localStorage.getItem('access_token');
    try {
      await Promise.all(
        selectedInventory.map(async (inventoryId) => {
          const inventoryItem = inventory.find((item) => item.inventory_id === inventoryId);
          const requestData = {
            shop_id: parseInt(shopId),
            inventory_id: inventoryItem.inventory_id,
            quantity: parseInt(quantity),
            metric: inventoryItem.metric,
            itemname: inventoryItem.itemname,
            unitCost: inventoryItem.unitCost,
            amountPaid: inventoryItem.amountPaid,
            BatchNumber: inventoryItem.batchnumber,
          };
          await axios.post('/diraja/transfer', requestData, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
        })
      );
      alert('Inventory distributed successfully');
      setSelectedInventory([]);
      setShowModal(false);
      setSelectedAction('');
      setShopId('');
      setQuantity('');
    } catch (error) {
      console.error('Error distributing inventory:', error);
      alert('Error distributing inventory. Please try again.');
    }
  };

  const filteredInventory = inventory.filter((inventoryItem) => {
    const searchString = searchTerm.toLowerCase();
    const matchesSearch =
      inventoryItem.itemname.toLowerCase().includes(searchString) ||
      inventoryItem.batchnumber.toLowerCase().includes(searchString) ||
      inventoryItem.note.toLowerCase().includes(searchString);
    const matchesDateRange =
      selectedDate === '' || new Date(inventoryItem.created_at).toISOString().split('T')[0] === selectedDate;
    return matchesSearch && matchesDateRange;
  });

  const currentInventory = filteredInventory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="inventory-container">
      <div className="actions">
        <select onChange={(e) => setSelectedAction(e.target.value)} value={selectedAction}>
          <option value="">With selected, choose an action</option>
          <option value="delete">Delete</option>
          <option value="distribute">Distribute</option>
        </select>
        <button onClick={handleAction} className="action-button">Apply</button>
      </div>

      <input
        type="text"
        placeholder="Search by item, batch number, or note"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input"
      />

      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        className="date-picker"
      />

      {/* Popup Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Distribute Inventory</h3>
            <form onSubmit={handleDistribute}>
              <label>Shop ID</label>
              <input
                type="number"
                value={shopId}
                onChange={(e) => setShopId(e.target.value)}
                required
              />
              <label>Quantity to Transfer</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
              <button type="submit">Distribute</button>
              <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      <table className="inventory-table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                onChange={handleSelectAll}
                checked={selectedInventory.length === inventory.length}
              />
            </th>
            <th>ID</th>
            <th>Item</th>
            <th>Batch No</th>
            <th>Initial Quantity</th>
            <th>Remaining Quantity</th>
            <th>Unit Cost (Ksh)</th>
            <th>Total Cost (Ksh)</th>
            <th>Amount Paid (Ksh)</th>
            <th>Balance (Ksh)</th>
            <th>Comments</th>
            <th>Unit Price (Ksh)</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {currentInventory.map((inventoryItem) => (
            <tr key={inventoryItem.inventory_id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedInventory.includes(inventoryItem.inventory_id)}
                  onChange={() => handleCheckboxChange(inventoryItem.inventory_id)}
                />
              </td>
              <td>{inventoryItem.inventory_id}</td>
              <td>{inventoryItem.itemname}</td>
              <td>{inventoryItem.batchnumber}</td>
              <td>{inventoryItem.initial_quantity} {inventoryItem.metric}</td>
              <td>{inventoryItem.remaining_quantity} {inventoryItem.metric}</td>
              <td>{inventoryItem.unitCost}</td>
              <td>{inventoryItem.totalCost}</td>
              <td>{inventoryItem.amountPaid}</td>
              <td>{inventoryItem.balance}</td>
              <td>{inventoryItem.note}</td>
              <td>{inventoryItem.unitPrice}</td>
              <td>{new Date(inventoryItem.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="export-buttons">
        <ExportExcel data={inventory} fileName="InventoryData" />
        <DownloadPDF tableId="inventory-table" fileName="InventoryData" />
      </div>

      <div className="pagination">
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index}
            className={`page-button ${currentPage === index + 1 ? 'active' : ''}`}
            onClick={() => handlePageChange(index + 1)}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Inventory;
