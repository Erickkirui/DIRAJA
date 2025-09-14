import React, { useEffect, useState } from 'react'
import axios from 'axios'
import LedgerTable from './LedgerTables'

function PurchasesLedger() {
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const columns = [
    'Suppliername',
    'itemname',
    'Transcation_type_debit',
    'Trasnaction_type_credit'
  ]
  
  useEffect(() => {
    const fetchPurchases = async () => {
      const accessToken = localStorage.getItem('access_token')
      if (!accessToken) {
        setError('Access token not found')
        setLoading(false)
        return
      }

      try {
        const res = await axios.get('api/diraja/purchases-ledger', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        setPurchases(res.data)
      } catch (err) {
        console.error(err)
        setError('Failed to fetch purchases ledger')
      } finally {
        setLoading(false)
      }
    }

    fetchPurchases()
  }, [])

  if (loading) {
    return <div className="p-4">Loading...</div>
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Purchases Ledger</h2>
      <LedgerTable columns={columns} data={purchases} />
    </div>
  )
}

export default PurchasesLedger
