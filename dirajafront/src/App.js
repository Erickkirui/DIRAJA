import './App.css';
import { BrowserRouter as Router,Routes,Route  } from 'react-router-dom';
import Managerdashord from './Pages/Managerdashord';
import ScrollTotop from './Components/ScrollTotop';
import Navbar from './Components/Navbar';
import LoginPage from './Pages/LoginPage';


const Layout = ({ children }) => {
  return(
    <>
    <div className='Page-continer'>
      <div className='navigation'>
        <Navbar/>
      </div>
      <div className='body-area'>
        {children}
      </div>
    
    </div>
    </>

  );

};


function App() {
  return (
    <div className="App">
      <Router>
        <ScrollTotop />
          <Routes>
            <Route path='/login' element={<LoginPage/>} ></Route>
            <Route path='/' element={<Layout><Managerdashord/></Layout>} ></Route>
          </Routes>
       
      </Router>
    </div>
  );
}

export default App;
