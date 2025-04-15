import React, { useEffect, useState } from 'react'
import TableComponent from './TableComponent'
import { Alert, Stack } from '@mui/material'
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
        const response = await fetch('/api/diraja/chart-of-accounts', {
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
      }
    }

    fetchChartOfAccounts()
  }, [])

 
  const columns = ['id', 'Account', 'Account_name']

  return (
    <div className="p-4">
      <AddChartOfAccount />
      
      {message && (
        <Stack sx={{ my: 2 }}>
          <Alert severity={messageType} variant="outlined">
            {message}
          </Alert>
        </Stack>
      )}

      <h2 className="text-lg font-semibold mb-2">Chart of Accounts</h2>
      <TableComponent columns={columns} data={data} />
    </div>
  )
}

export default ChartOfAccounts
