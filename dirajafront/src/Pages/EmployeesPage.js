import React from 'react'
import Employees from '../Components/GetEmployees'
import { Link } from 'react-router-dom'

function EmployeesPage() {
  return (
    <div>
      <h1>Employees</h1>
      <button><Link to="/addemployee">AddEmployee</Link></button>
        <Employees />
    </div>
  )
}

export default EmployeesPage