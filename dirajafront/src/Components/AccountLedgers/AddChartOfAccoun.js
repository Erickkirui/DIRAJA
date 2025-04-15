import React, { useEffect, useState } from 'react'
import { TextField, Button, MenuItem, Stack, Alert } from '@mui/material'

function AddChartOfAccount() {
  const [accountName, setAccountName] = useState('')
  const [accountTypeId, setAccountTypeId] = useState('')
  const [accountTypes, setAccountTypes] = useState([])
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')

  // Fetch account types on mount
  useEffect(() => {
    const fetchAccountTypes = async () => {
      const token = localStorage.getItem('access_token')

      try {
        const response = await fetch('/api/diraja/account-types/all', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await response.json()
        if (response.ok) {
          setAccountTypes(data)
        } else {
          setMessage('Failed to load account types')
          setMessageType('error')
        }
      } catch (error) {
        console.error(error)
        setMessage('Error fetching account types')
        setMessageType('error')
      }
    }

    fetchAccountTypes()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    const token = localStorage.getItem('access_token')
    if (!token) {
      setMessage('Access token not found.')
      setMessageType('error')
      return
    }

    const payload = {
      Account: accountName,
      account_type_id: accountTypeId,
    }

    try {
      const response = await fetch('/api/diraja/add-chart-of-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()
      if (response.ok) {
        setMessage('Chart of account added successfully.')
        setMessageType('success')
        setAccountName('')
        setAccountTypeId('')
      } else {
        setMessage(result.message || 'Failed to add chart of account')
        setMessageType('error')
      }
    } catch (error) {
      console.error(error)
      setMessage('An unexpected error occurred.')
      setMessageType('error')
    }
  }

  return (
    <div className="mb-6">
      {message && (
        <Stack sx={{ mb: 2 }}>
          <Alert severity={messageType} variant="outlined">
            {message}
          </Alert>
        </Stack>
      )}

      <h2 className="text-lg font-semibold mb-3">Add Chart of Account</h2>

      <form onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <TextField
            label="Account Name"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            fullWidth
            required
          />

          <TextField
            select
            label="Account Type"
            value={accountTypeId}
            onChange={(e) => setAccountTypeId(e.target.value)}
            fullWidth
            required
          >
            {accountTypes.map((type) => (
              <MenuItem key={type.id} value={type.id}>
                {type.name} - {type.type}
              </MenuItem>
            ))}
          </TextField>

          <Button type="submit" variant="contained" color="primary">
            Add Chart of Account
          </Button>
        </Stack>
      </form>
    </div>
  )
}

export default AddChartOfAccount
