import React, { useEffect, useState } from 'react';
import CountShops from '../Components/ManagerDashbord/CountShops';
import CountEmployees from '../Components/ManagerDashbord/CountEmployees';
import TotalAmountPaidExpenses from '../Components/ManagerDashbord/TotalAmountPaidExpenses';
import TotalAmountPaidSales from '../Components/ManagerDashbord/TotalAmountPaidSales';
import TotalAmountPaidPurchases from '../Components/ManagerDashbord/TotalAmountPaidPurchases';
import TotalAmountPurchasesInventory from '../Components/ManagerDashbord/TotalAmountPurchasesInventory';
import { Link } from 'react-router-dom';
// import BatchStockList from '../Components/ManagerDashbord/BatchStockList';
import TotalCreditSales from '../Components/ManagerDashbord/TotalCreditSales';
import MabandaProfitLoss from'../Components/ManagerDashbord/MabandaFarmP&L';
import ItemStockList from '../Components/ManagerDashbord/ItemStocklist';
import SoldItemsList from '../Components/ManagerDashbord/SoldItemsList';
import ManagerReportStock from '../Components/ManagerDashbord/ManagerStockReport';
import ShopStatusList from '../Components/ManagerDashbord/ShopStstusList';
import InventoryStockCount from '../Components/ManagerDashbord/InventoryStockCount';
import ProductEarningsList from '../Components/ManagerDashbord/ProductEarningList';
import PendingTasksButton from '../Components/TaskManager/PendingTasksButton';
import UnresolvedReconciliationsButton from '../Components/SystemStock/UnresolvedReconciliationsButton';
import PendingReturnsButton from '../Components/Inventory/Pendingbutton';
import PendingSpoiltStockButton from '../Components/SystemStock/SpoiltButton';

function Managerdashord() {
  const [loading, setLoading] = useState(true);

  // Check the role and permissions in local storage
  useEffect(() => {
    const checkAccess = () => {
      const role = localStorage.getItem('role');
      

      if (role === 'clerk') {
        window.location.href = '/clerk';
        return;
      } else if (role === 'procurement') {
        window.location.href = '/procurement';
        return;
      }

      // Check dashboard permissions
      const userPermissions = localStorage.getItem('user_permissions');
      
      if (userPermissions) {
        try {
          const permissions = JSON.parse(userPermissions);
          
          // If Dashboard permission is false, redirect to /allinventory
          if (permissions.Dashboard === false) {
            window.location.href = '/allinventory';
            return;
          }
        } catch (error) {
          console.error('Error parsing permissions:', error);
          // If there's an error parsing permissions, allow access as fallback
        }
      } else {
        // If no permissions are stored, redirect to /allinventory for safety
        window.location.href = '/allinventory';
        return;
      }
      
      setLoading(false);
    };

    checkAccess();
  }, []);

  // Show loading while checking permissions
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Checking access permissions...
      </div>
    );
  }

  return (
    <>
      <div className='dashord-top-part'>
        <h2>Business Overview</h2>
        
        <div className="shortcuts">
           <PendingTasksButton />
           <UnresolvedReconciliationsButton />
           <PendingReturnsButton/>
           <PendingSpoiltStockButton/>

         
        </div>
       
      </div>
      <p>Analytics </p>

      <div className="top-row">
        <div className="metrix-card-container">
          <div className="metrix-pair">
            <div>
              <TotalAmountPaidSales />
            </div>
            <div>
              
              <TotalCreditSales />
            </div>
            <div>
                <TotalAmountPurchasesInventory />
                </div>
                <div>
                <TotalAmountPaidPurchases />
                </div>
            
          </div>

         
          <div className="metrix-pair">
           
           <div>
             <TotalAmountPaidExpenses />
           </div>
           <div>
             <MabandaProfitLoss />
           </div>
           <div className="metrix-pair">
           
           <div>
             <CountShops />
           </div>
       
           <div>
             <CountEmployees />
           </div>
           

           


       </div>
      
       </div>
       <div className='long-data-section'>
        {/* <BatchStockList /> */}
          <ShopStatusList />
        <ItemStockList />
        <SoldItemsList />
        <InventoryStockCount />
        {/* <ProductEarningsList /> */}
      
       </div>
          

          
       

        </div>

       
        

      </div>

      
      
    </>
  );
}

export default Managerdashord;