import React, { useContext } from "react";
import DropdownButton from 'react-bootstrap/DropdownButton';
import "../../styles/DropNotificacion.css";
import { AuthContext } from "./AuthProvider";
import picture from "../../assets/logo.png";
import Profile from './Profile';

function LoginProfile() {
const { user } = useContext(AuthContext);
  return (
    
    <DropdownButton
      
      className="drop-notification"
      
      title={<><img
        src={user?.photoURL ? user.photoURL : picture}
        className="img-box"
        alt="imagen-perfil"
      /> </>}
      /*
      show={show} 
      onToggle={handleToggle}*/
    > 
       <Profile/>
    </DropdownButton>
  );
}

export default LoginProfile;