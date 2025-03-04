// import React, { useState } from 'react';
// import axios from 'axios';
// import ShopRestricted from './ShopRestricted';


// const AddStock = () => {
//     const [formData, setFormData] = useState({
//         itemname: '',
//         quantity: '',
//         price: '',
//         date_added: ''
//     });
//     const [message, setMessage] = useState('');
//     const [messageType, setMessageType] = useState('');
//     const [isLoading, setIsLoading] = useState(false);

//     const handleChange = (e) => {
//         setFormData({ ...formData, [e.target.name]: e.target.value });
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setIsLoading(true);

//         try {
//             const response = await axios.post('/api/diraja/mabandastock', formData, {
//                 headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
//             });

            

// export default AddStock;

import React, { useState } from 'react';
import axios from 'axios';
import ShopRestricted from './ShopRestricted';


const AddStock = () => {
    const [formData, setFormData] = useState({
        itemname: '',
        quantity: '',
        price: '',
        date_added: ''
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
            const response = await axios.post('/api/diraja/newmabandastock', formData, {
                headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
            });

            setMessage(response.data.message);
            setMessageType('success');
            setFormData({ itemname: '', quantity: '', price: '', date_added: '' });
        } catch (error) {
            setMessageType('error');
            setMessage('Error adding stock: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsLoading(false);
        }
    };

    return (
      <ShopRestricted>
        <div>
            {message && <div className={`message ${messageType}`}>{message}</div>}
            <h1>Record Stock</h1>
            <form onSubmit={handleSubmit} className="clerk-sale">
                <input name="itemname" value={formData.itemname} onChange={handleChange} placeholder="Item Name" required />
                <input name="quantity" value={formData.quantity} onChange={handleChange} placeholder="Quantity" required />
                <input name="price" type="number" value={formData.price} onChange={handleChange} placeholder="Price" required />
                <input type="date" name="date_added" value={formData.date_added} onChange={handleChange} required />
                <button className="add-sale-button" type="submit" disabled={isLoading}>Add Stock</button>
            </form>
        </div>
      </ShopRestricted>
    );
};

export default AddStock;

