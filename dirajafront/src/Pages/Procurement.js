import React from 'react'
import { Link } from 'react-router-dom'
import '../Styles/procurement.css'

function Procurement() {
  return (
    <div className='procument-container'>
      <Link  to='/distribute' className='button'> Inventory </Link>
      <Link to='/newinventory' className='secondary-button'> Add Inventory </Link>
      <Link  className='secondary-button'> Transfers </Link>
    </div>
  )
}

export default Procurement
