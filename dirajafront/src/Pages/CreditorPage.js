import React, { useState } from 'react';
import AddCreditor from '../Components/Creditors/AddCreditor';
import CreditorsList from '../Components/Creditors/CreditorList';

function CreditorPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCreditorAdded = () => {
    // Trigger refresh of the creditors list
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '20px',
        alignItems: 'flex-start',
        padding: '20px',
      }}
    >
      {/* Left: Add Creditor Form */}
      <div style={{ flex: '1', maxWidth: '400px' }}>
        <AddCreditor onSuccess={handleCreditorAdded} />
      </div>

      {/* Right: Creditors List */}
      <div style={{ flex: '2' }}>
        <CreditorsList key={refreshTrigger} />
      </div>
    </div>
  );
}
  
export default CreditorPage;