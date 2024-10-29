import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AddSale = () => {
    const [saleData, setSaleData] = useState({
        shop_id: '',
        item_name: '',
        customer_name: '',
        customer_number: '',
        quantity: 0,
        payment_method: '',
        amount_paid: 0,
        batchNumber: '',
        metric: '',
        unitPrice: '',
        stock_id: ''
    });

    const [shops, setShops] = useState([]);
    const [items, setItems] = useState([]);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [shopError, setShopError] = useState(false);
    const [itemError, setItemError] = useState(false);

    useEffect(() => {
        const fetchShops = async () => {
            try {
                const response = await axios.get('/diraja/allshops', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('access_token')}`
                    }
                });
                setShops(response.data);
                if (response.data.length === 0) {
                    setShopError(true);
                }
            } catch (error) {
                console.error('Error fetching shops:', error);
                setShopError(true);
            }
        };

        fetchShops();
    }, []);

    const handleShopChange = async (e) => {
        const selectedShopId = e.target.value;
        setSaleData(prevData => ({ ...prevData, shop_id: selectedShopId }));

        if (selectedShopId) {
            try {
                const response = await axios.get(`/diraja/items/${selectedShopId}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('access_token')}`
                    }
                });
                setItems(response.data.items);
                setShopError(false); // Reset error state
            } catch (error) {
                console.error('Error fetching items:', error);
            }
        }
    };

    const handleItemChange = (e) => {
        const selectedItemId = e.target.value;

        if (selectedItemId) {
            const selectedItem = items.find(item => item.stock_id === selectedItemId);

            if (selectedItem) {
                setSaleData(prevData => ({
                    ...prevData,
                    item_name: selectedItem.itemname, // Update item_name here
                    batchNumber: selectedItem.BatchNumber,
                    metric: selectedItem.metric,
                    unitPrice: selectedItem.unitPrice,
                    stock_id: selectedItem.stock_id
                }));

                console.log("Selected item:", selectedItem); // Debugging statement
                setItemError(false); // Reset error state
            }
        } else {
            // Reset item-specific fields if no item is selected
            setSaleData(prevData => ({
                ...prevData,
                item_name: '',
                batchNumber: '',
                metric: '',
                unitPrice: '',
                stock_id: ''
            }));
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSaleData(prevData => ({
            ...prevData,
            [name]: name === 'quantity' || name === 'amount_paid' ? Number(value) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!saleData.shop_id) {
            setShopError(true);
            return;
        }
        if (!saleData.stock_id) {
            setItemError(true);
            return;
        }

        console.log('Submitting sale data:', saleData); // Ensure this is logged before submission

        try {
            const response = await axios.post('/diraja/newsale', saleData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('access_token')}`
                }
            });

            if (response.status === 201) {
                setMessage({ type: 'success', text: 'Sale added successfully' });
                setSaleData({
                    shop_id: '',
                    item_name: '',
                    customer_name: '',
                    customer_number: '',
                    quantity: 0,
                    payment_method: '',
                    amount_paid: 0,
                    batchNumber: '',
                    metric: '',
                    unitPrice: '',
                    stock_id: ''
                });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to add sale' });
            console.error('Error adding sale:', error);
        }
    };

    return (
        <div>
            {message.text && (
                <div
                    className={`p-4 mb-4 ${
                        message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                >
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="shop_id">Shop</label>
                    <select
                        name="shop_id"
                        value={saleData.shop_id}
                        onChange={handleShopChange}
                        className={`border p-2 w-full ${saleData.shop_id ? 'text-black' : 'text-red-500'}`}
                    >
                        <option value="">Select a shop</option>
                        {shops.length > 0 ? (
                            shops.map((shop) => (
                                <option key={shop.shop_id} value={shop.shop_id}>
                                    {shop.shopname}
                                </option>
                            ))
                        ) : (
                            <option disabled>No shops available</option>
                        )}
                    </select>
                    {shopError && <p className="text-red-500 mt-1">No shops available</p>}
                </div>

                <div>
                    <label htmlFor="item_name">Item</label>
                    <select
                        name="item_name"
                        value={saleData.item_name || ''} // Bind to item_name
                        onChange={handleItemChange}
                        className={`border p-2 w-full ${saleData.item_name ? 'text-black' : 'text-red-500'}`}
                    >
                        <option value="">Select an item</option>
                        {items.length > 0 ? (
                            items.map((item) => (
                                <option key={item.stock_id} value={item.stock_id}>
                                    {item.itemname}
                                </option>
                            ))
                        ) : (
                            <option disabled>No items available</option>
                        )}
                    </select>
                    {itemError && <p className="text-red-500 mt-1">Please select an item.</p>}
                </div>

                <div>
                    <label>Customer Name</label>
                    <input
                        type="text"
                        name="customer_name"
                        value={saleData.customer_name}
                        onChange={handleChange}
                        className="border p-2 w-full"
                    />
                </div>

                <div>
                    <label>Customer Number</label>
                    <input
                        type="text"
                        name="customer_number"
                        value={saleData.customer_number}
                        onChange={handleChange}
                        className="border p-2 w-full"
                    />
                </div>

                <div>
                    <label>Quantity</label>
                    <input
                        type="number"
                        name="quantity"
                        value={saleData.quantity}
                        onChange={handleChange}
                        className="border p-2 w-full"
                    />
                </div>

                <div>
                    <label>Payment Method</label>
                    <input
                        type="text"
                        name="payment_method"
                        value={saleData.payment_method}
                        onChange={handleChange}
                        className="border p-2 w-full"
                    />
                </div>

                <div>
                    <label>Amount Paid</label>
                    <input
                        type="number"
                        name="amount_paid"
                        value={saleData.amount_paid}
                        onChange={handleChange}
                        className="border p-2 w-full"
                    />
                </div>

                <button type="submit" className="bg-blue-500 text-white p-2 rounded">
                    Add Sale
                </button>
            </form>
        </div>
    );
};

export default AddSale;
