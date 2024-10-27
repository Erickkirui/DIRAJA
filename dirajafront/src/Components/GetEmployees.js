import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ExportExcel from '../Components/Download/ExportExcel'; // Correct import path
import DownloadPDF from '../Components/Download/DownloadPDF'; // Correct import path
import '../Styles/employees.css';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [currentPage, setCurrentPage] = useState(1); // Current page state
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const itemsPerPage = 50; // Items per page

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');

        if (!accessToken) {
          setError('No access token found, please log in.');
          return;
        }

        const response = await axios.get('/diraja/allemployees', {
          headers: {
            Authorization: `Bearer ${accessToken}`,  // Use access token
          },
        });

        setEmployees(response.data); // Store the fetched employees
      } catch (err) {
        setError('Error fetching employees. Please try again.');
      }
    };

    fetchEmployees(); // Fetch employees when component loads
  }, []);

  const getFirstName = (username) => username.split(' ')[0]; // Return only the first name

  const getFirstLetter = (username) => username.charAt(0).toUpperCase(); // Return the first letter capitalized

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber); // Change the current page

  // Search filtering
  const filteredEmployees = employees.filter(
    (employee) =>
      employee.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.work_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate the current items to display
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEmployees = filteredEmployees.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="employees-container">
      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search by name, email, or role"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-bar"
      />

      {filteredEmployees.length > 0 ? (
        <>
          <table id="employees-table" className="employees-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th> {/* Display Username */}
                <th>Mail</th> {/* Display Email */}
                <th>Username</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created at</th>
              </tr>
            </thead>
            <tbody>
              {currentEmployees.map((employee) => (
                <tr key={employee.employee_id}>
                  <td>{employee.employee_id}</td>
                  <td>
                    <div className="employee-info">
                      <div className="employee-icon">{getFirstLetter(employee.first_name)}</div>
                      {/* Make the employee's name a clickable link */}
                      <a href={`/employee/${employee.employee_id}`} className="employee-name-link">
                        <span className="employee-name">{getFirstName(employee.first_name)}</span>
                      </a>
                    </div>
                  </td>
                  <td>{employee.work_email}</td>
                  <td>{employee.first_name}</td>
                  <td>{employee.role}</td>
                  <td>{employee.account_status}</td>
                  <td>{new Date(employee.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Export to Excel and PDF */}
          <div className="export-buttons">
            <ExportExcel data={employees} fileName="EmployeesData" />
            <DownloadPDF tableId="employees-table" fileName="EmployeesData" />
          </div>

          {/* Pagination */}
          <div className="pagination">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                className={`page-button ${currentPage === index + 1 ? 'active' : ''}`}
                onClick={() => handlePageChange(index + 1)}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </>
      ) : (
        <p>No employees found.</p>
      )}
    </div>
  );
};

export default Employees;
