import React from 'react'
import Employees from '../Components/Employees/GetEmployees'
import { Link } from 'react-router-dom'

function EmployeesPage() {
  return (
    <div>
      <div className='header-container'>
      <h1>Employees</h1>
      <Link className='add-button' to="/addemployee">Add Employees  </Link>
      </div>
        <Employees />
    </div>
  )
}

export default EmployeesPage