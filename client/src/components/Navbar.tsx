import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useState } from "react";

export const Navbar = () => {

  const { userName, setUserName, isLoggedIn, setIsLoggedIn, logout } = useUser();
  const [open, setOpen] = useState(false);
  const logoutHandler = () => { setUserName('');  logout(); setIsLoggedIn(false); };
    
    return (
    <nav className="bg-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">

          <div className="flex items-center space-x-6">
            <img src="/images9.png" className="h-6"></img>
            <span className="text-sm">App 1</span>

            <div className="hidden md:flex space-x-4">
              <ul className='list-none p-4 text-sm flex'>               
                  <li><Link to = "/" className="link">Home</Link></li>
                  <li><Link to = "/organizations" className="link">Organizations</Link></li>
                  <li><Link to = "/roles" className="link">Roles</Link></li>
                  <li><Link to = "/persons" className="link">Persons</Link></li>
                  <li><Link to = "/assetlist" className="link">Assets</Link></li>
                  <li><Link to = "/playlistlist" className="link">Play Lists</Link></li>
              </ul>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
              <ul>
                  <li> { isLoggedIn ? ( <button onClick={logoutHandler} className="link">Logout ({userName})</button> ) : ( <Link to="/login" className="link">Login</Link> ) } </li>
              </ul>
          </div>

          <button className="md:hidden" onClick={() => setOpen(!open)} > ☰ </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden px-4 pb-4 space-y-2">
          <ul>
            <li><Link to = "/organizations" className="link">Organizations</Link></li>
            <li><Link to = "/roles" className="link">Roles</Link></li>
            <li><Link to = "/persons" className="link">Persons</Link></li>
            <li><Link to = "/assetlist" className="link">Assets</Link></li>
            <li><Link to = "/playlistlist" className="link">Play Lists</Link></li>
          </ul>
          <hr className="border-gray-600" />
          <ul><li> { isLoggedIn ? ( <button onClick={logoutHandler} className="link">Logout ({userName})</button> ) : ( <Link to="/login" className="link">Login</Link> ) } </li></ul>
        </div>
      )}
    </nav>    
  );
}
