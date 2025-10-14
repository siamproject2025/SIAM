import React, { useContext } from "react";
import DropdownButton from 'react-bootstrap/DropdownButton';
import "../../styles/DropNotificacion.css";
import { AuthContext } from "./AuthProvider";
import picture from "../../assets/logo.png";
import Profile from './Profile';

function LoginProfile() {
  const { user } = useContext(AuthContext);
  return (
    <div className="profile-container">
      <DropdownButton
        align="end"
        className="drop-notification"
        title={
          <>
            <img
              src={user?.photoURL ? user.photoURL : picture}
              className="img-box"
              alt="imagen-perfil"
            />
          </>
        }
      >
        <Profile />
      </DropdownButton>
    </div>
  );
}

export default LoginProfile;
