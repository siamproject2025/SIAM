import React, {useEffect,useState} from 'react'
import "../styles/NavBar.css";
import { Link } from "react-router-dom";
import LoginProfile from "./authentication/LoginProfile";
import { RiFileEditFill } from "react-icons/ri";

const links = [
    {
      name: "Home",
      href: "/home"
    }
]

function NavBar(){

  useEffect(() => {
    // Limpiar el intervalo cuando el componente se desmonte
    
  }, []);

  return (
    <div className='navbar'>
    <p className='navTitle'><RiFileEditFill style={{fontSize:"22px",marginBottom:"4px",marginRight:"5px"}}/>
    SIAM</p>
    {links.map((x,index) =>(
                  
        <div className="nav-links" key={index}>
        <Link  to={x.href}>{x.name}</Link>
        
        </div>
        
      ))}
     

      <LoginProfile/>        
    </div>
  )
}

export default NavBar