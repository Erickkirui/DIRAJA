import React, { useState } from 'react';
import Employees from '../Components/Employees/GetEmployees';
import { Link } from 'react-router-dom';
import SalesLeaderboard from '../Components/Employees/SalesLeaderboard';

function EmployeesPage() {
  // State to manage the active tab
  const [activeTab, setActiveTab] = useState('Employees');

  return (
    <>
    <div className='header-container'>
      <div>
      <h1>Employee</h1>
      </div>
    <Link className='add-button' to="/addemployee">Add Employees  </Link>
    </div>

      


      {/* Tabs */}
      <div className="tabs-container">
        <button 
          className={`tab-button ${activeTab === 'Employees' ? 'active' : ''}`} 
          onClick={() => setActiveTab('Employees')}
        >
          Employees
        </button>
        <button 
          className={`tab-button ${activeTab === 'employeesales' ? 'active' : ''}`} 
          onClick={() => setActiveTab('employeesales')}
        >
          Sales Leaderboard
        </button>
      </div>


      {/* Tab content */}
      <div className="tab-content">
        {activeTab === 'Employees' && <Employees />}
        {activeTab === 'employeesales' && <SalesLeaderboard />}
      </div>
    </>
  );
}


export default EmployeesPage;
