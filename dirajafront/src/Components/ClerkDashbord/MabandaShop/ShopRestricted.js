import React, { useState, useEffect } from 'react';

const ShopRestricted = ({ children }) => {
    const [userShop, setUserShop] = useState(null);
    const allowedShopId = "2"; 
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedShopId = localStorage.getItem('shop_id');
        if (storedShopId) {
            setUserShop(storedShopId);
        }
        setLoading(false);
    }, []);

    if (loading) return <p>Loading...</p>;

    if (userShop !== allowedShopId) {
        return <p>You are not authorized to access this form.</p>;
    }

    return children;
};

export default ShopRestricted;
