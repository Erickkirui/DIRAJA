import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../Styles/employees.css'


const AddEmployee = () => {
  const [employeeData, setEmployeeData] = useState({
    first_name: '',
    middle_name: '',
    surname: '',
    phone_number: '',
    work_email: '',
    account_status: '',
    shop_id: '', // For selecting shop
    role: '',
    personal_email: '',
    designation: '',
    national_id_number: '',
    kra_pin: '',
    monthly_gross_salary: '',
    payment_method: '',
    bank_account_number: '',
    bank_name: '',
    department: '',
    date_of_birth: '',
    starting_date: '',
    contract_termination_date: '',
    contract_renewal_date: ''
  });

  const [shops, setShops] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [shopError, setShopError] = useState(false);

  useEffect(() => {
    const fetchShops = async () => {
      try {

        const response = await axios.get('https://kulima.co.ke/api/diraja/allshops', {

          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        setShops(response.data);

        if (response.data.length === 0) {
          setShopError(true);
        }
      } catch (error) {
        console.error('Error fetching shops:', error);
        setShopError(true);
      }
    };

    fetchShops();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Convert shop_id to an integer
    const parsedValue = name === 'shop_id' ? parseInt(value, 10) : value;

    setEmployeeData({
      ...employeeData,
      [name]: parsedValue
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!employeeData.shop_id) {
      setMessage({ type: 'error', text: 'Please select a shop' });
      return;
    }

    // Log the employee data being sent to the server
    console.log('Posting employee data:', JSON.stringify(employeeData, null, 2));


    try {

      const response = await axios.post('https://kulima.co.ke/api/diraja/newemployee', employeeData, {

        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.status === 201) {
        setMessage({ type: 'success', text: 'Employee added successfully' });
        setEmployeeData({
          first_name: '',
          middle_name: '',
          surname: '',
          phone_number: '',
          work_email: '',
          account_status: '',
          shop_id: '',
          role: '',
          personal_email: '',
          designation: '',
          national_id_number: '',
          kra_pin: '',
          monthly_gross_salary: '',
          payment_method: '',
          bank_account_number: '',
          bank_name: '',
          department: '',
          date_of_birth: '',
          starting_date: '',
          contract_termination_date: '',
          contract_renewal_date: ''
        });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to add employee' });
      console.error('Error adding employee:', error);
    }
  };

  return (
    <div>
      <h1>New Employee</h1>
      <p>The files marked with (*) are mandatory</p>
    
      <form onSubmit={handleSubmit} className="employee-form">
        <h3>Account Details</h3>
        <p >These details will be used to assign a users to a shop and create an acount for the user</p>
        
        <div className="category-group">
          <select
            name="shop_id"
            value={employeeData.shop_id}
            onChange={handleChange}
            className={`select ${employeeData.shop_id ? 'valid' : 'invalid'}`}
          >
            <option value=""> -- Select a shop * -- </option>
            {shops.length > 0 ? (
              shops.map((shop) => (
                <option key={shop.shop_id} value={shop.shop_id}>
                  {shop.shopname}
                </option>
              ))
            ) : (
              <option disabled>No shops available</option>
            )}
          </select>
          {shopError && <p className="error-text">No shops available</p>}

          <select
            name="role"
            value={employeeData.role}
            onChange={handleChange}
            className="select"
          >
            <option value="">-- Select employee Role *  --</option>
            <option value="manager">Manager</option>
            <option value="clerk">Clerk</option>
          </select>
          <select
          name="account_status"
          value={employeeData.account_status || 'Active'}
          onChange={handleChange}
          className="input"
        >
          <option value="">-- Select Account Status --</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
  
          <input
            placeholder="Work email * "
            type="email"
            name="work_email"
            value={employeeData.work_email}
            onChange={handleChange}
            className="input"
          />
            <input
            placeholder="Personal email * "
            type="email"
            name="personal_email"
            value={employeeData.personal_email}
            onChange={handleChange}
            className="input"
          />

        </div>
  
        <h3>Personal Details</h3>
        <div className="category-group">
          <input
            type="text"
            placeholder="First Name * eg(John)"
            name="first_name"
            value={employeeData.first_name}
            onChange={handleChange}
            className="input"
          />
  
          <input
            placeholder="Middle Name *"
            type="text"
            name="middle_name"
            value={employeeData.middle_name}
            onChange={handleChange}
            className="input"
          />
  
          <input
            placeholder="Surname *"
            type="text"
            name="surname"
            value={employeeData.surname}
            onChange={handleChange}
            className="input"
          />
  
          <input
            placeholder="Phone number * eg (0712345678)"
            type="text"
            name="phone_number"
            value={employeeData.phone_number}
            onChange={handleChange}
            className="input"
          />
          <input
            placeholder="Designation eg (Driver)"
            type="text"
            name="designation"
            value={employeeData.designation}
            onChange={handleChange}
            className="input"
          />
        </div>
  
      
        <h3>Payment Details</h3>
        <div className="category-group">
          <input
            placeholder="Monthly Gross Salary"
            type="number"
            name="monthly_gross_salary"
            value={employeeData.monthly_gross_salary}
            onChange={handleChange}
            className="input"
          />
  
          <input
            placeholder="Payment Method"
            type="text"
            name="payment_method"
            value={employeeData.payment_method}
            onChange={handleChange}
            className="input"
          />
  
          <input
            placeholder="Bank Account Number"
            type="text"
            name="bank_account_number"
            value={employeeData.bank_account_number}
            onChange={handleChange}
            className="input"
          />
  
          <input
            placeholder="Bank Name"
            type="text"
            name="bank_name"
            value={employeeData.bank_name}
            onChange={handleChange}
            className="input"
          />
        </div>
  
        <h3>Contract Details</h3>
        <div className="category-group">
            <div className="form-field">
              <label htmlFor="date_of_birth">Date of Birth</label>
              <input
                type="date"
                name="date_of_birth"
                value={employeeData.date_of_birth}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div className="form-field">
              <label htmlFor="starting_date">Starting Date</label>
              <input
                type="date"
                name="starting_date"
                value={employeeData.starting_date}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div className="form-field">
              <label htmlFor="contract_termination_date">Contract Termination Date</label>
              <input
                type="date"
                name="contract_termination_date"
                value={employeeData.contract_termination_date}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div className="form-field">
              <label htmlFor="contract_renewal_date">Contract Renewal Date</label>
              <input
                type="date"
                name="contract_renewal_date"
                value={employeeData.contract_renewal_date}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>

  
        <button type="submit" className="employee-submit-button">
          Add Employee
        </button>
      </form>
      {message.text && (
        <div
          className={`message ${message.type === 'success' ? 'success' : 'error'}`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
  
};  

export default AddEmployee;