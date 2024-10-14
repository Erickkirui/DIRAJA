import React from 'react'

function Navbar() {
  return (
    <>
    <div className='navigation-container'>
        <h1>DIRAJA SHOP</h1>

        <div className='main-menu'>
            <h2>MAIN MENU</h2>

            <ul>
                <li>Dashboardd</li>
                <li>Sales</li>
                <li>Expenses</li>
                <li>Shops</li>
                <li>Customers</li>
                <li>Employees</li>
            </ul>
        </div>
        <div className='accounting-menu'>
            <h2>ACCOUNTING</h2>
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