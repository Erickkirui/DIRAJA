import React, { useState } from 'react';
import axios from 'axios';
import ShopRestricted from './ShopRestricted';


const AddPurchase = () => {
    const [formData, setFormData] = useState({
        itemname: '',
        quantity: '',
        price: '',
        purchase_date: ''
    });
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await axios.post('https://kulima.co.ke/api/diraja/newmabandapurchase', formData, {
                headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
            });

            setMessage(response.data.message);
            setMessageType('success');
            setFormData({ itemname: '', quantity: '', price: '', purchase_date: '' });
        } catch (error) {
            setMessageType('error');
            setMessage('Error adding purchase: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsLoading(false);
        }
    };

    return (
      
        <div>
            {message && <div className={`message ${messageType}`}>{message}</div>}
            <h1>Record a Purchase</h1>
            <form onSubmit={handleSubmit} className="clerk-sale">
                <input name="itemname" value={formData.itemname} onChange={handleChange} placeholder="Item Name" required />
                <input name="quantity" value={formData.quantity} onChange={handleChange} placeholder="Quantity" required />
                <input name="price" type="number" value={formData.price} onChange={handleChange} placeholder="Price" required />
                <input type="date" name="purchase_date" value={formData.purchase_date} onChange={handleChange} required />
                <button className="add-sale-button" type="submit" disabled={isLoading}>Add Purchase</button>
            </form>
        </div>
      
    );
};

export default AddPurchase;
