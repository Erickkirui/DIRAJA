import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AddSale = () => {
    // State to hold form data
    const [shops, setShops] = useState([]); // List of shops
    const [shopId, setShopId] = useState(''); // Selected shop
    const [item, setItem] = useState(''); // Manually entered item
    const [quantity, setQuantity] = useState(''); // Quantity of the item
    const [customerName, setCustomerName] = useState(''); // Customer name
    const [customerNumber, setCustomerNumber] = useState(''); // Customer phone number
    const [amountPaid, setAmountPaid] = useState(''); // Amount paid by the customer
    const [paymentMethod, setPaymentMethod] = useState('cash'); // Payment method (default to cash)
    const [shopError, setShopError] = useState(false); // Handle shop errors

    // State for additional fields derived from shop stock
    const [metric, setMetric] = useState('');
    const [unitPrice, setUnitPrice] = useState(0);
    const [batchNumber, setBatchNumber] = useState('');
    const [stockId, setStockId] = useState('');

    const token = localStorage.getItem('token'); // Assuming the token is stored in localStorage

    // Fetch shops when the component mounts
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

    // Fetch shop stock data when shopId changes
    useEffect(() => {
        const fetchShopStock = async () => {
            if (shopId) {
                try {
                    const response = await axios.get(`/diraja/shopstock/${shopId}`, {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('access_token')}`
                        }
                    });

                    // Assuming response.data contains the required fields
                    if (response.data) {
                        setMetric(response.data.metric);
                        setUnitPrice(response.data.unit_price);
                        setBatchNumber(response.data.BatchNumber);
                        setStockId(response.data.stock_id);
                    }
                } catch (error) {
                    console.error('Error fetching shop stock:', error);
                }
            } else {
                // Reset derived fields if no shop is selected
                setMetric('');
                setUnitPrice(0);
                setBatchNumber('');
                setStockId('');
            }
        };

        fetchShopStock();
    }, [shopId]);

    // Form submission handler
    const handleSubmit = async (e) => {
        e.preventDefault();
    
        const token = localStorage.getItem('access_token');
        if (!token) {
            alert('Authentication error: Token missing.');
            return;
        }
    
        // Fetch stock details from backend based on selected shop and item
        try {
            const stockResponse = await axios.get(`/diraja/shopstock`, {
                params: {
                    shop_id: parseInt(shopId, 10),
                    item_name: item
                },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
    
            const stockData = stockResponse.data;
            
            if (!stockData) {
                alert('No stock data available for the selected item and shop.');
                return;
            }
    
            const { BatchNumber, unit_price, metric, stock_id } = stockData;  // Extract necessary fields from stock data
    
            // Now prepare the sale data
            const saleData = {
                shop_id: parseInt(shopId, 10),  // Convert shopId to integer
                customer_name: customerName,
                customer_number: customerNumber,
                item_name: item,
                quantity: parseFloat(quantity, 10),
                amount_paid: parseFloat(amountPaid),
                payment_method: paymentMethod,
                metric: metric,             // Derived from shop stock
                unit_price: unit_price,      // Derived from shop stock
                BatchNumber: BatchNumber,    // Derived from shop stock
                stock_id: stock_id           // Derived from shop stock
            };
    
            console.log('Data being sent to backend:', saleData);
    
            const response = await axios.post('/diraja/newsale', saleData, {
                headers: {
                    Authorization: `Bearer ${token}` // use the token from localStorage
                },
            });
    
            console.log(response.data);
            alert('Sale added successfully!');
            
            // Clear form fields after submission
            setShopId('');
            setItem('');
            setQuantity('');
            setCustomerName('');
            setCustomerNumber('');
            setAmountPaid('');
            setPaymentMethod('cash');
            // Reset derived fields
            setMetric('');
            setUnitPrice(0);
            setBatchNumber('');
            setStockId('');
        } catch (error) {
            console.error('Error adding sale:', error);
            alert('Failed to add sale. Please try again.');
        }
    };
    
    

    return (
        <div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="shop_id">Shop</label>
                    <select
                        name="shop_id" 
                        value={shopId}
                        onChange={(e) => setShopId(e.target.value)}
                        className={`border p-2 w-full ${shopId ? 'text-black' : 'text-red-500'}`}
                        required
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

                {/* Item Input */}
                <label>Item</label>
                <input
                    type="text"
                    value={item}
                    onChange={(e) => setItem(e.target.value)}
                    placeholder="Enter item name"
                    required
                />

                {/* Quantity Input */}
                <label>Quantity</label>
                <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Enter quantity"
                    required
                />

                {/* Customer Name */}
                <label>Customer Name</label>
                <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                    required
                />

                {/* Customer Phone Number */}
                <label>Customer Phone Number</label>
                <input
                    type="tel"
                    value={customerNumber}
                    onChange={(e) => setCustomerNumber(e.target.value)}
                    placeholder="Enter customer phone number"
                    required
                />

                {/* Amount Paid */}
                <label>Amount Paid</label>
                <input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder="Enter amount paid"
                    required
                />

                {/* Payment Method */}
                <label>Payment Method</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} required>
                    <option value="cash">Cash</option>
                    <option value="Bank">Bank</option>
                    <option value="mobile">Mobile Money</option>
                </select>

                {/* Submit Button */}
                <button type="submit">Add Sale</button>
            </form>
        </div>
    );
};

export default AddSale;
