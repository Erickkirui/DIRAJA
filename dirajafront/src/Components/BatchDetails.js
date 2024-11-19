import React, { useEffect, useState } from 'react';
import axios from 'axios';

const BatchDetails = ({ batchNumber, onDetailsFetched }) => {
    const [batchDetails, setBatchDetails] = useState({});
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!batchNumber) return;

        const fetchBatchDetails = async () => {
            try {
                const response = await axios.get('/api/diraja/batch-details', {
                    params: { BatchNumber: batchNumber },
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('access_token')}`
                    }
                });

                const { itemname, metric, unit_price, stock_id } = response.data;
                setBatchDetails({ itemname, metric, unit_price, stock_id });

                if (onDetailsFetched) {
                    onDetailsFetched({ itemname, metric, unit_price, stock_id });
                }
            } catch (error) {
                console.error('Error fetching batch details:', error);
                setError('Error fetching batch details');
            }
        };

        fetchBatchDetails();
    }, [batchNumber, onDetailsFetched]);

    if (!batchNumber) {
        return null;
    }

    return (
        <div>
            {error && <p className="error">{error}</p>}
            {batchDetails.itemname && (
                <div className="item-details">
                    <span className="label">Item Name:</span>
                    <span className="value">{batchDetails.itemname}</span>
                </div>
            )}
            {batchDetails.metric && (
                <div className="item-details">
                    <span className="label">Metric:</span>
                    <span className="value">{batchDetails.metric}</span>
                </div>
            )}
            {batchDetails.unit_price && (
                <div className="item-details">
                    <span className="label">Unit Price:</span>
                    <span className="value">{batchDetails.unit_price}</span>
                </div>
            )}
            {batchDetails.stock_id && (
                <div className="item-details">
                    <span className="label">Stock ID:</span>
                    <span className="value">{batchDetails.stock_id}</span>
                </div>
            )}
        </div>
    );
};

export default BatchDetails;
