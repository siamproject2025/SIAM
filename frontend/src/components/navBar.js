import React, {useEffect,useState} from 'react'
import "../styles/NavBar.css";
import { Link } from "react-router-dom";
import LoginProfile from "./authentication/LoginProfile";
import { RiFileEditFill } from "react-icons/ri";
import { Music } from 'lucide-react';

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
    <a href="#inicio" className="logo">
              <Music size={24} />
              S.I.A.M.
            </a>
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