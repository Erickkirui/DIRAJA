import React, { useState } from 'react';
import axios from 'axios';
import ShopRestricted from './ShopRestricted';


const AddExpense = () => {
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        expense_date: ''
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
            const response = await axios.post('/api/diraja/newmabandaexpense', formData, {
                headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
            });

            setMessage(response.data.message);
            setMessageType('success');
            setFormData({ description: '', amount: '', expense_date: '' });
        } catch (error) {
            setMessageType('error');
            setMessage('Error adding expense: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsLoading(false);
        }
    };

    return (
      <ShopRestricted>
        <div>
            {message && <div className={`message ${messageType}`}>{message}</div>}
            <h1>Record an Expense</h1>
            <form onSubmit={handleSubmit} className="clerk-sale">
                <input name="description" value={formData.description} onChange={handleChange} placeholder="Expense Description" required />
                <input name="amount" type="number" value={formData.amount} onChange={handleChange} placeholder="Amount" required />
                <input type="date" name="expense_date" value={formData.expense_date} onChange={handleChange} required />
                <button className="add-sale-button" type="submit" disabled={isLoading}>Add Expense</button>
            </form>
        </div>
      </ShopRestricted>
    );
};

export default AddExpense;
