import React, { useState, useEffect } from 'react';
import axios from 'axios';

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

        const response = await axios.get(' /api/diraja/allshops', {

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

      const response = await axios.post(' /api/diraja/newemployee', employeeData, {

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

    {message.text && (
      <div
        className={`message ${message.type === 'success' ? 'success' : 'error'}`}
      >
        {message.text}
      </div>
    )}

    <form onSubmit={handleSubmit} className="form">
      {/* Shop Selection */}
      <div className="form-group">
        <label htmlFor="shop_id">Shop</label>
        <select
          name="shop_id"
          value={employeeData.shop_id}
          onChange={handleChange}
          className={`select ${employeeData.shop_id ? 'valid' : 'invalid'}`}
        >
          <option value="">Select a shop</option>
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
      </div>

      {/* Employee Fields */}
      <div className="form-group">
        <label htmlFor="first_name">First Name</label>
        <input
          type="text"
          name="first_name"
          value={employeeData.first_name}
          onChange={handleChange}
          className="input"
        />
      </div>

      <div className="form-group">
        <label htmlFor="middle_name">Middle Name</label>
        <input
          type="text"
          name="middle_name"
          value={employeeData.middle_name}
          onChange={handleChange}
          className="input"
        />
      </div>

      <div className="form-group">
        <label htmlFor="surname">Surname</label>
        <input
          type="text"
          name="surname"
          value={employeeData.surname}
          onChange={handleChange}
          className="input"
        />
      </div>

      <div className="form-group">
        <label htmlFor="phone_number">Phone Number</label>
        <input
          type="text"
          name="phone_number"
          value={employeeData.phone_number}
          onChange={handleChange}
          className="input"
        />
      </div>

      <div className="form-group">
        <label htmlFor="work_email">Work Email</label>
        <input
          type="email"
          name="work_email"
          value={employeeData.work_email}
          onChange={handleChange}
          className="input"
        />
      </div>

      <div className="form-group">
  <label htmlFor="account_status">Account Status</label>
  <select
    name="account_status"
    value={employeeData.account_status || ''}
    onChange={handleChange}
    className="input"
  >
    <option value="">-- Select Account Status --</option>
    <option value="Active">Active</option>
    <option value="Inactive">Inactive</option>
  </select>
</div>


      <div className="form-group">
        <label htmlFor="role">Role</label>
        <select
          name="role"
          value={employeeData.role}
          onChange={handleChange}
          className="select"

      {message.text && (
        <div
          className={`message ${message.type === 'success' ? 'success' : 'error'}`}

        >
          {message.text}
        </div>
      )}
  
      <form onSubmit={handleSubmit} className="form">
        {/* Shop Selection */}
        <h2>Add New Employee</h2>
        <p>Adding a  new eployee will outomatically create an account for them </p>
        <div className="form-group">
          <select
            name="shop_id"
            value={employeeData.shop_id}
            onChange={handleChange}
            className={`select ${employeeData.shop_id ? 'valid' : 'invalid'}`}
          >
            <option value="">Select a shop</option>
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
        </div>
  
        {/* Employee Fields */}
        <div className="form-group">
          <input
            type="text"
            name="first_name"
            value={employeeData.first_name}
            onChange={handleChange}
            placeholder="First Name"
            className="input"
          />
        </div>
  
        <div className="form-group">
          <input
            type="text"
            name="middle_name"
            value={employeeData.middle_name}
            onChange={handleChange}
            placeholder="Middle Name"
            className="input"
          />
        </div>
  
        <div className="form-group">
          <input
            type="text"
            name="surname"
            value={employeeData.surname}
            onChange={handleChange}
            placeholder="Surname"
            className="input"
          />
        </div>
  
        <div className="form-group">
          <input
            type="text"
            name="phone_number"
            value={employeeData.phone_number}
            onChange={handleChange}
            placeholder="Phone Number"
            className="input"
          />
        </div>
  
        <div className="form-group">
          <input
            type="email"
            name="work_email"
            value={employeeData.work_email}
            onChange={handleChange}
            placeholder="Work Email"
            className="input"
          />
        </div>
  
        <div className="form-group">
          <input
            type="text"
            name="account_status"
            value={employeeData.account_status}
            onChange={handleChange}
            placeholder="Account Status"
            className="input"
          />
        </div>
  
        <div className="form-group">
          <select
            name="role"
            value={employeeData.role}
            onChange={handleChange}
            className="select"
          >
            <option value="">Select Role</option>
            <option value="manager">Manager</option>
            <option value="clerk">Clerk</option>
          </select>
        </div>
  
        <div className="form-group">
          <input
            type="email"
            name="personal_email"
            value={employeeData.personal_email}
            onChange={handleChange}
            placeholder="Personal Email"
            className="input"
          />
        </div>
  
        <div className="form-group">
          <input
            type="text"
            name="designation"
            value={employeeData.designation}
            onChange={handleChange}
            placeholder="Designation"
            className="input"
          />
        </div>
  
        <div className="form-group">
          <input
            type="text"
            name="national_id_number"
            value={employeeData.national_id_number}
            onChange={handleChange}
            placeholder="National ID Number"
            className="input"
          />
        </div>
  
        <div className="form-group">
          <input
            type="text"
            name="kra_pin"
            value={employeeData.kra_pin}
            onChange={handleChange}
            placeholder="KRA PIN"
            className="input"
          />
        </div>
  
        <div className="form-group">
          <input
            type="number"
            name="monthly_gross_salary"
            value={employeeData.monthly_gross_salary}
            onChange={handleChange}
            placeholder="Monthly Gross Salary"
            className="input"
          />
        </div>
  
        <div className="form-group">
          <input
            type="text"
            name="payment_method"
            value={employeeData.payment_method}
            onChange={handleChange}
            placeholder="Payment Method"
            className="input"
          />
        </div>
  
        <div className="form-group">
          <input
            type="text"
            name="bank_account_number"
            value={employeeData.bank_account_number}
            onChange={handleChange}
            placeholder="Bank Account Number"
            className="input"
          />
        </div>
  
        <div className="form-group">
          <input
            type="text"
            name="bank_name"
            value={employeeData.bank_name}
            onChange={handleChange}
            placeholder="Bank Name"
            className="input"
          />
        </div>
  
        <div className="form-group">
          <input
            type="text"
            name="department"
            value={employeeData.department}
            onChange={handleChange}
            placeholder="Department"
            className="input"
          />
        </div>
  
        {/* Date Fields */}
        <div className="form-group">
          <label htmlFor="date_of_birth">Date of Birth</label>
          <input
            type="date"
            name="date_of_birth"
            value={employeeData.date_of_birth}
            onChange={handleChange}
            className="input"
          />
        </div>
  
        <div className="form-group">
          <label htmlFor="starting_date">Starting Date</label>
          <input
            type="date"
            name="starting_date"
            value={employeeData.starting_date}
            onChange={handleChange}
            className="input"
          />
        </div>
  
        <div className="form-group">
          <label htmlFor="contract_termination_date">Contract Termination Date</label>
          <input
            type="date"
            name="contract_termination_date"
            value={employeeData.contract_termination_date}
            onChange={handleChange}
            className="input"
          />
        </div>
  
        <div className="form-group">
          <label htmlFor="contract_renewal_date">Contract Renewal Date</label>
          <input
          placeholder='date'
            type="date"
            name="contract_renewal_date"
            value={employeeData.contract_renewal_date}
            onChange={handleChange}
            className="input"
          />
        </div>
  
        {/* Submit Button */}
        <button type="submit" className="button">
          Add Employee
        </button>
      </form>
    </div>
  );
};  

export default AddEmployee;
