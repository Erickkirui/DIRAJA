import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AddSale = () => {
    const [shops, setShops] = useState([]);
    const [items, setItems] = useState([]);
    const [selectedShop, setSelectedShop] = useState('');
    const [selectedItem, setSelectedItem] = useState('');
    const [quantity, setQuantity] = useState(0);
    const [customerName, setCustomerName] = useState('');
    const [customerNumber, setCustomerNumber] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [amountPaid, setAmountPaid] = useState(0);
    const [formErrors, setFormErrors] = useState({});
    const token = localStorage.getItem('jwt_token'); // Assuming you store your token in local storage

    useEffect(() => {
        const fetchShops = async () => {
            try {
                const response = await axios.get('/diraja/allshops', {
                    headers: {
                        Authorization: `Bearer ${token}`, // Include token in header
                    },
                });
                setShops(response.data);
            } catch (error) {
                console.error('Error fetching shops:', error);
                // Handle error (e.g., show alert)
            }
        };

        fetchShops();
    }, [token]);

    useEffect(() => {
        if (selectedShop) {
            const fetchItems = async () => {
                try {
                    const response = await axios.get(`/diraja/items/${selectedShop}`, {
                        headers: {
                            Authorization: `Bearer ${token}`, // Include token in header
                        },
                    });
                    setItems(response.data.items);
                } catch (error) {
                    console.error('Error fetching items:', error);
                    // Handle error (e.g., show alert)
                }
            };

            fetchItems();
        }
    }, [selectedShop, token]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        // Basic validation
        const errors = {};
        if (!selectedShop) errors.selectedShop = 'Shop is required';
        if (!selectedItem) errors.selectedItem = 'Item is required';
        if (quantity <= 0) errors.quantity = 'Quantity must be greater than zero';
        if (!customerName) errors.customerName = 'Customer name is required';
        if (!customerNumber) errors.customerNumber = 'Customer number is required';
        if (!paymentMethod) errors.paymentMethod = 'Payment method is required';
        if (amountPaid <= 0) errors.amountPaid = 'Amount paid must be greater than zero';

        setFormErrors(errors);

        if (Object.keys(errors).length > 0) return; // Stop submission if errors exist

        const saleData = {
            shop_id: selectedShop,
            item_id: selectedItem,
            quantity: quantity,
            customer_name: customerName,
            customer_number: customerNumber,
            payment_method: paymentMethod,
            amount_paid: amountPaid,
        };

        try {
            const response = await axios.post('/diraja/newsale', saleData, {
                headers: {
                    Authorization: `Bearer ${token}`, // Include token in header
                },
            });
            alert('Sale added successfully');
            // Reset form
            setSelectedShop('');
            setSelectedItem('');
            setQuantity(0);
            setCustomerName('');
            setCustomerNumber('');
            setPaymentMethod('');
            setAmountPaid(0);
        } catch (error) {
            console.error('There was an error adding the sale!', error);
            alert('Failed to add sale');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label htmlFor="shop">Shop:</label>
                <select
                    id="shop"
                    value={selectedShop}
                    onChange={(e) => setSelectedShop(e.target.value)}
                >
                    <option value="">Select a shop</option>
                    {shops.map((shop) => (
                        <option key={shop.id} value={shop.id}>
                            {shop.name}
                        </option>
                    ))}
                </select>
                {formErrors.selectedShop && <span>{formErrors.selectedShop}</span>}
            </div>
            <div>
                <label htmlFor="item">Item:</label>
                <select
                    id="item"
                    value={selectedItem}
                    onChange={(e) => setSelectedItem(e.target.value)}
                >
                    <option value="">Select an item</option>
                    {items.map((item) => (
                        <option key={item.id} value={item.id}>
                            {item.name}
                        </option>
                    ))}
                </select>
                {formErrors.selectedItem && <span>{formErrors.selectedItem}</span>}
            </div>
            <div>
                <label htmlFor="quantity">Quantity:</label>
                <input
                    type="number"
                    id="quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                />
                {formErrors.quantity && <span>{formErrors.quantity}</span>}
            </div>
            <div>
                <label htmlFor="customerName">Customer Name:</label>
                <input
                    type="text"
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                />
                {formErrors.customerName && <span>{formErrors.customerName}</span>}
            </div>
            <div>
                <label htmlFor="customerNumber">Customer Number:</label>
                <input
                    type="text"
                    id="customerNumber"
                    value={customerNumber}
                    onChange={(e) => setCustomerNumber(e.target.value)}
                />
                {formErrors.customerNumber && <span>{formErrors.customerNumber}</span>}
            </div>
            <div>
                <label htmlFor="paymentMethod">Payment Method:</label>
                <input
                    type="text"
                    id="paymentMethod"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                />
                {formErrors.paymentMethod && <span>{formErrors.paymentMethod}</span>}
            </div>
            <div>
                <label htmlFor="amountPaid">Amount Paid:</label>
                <input
                    type="number"
                    id="amountPaid"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                />
                {formErrors.amountPaid && <span>{formErrors.amountPaid}</span>}
            </div>
            <button type="submit">Add Sale</button>
        </form>
    );
};

export default AddSale;
