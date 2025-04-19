import React from 'react';
import '../../Styles/Accounts.css';

function AccountCard({ accountName, accountBalance }) {
  return (
    <div >
      <div className='account-card'>
        <div className='top-account-card'>
          <h2>{accountName}</h2>
        </div>
        <div className='bottom-account-card'>
          <h1>Ksh {parseFloat(accountBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h1>
          <p>Available Balance</p>
        </div>
      </div>
    </div>
  );
}

export default AccountCard;
