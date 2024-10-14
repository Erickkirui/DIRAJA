import React from 'react'
import '../Styles/navigation.css'

function Navbar() {
  return (
    <>
    <div className='navigation-container'>
        <h1>DIRAJA SHOP</h1>

        <div className='main-menu'>
            <h4>MAIN MENU</h4>

            <ul>
                <li>Dashboard</li>
                <li>Sales</li>
                <li>Expenses</li>
                <li>Shops</li>
                <li>Customers</li>
                <li>Employees</li>
            </ul>
        </div>

        <div className='accounting-menu'>
            <h4>ACCOUNTING</h4>
            <ul>
                <li>Balance Sheet</li>
                <li>Cash Flow</li>
                <li>Profit and Loss</li>
            </ul>
        </div>

        

    </div>
    </>
  )
}

export default Navbar