import React, { useState, useEffect } from 'react';

const ShopRestricted = ({ children }) => {
    const [userShop, setUserShop] = useState(null);
    const [userId, setUserId] = useState(null);
    const allowedShopId = "12"; 
    const allowedUserId = "3"; // Allow user ID 3
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedShopId = localStorage.getItem('shop_id');
        const storedUserId = localStorage.getItem('user_id');

        if (storedShopId) setUserShop(storedShopId);
        if (storedUserId) setUserId(storedUserId);

        setLoading(false);
    }, []);

    if (loading) return <p>Loading...</p>;

    // Allow access if the user is from shop 12 OR if the user ID is 3
    if (userShop !== allowedShopId && userId !== allowedUserId) {
        return <p>You are not authorized to access this form.</p>;
    }

    return children;
};

export default ShopRestricted;
