import React from 'react'
import '../Styles/navigation.css'
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <>
    <div className='navigation-container'>
        <h1>DIRAJA SHOP</h1>

        <div className='main-menu'>
            <h4>MAIN MENU</h4>

            <ul>
                <div className='menu-item'>
                    <img src='/images/Dashbord.png' alt='menu-icon' />
                    <li><Link to="/">Dashbord</Link></li>
                </div>
                <div className='menu-item'>
                    <img src='/images/Sales.png' alt='menu-icon' />
                    <li>Sales</li>
                </div>
                <div className='menu-item'>
                    <img src='/images/Expenses.png' alt='menu-icon' />
                    <li><Link to="/expenses">Expenses</Link></li>
                </div>
                <div className='menu-item'>
                    <img src='/images/Shop.png' alt='menu-icon' />
                    <li><Link to="/allshops">Shops</Link></li>
                </div>
                <div className='menu-item'>
                    <img src='/images/Customers.png' alt='menu-icon' />
                    <li>Customers</li>
                </div>
                <div className='menu-item'>
                    <img src='/images/Employees.png' alt='menu-icon' />
                    <li>Employees</li>
                </div>
                
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