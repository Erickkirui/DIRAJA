import React from 'react'
import Expenses from '../Components/GetAllExpense'
import { Link } from 'react-router-dom';

export default function ExpensePage() {
  return (
    <div>
       <div className='header-container'>
        <h1>Expenses</h1>
        <button className='add-button'><Link to="/addexpence">AddExpense ＋ </Link></button>

       </div>
     
      <Expenses/>
    </div>
  )
}

