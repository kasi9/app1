
import { Outlet, Route, Routes, useLocation } from 'react-router-dom';
import './App.css'
import "react-toastify/dist/ReactToastify.css";

import Home from './pages/Home';
import Register from './pages/register';
import Roles from './pages/roles';
import  Role from './pages/role';
import Organizations from './pages/organizations';
import Organization from './pages/organization';
import Persons from './pages/persons';
import Person from './pages/person';
import { ModalWindow } from './pages/ModalWindow';
import { Navbar } from './components/Navbar';
import { NotFound } from './pages/NotFound';
import Login from './pages/Login';
import { useEffect } from 'react';
import { useAudit } from './context/AuditContext';

import PlayListFormPage from './pages/PlayListFormPage';
import PlayListSearchPage from './pages/PlayListSearchPage';
import AssetSearchPage from './pages/AssetSearchPage';
import AssetFormPage from './pages/AssetFormPage';

const MainLayout2 = () => {
  return (

<div style={{ height: "98vh", overflow: "hidden" }}>
    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "60px", zIndex: 1000, border: "2px solid green", backgroundColor: "#fff", }} >
        <Navbar />
    </div>

    <div style={{ marginTop: "64px", height: "calc(100vh - 60px)", overflowY: "auto", border: "2px solid green", }} >
        <Outlet />
    </div>
</div>

  );
};

function App() {

  const { trackAction } = useAudit();
  const location = useLocation();

  useEffect(() => {
      trackAction(`Opened page: ${location.pathname}`);
  }, [location]);
  
  return (
    <>       
      <Routes>
        <Route element={<MainLayout2 />}>
        
            <Route path = "/" element={  <Home/> }></Route>
            <Route path = "/login" element = { <Login/> }></Route>
            <Route path = '/register' element={ <Register/> }></Route>
            
            <Route path = "/roles" element={ <Roles/> }></Route>
            <Route path = "/role" element = { <Role/> }></Route>
            <Route path = "/organizations" element = { <Organizations/> }></Route>
            <Route path = "/organization" element = { <Organization/> }></Route>
            <Route path = "/persons" element = { <Persons/> }></Route>
            <Route path = "/person" element = { <Person/> }></Route>

            <Route path = "/assetlist" element = {<AssetSearchPage></AssetSearchPage>}></Route>
            <Route path = "/asset" element = {<AssetFormPage></AssetFormPage>}></Route>

            <Route path = "/playlistlist" element = {<PlayListSearchPage></PlayListSearchPage>}></Route>
            <Route path = "/playlist" element = {<PlayListFormPage></PlayListFormPage>}></Route>
            
            <Route path="*" element={<NotFound/>} />
        </Route>
        
        <Route path = "/modal-window" element = {<ModalWindow/>}></Route>
        
      </Routes>
    </>
  )
}

export default App
