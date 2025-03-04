import React, { useState } from 'react';
import axios from 'axios';
import ShopRestricted from './ShopRestricted';


const AddSale = () => {
    const [formData, setFormData] = useState({
        shop_id: '',
        itemname: '',
        quantity_sold: '',
        amount_paid: '',
        sale_date: ''
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
            const response = await axios.post('/api/diraja/newmabandasale', formData, {
                headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
            });

            setMessage(response.data.message);
            setMessageType('success');
            setFormData({ shop_id: '', itemname: '', quantity_sold: '', amount_paid: '', sale_date: '' });
        } catch (error) {
            setMessageType('error');
            setMessage('Error adding sale: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ShopRestricted>
            <div>
                <h1>Record a Sale</h1>
                <form className="clerk-sale" onSubmit={handleSubmit}>
                    <input name="itemname" value={formData.itemname} onChange={handleChange} placeholder="Item Name" required />
                    <input name="quantity_sold" value={formData.quantity_sold} onChange={handleChange} placeholder="Quantity Sold" required />
                    <input name="amount_paid" type="number" value={formData.amount_paid} onChange={handleChange} placeholder="Amount Paid" required />
                    <input type="date" name="sale_date" value={formData.sale_date} onChange={handleChange} required />
                    <button className="add-sale-button" type="submit">Add Sale</button>
                </form>
            </div>
        </ShopRestricted>
    );
};

export default AddSale;
