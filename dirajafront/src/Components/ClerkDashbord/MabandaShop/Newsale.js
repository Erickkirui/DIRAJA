import React, { useState } from 'react';
import axios from 'axios';
import ShopRestricted from './ShopRestricted';

const AddSale = () => {
    const [formData, setFormData] = useState({
        shop_id: '',
        itemname: '',
        quantity_sold: '',
        amount_paid: '',
        sale_date: '',
        mode_of_payment: ''
    });

    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: '' }); // Clear error when user types
    };

    const validateForm = () => {
        let newErrors = {};
        Object.keys(formData).forEach(key => {
            if (!formData[key].trim()) {
                newErrors[key] = `${key.replace('_', ' ')} is required`;
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);
        try {
            const response = await axios.post('/api/diraja/newmabandasale', formData, {
                headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
            });

            setMessage(response.data.message);
            setMessageType('success');
            setFormData({ 
                shop_id: '', 
                itemname: '', 
                quantity_sold: '', 
                amount_paid: '', 
                sale_date: '', 
                mode_of_payment: '' 
            });
            setErrors({});
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
                    <input 
                        name="itemname" 
                        value={formData.itemname} 
                        onChange={handleChange} 
                        placeholder="Item Name" 
                        required 
                    />
                    {errors.itemname && <p className="error">{errors.itemname}</p>}

                    <input 
                        name="quantity_sold" 
                        value={formData.quantity_sold} 
                        onChange={handleChange} 
                        placeholder="Quantity Sold" 
                        required 
                    />
                    {errors.quantity_sold && <p className="error">{errors.quantity_sold}</p>}

                    <input 
                        name="amount_paid" 
                        type="number" 
                        value={formData.amount_paid} 
                        onChange={handleChange} 
                        placeholder="Amount Paid" 
                        required 
                    />
                    {errors.amount_paid && <p className="error">{errors.amount_paid}</p>}

                    <input 
                        type="date" 
                        name="sale_date" 
                        value={formData.sale_date} 
                        onChange={handleChange} 
                        required 
                    />
                    {errors.sale_date && <p className="error">{errors.sale_date}</p>}

                    {/* Mode of Payment Dropdown */}
                    <select 
                        name="mode_of_payment" 
                        value={formData.mode_of_payment} 
                        onChange={handleChange} 
                        required
                    >
                        <option value="">Select Mode of Payment</option>
                        <option value="Cash">Cash</option>
                        <option value="Mpesa">Mpesa</option>
                        <option value="Sasapay">Sasapay</option>
                    </select>
                    {errors.mode_of_payment && <p className="error">{errors.mode_of_payment}</p>}

                    <button className="add-sale-button" type="submit" disabled={isLoading}>
                        {isLoading ? 'Adding...' : 'Add Sale'}
                    </button>
                </form>

                {message && <p className={messageType}>{message}</p>}
            </div>
        </ShopRestricted>
    );
};

export default AddSale;
