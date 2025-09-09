import React, { useEffect, useState } from 'react'

function AddChartOfAccount() {
  const [accountName, setAccountName] = useState('')
  const [accountTypeId, setAccountTypeId] = useState('')
  const [accountTypes, setAccountTypes] = useState([])
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')

  useEffect(() => {
    const fetchAccountTypes = async () => {
      const token = localStorage.getItem('access_token')

      try {
        const response = await fetch('api/diraja/account-types/all', {
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
      const response = await fetch('api/diraja/add-chart-of-accounts', {
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
    <div>
      {message && (
        <div>
          {messageType === 'success' ? 'Success: ' : 'Error: '}
          {message}
        </div>
      )}

      <h2>Add Chart of Account</h2>

      <div className='add-shop-container'>
      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="text"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            required
            placeholder='Account Name'
          />
        </div>

        <div>
          
         
          <select
            value={accountTypeId}
            onChange={(e) => setAccountTypeId(e.target.value)}
            required
          >
            <option value="">Select account type</option>
            {accountTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name} - {type.type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <button type="submit">Add Chart of Account</button>
        </div>
      </form>
      </div>
    </div>
  )
}

export default AddChartOfAccount
