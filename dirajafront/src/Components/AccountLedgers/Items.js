import React, { useEffect, useState } from 'react'
import TableComponent from './TableComponent'
import { Alert, Stack } from '@mui/material'
import CreateItemAccount from './CreateItemAccounts'

function Items() {
  const [data, setData] = useState([])
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')

  useEffect(() => {
    const fetchItemAccounts = async () => {
      const token = localStorage.getItem('access_token')
      if (!token) {
        setMessageType('error')
        setMessage('Access token is missing. Please login.')
        return
      }

      try {
        const response = await fetch('/api/diraja/itemaccounts/all', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const result = await response.json()

        if (response.ok) {
          setData(result.item_accounts || [])
        } else {
          setMessageType('error')
          setMessage(result.message || 'Failed to fetch item accounts')
        }
      } catch (error) {
        setMessageType('error')
        setMessage('An error occurred while fetching item accounts.')
        console.error(error)
      }
    }

    fetchItemAccounts()
  }, [])

  const columns = ['ID', 'Item', 'account']

  return (
    <div>
      <CreateItemAccount />
      {message && (
        <Stack sx={{ my: 2 }}>
          <Alert severity={messageType} variant="outlined">
            {message}
          </Alert>
        </Stack>
      )}

      <h2 className="text-lg font-semibold mb-2">Item Accounts</h2>
      <TableComponent columns={columns} data={data} />
    </div>
  )
}

export default Items
