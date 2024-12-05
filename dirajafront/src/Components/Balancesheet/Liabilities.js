import React from "react";

const Liabilities = ({ liabilities }) => {
  return (
    <div className="categories">
      <h2>Liabilities</h2>
      <ul>
        {liabilities.map((item, index) => (
          <li key={index}>
            {item.name}: ksh {item.amount?.toLocaleString() || "0.00"}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Liabilities;
