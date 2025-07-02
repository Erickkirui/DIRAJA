import React from 'react'
import GetSuppliers from '../Components/Suppliers/GetSupliers'
import { Link } from 'react-router-dom'

function Suppliers() {
  return (
    <div>
        <div className='header-container'>
            <h1>Suppliers</h1>
           <div>
            <Link className='add-button' to="/add-suplier">Add Suppliers ＋ </Link>
    
           </div>
            </div>
        <GetSuppliers />
    </div>
  )
}

export default Suppliers