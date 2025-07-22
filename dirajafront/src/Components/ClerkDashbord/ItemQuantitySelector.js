import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ItemQuantitySelector = ({ selectedItemId, onQuantityChange, onUnitTypeChange }) => {
 const [stockItems, setStockItems] = useState([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState('');
 const [selectedItem, setSelectedItem] = useState(null);
 const [unitType, setUnitType] = useState('pieces'); // 'pieces' or 'pack'
 const [quantity, setQuantity] = useState(1);

 useEffect(() => {
 const fetchStockItems = async () => {
 const accessToken = localStorage.getItem('access_token');
 if (!accessToken) {
 setError('User is not authenticated');
 setLoading(false);
 return;
 }

 try {
 const response = await axios.get('/api/diraja/stockitems', {
 headers: {
 Authorization: `Bearer ${accessToken}`,
 },
 });

 if (response.status === 200) {
 setStockItems(response.data.stock_items || []);
 }
 } catch (error) {
 setError('An error occurred while fetching stock items');
 } finally {
 setLoading(false);
 }
 };

 fetchStockItems();
 }, []);

 useEffect(() => {
 if (selectedItemId && stockItems.length > 0) {
 const item = stockItems.find(item => item.id === selectedItemId);
 setSelectedItem(item);
 }
 }, [selectedItemId, stockItems]);

 const handleUnitTypeChange = (e) => {
 const newUnitType = e.target.value;
 setUnitType(newUnitType);
 onUnitTypeChange(newUnitType);
 };

 const handleQuantityChange = (e) => {
 const newQuantity = parseInt(e.target.value) || 0;
 setQuantity(newQuantity);
 
 // Calculate the effective quantity based on unit type
 const effectiveQuantity = unitType === 'pack' && selectedItem?.pack_quantity 
 ? newQuantity * selectedItem.pack_quantity 
 : newQuantity;
 
 onQuantityChange(effectiveQuantity);
 };

 if (loading) return <p>Loading items...</p>;
 if (error) return <p style={{ color: 'red' }}>{error}</p>;

 return (
 <div className="item-quantity-selector">
 {selectedItem && selectedItem.pack_quantity ? (
 <>
 <div className="form-group">
 <label htmlFor="unitType">Selling Unit:</label>
 <select 
 id="unitType" 
 value={unitType}
 onChange={handleUnitTypeChange}
 className="form-control"
 >
 <option value="pieces">Pieces</option>
 <option value="pack">Pack</option>
 </select>
 </div>
 
 <div className="form-group">
 <label htmlFor="quantity">
 {unitType === 'pack' ? 'Number of Packs' : 'Quantity'}:
 </label>
 <input
 type="number"
 id="quantity"
 min="1"
 value={quantity}
 onChange={handleQuantityChange}
 className="form-control"
 />
 {unitType === 'pack' && (
 <small className="text-muted">
 Each pack contains {selectedItem.pack_quantity} pieces
 </small>
 )}
 </div>
 </>
 ) : (
 <div className="form-group">
 <label htmlFor="quantity">Quantity:</label>
 <input
 type="number"
 id="quantity"
 min="1"
 value={quantity}
 onChange={handleQuantityChange}
 className="form-control"
 />
 </div>
 )}
 </div>
 );
};

export default ItemQuantitySelector;