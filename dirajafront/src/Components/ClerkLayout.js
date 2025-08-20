import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ClerkNavbar from './ClerkDashbord/ClerkNavbar';
import UserDisplay from './UserDisplay';

const ClerkLayout = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const reportStatus = localStorage.getItem('report_status');

    if (reportStatus === null || reportStatus === 'false') {
      navigate('/shop-stock-level');
    }
  }, [navigate]);

  return (
    <div className='Page-continer'>
      <div className='clerk-navigation'>
        <ClerkNavbar />
      </div>
      <div className='body-area'>
        <div className='body-header'>
          <UserDisplay />
        </div>
        <div className='page-area'>
          {children}
        </div>
      </div>
    </div>
  );
};

export default ClerkLayout;
