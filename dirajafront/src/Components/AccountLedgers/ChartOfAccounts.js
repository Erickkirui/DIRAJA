import React, { useEffect, useState } from 'react'
import TableComponent from './TableComponent'
import AddChartOfAccount from './AddChartOfAccoun'

function ChartOfAccounts() {
  const [data, setData] = useState([])
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')

  useEffect(() => {
    const fetchChartOfAccounts = async () => {
      const token = localStorage.getItem('access_token')
      if (!token) {
        setMessageType('error')
        setMessage('Access token is missing. Please login.')
        return
      }

      try {
        const response = await fetch('api/diraja/chart-of-accounts', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const result = await response.json()

        if (response.ok) {
          setData(result.chart_of_accounts || [])
        } else {
          setMessageType('error')
          setMessage(result.message || 'Failed to fetch chart of accounts')
        }
      } catch (error) {
        setMessageType('error')
        setMessage('An error occurred while fetching chart of accounts.')
        console.error(error)
        console.log(data)
      }
    }

    fetchChartOfAccounts()
  }, [])

  const columns = ['id', 'Account', 'Account_type']

  return (
    <div>
      <AddChartOfAccount />

      {message && (
        <div>
          {messageType === 'success' ? 'Success: ' : 'Error: '}
          {message}
        </div>
      )}

      <h2>Chart of Accounts</h2>
      <TableComponent columns={columns} data={data} />
    </div>
  )
}

export default ChartOfAccounts
