import React from 'react'
import { Link } from 'react-router-dom';
import Sales from '../Components/GetSales'

function SalesPage() {
  return (
    <div>
        <h1>Sales</h1>
        <button><Link to="/newsale">Add Sale</Link></button>
        <Sales/>
    </div>
  )
}

export default SalesPage