import React, { useState } from 'react';
import UnpaidSales from '../Components/CreditSales/UnpaidSales';
// import CreditHistory from '../Components/CreditSales/CreditHistory';

function CreditsalePage() {


  return (
    <div>
      <h1>Credit sales</h1>
      <UnpaidSales />
        {/* <CreditHistory /> */}
      </div>
   
  );
}

export default CreditsalePage;
