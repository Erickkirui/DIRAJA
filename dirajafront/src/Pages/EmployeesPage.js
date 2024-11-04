import React from 'react'
import Employees from '../Components/GetEmployees'
import { Link } from 'react-router-dom'

function EmployeesPage() {
  return (
    <div>
      <div className='header-container'>
      <h1>Employees</h1>
      <button className='add-button' ><Link to="/addemployee">Add Employees  </Link></button>
      </div>
        <Employees />
    </div>
  )
}

export default EmployeesPage