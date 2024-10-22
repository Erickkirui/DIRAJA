import React from 'react'
import Expenses from '../Components/GetAllExpense'
import { Link } from 'react-router-dom';

export default function ExpensePage() {
  return (
    <div>
      <h1>Expenses</h1>
        <button><Link to="/addexpence">AddExpense</Link></button>
      <Expenses/>
    </div>
  )
}

