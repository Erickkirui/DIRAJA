// Liabilities.js
import React from 'react';

const Liabilities = ({ liabilityItems }) => {
  const calculateTotalLiabilities = () => {
    return liabilityItems.reduce((total, item) => total + item.value, 0);
  };

  return (
    <div>
      <h2>Liabilities</h2>
      <ul>
        {liabilityItems.map((item, index) => (
          <li key={index}>{item.name}: ksh {item.value.toFixed(2)}</li>
        ))}
      </ul>
      <h3>Total Liabilities: ksh {calculateTotalLiabilities().toFixed(2)}</h3>
    </div>
  );
};

export default Liabilities;
