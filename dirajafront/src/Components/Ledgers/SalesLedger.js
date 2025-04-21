import React, { useEffect, useState } from 'react';
import LedgerTable from './LedgerTables'

function SalesLedger() {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  const columns = ['Sale_id', 'Item_name', 'Cost_of_sale', 'Purchase_account'];

  useEffect(() => {
    const fetchSalesLedger = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        const response = await fetch('/api/diraja/sale-ledger', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch sales ledger');
        }

        const data = await response.json();
        const filteredData = data.map((sale) => ({
          sale_id: sale.sale_id,
          item_name: sale.item_name,
          cost_of_sale: sale.Cost_of_sale,
          purchase_account: sale.Purchase_account,
        }));

        setSalesData(filteredData);
      } catch (error) {
        console.error('Error fetching sales ledger:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSalesLedger();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Sales Ledger</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <LedgerTable columns={columns} data={salesData} />
      )}
    </div>
  );
}

export default SalesLedger;
