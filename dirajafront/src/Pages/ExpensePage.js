import React from 'react'
import Expenses from '../Components/Expenses/GetAllExpense'
import { Link } from 'react-router-dom';

export default function ExpensePage() {
  return (
    <div>
       <div className='header-container'>
        <h1>Expenses</h1>
        <Link to="/addexpence" className='add-button'>AddExpense ＋ </Link>
       </div>

     
      <Expenses/>
 
    </div>
  )
}

