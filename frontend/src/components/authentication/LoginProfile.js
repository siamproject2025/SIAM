//import React, { useState, useCallback } from 'react';
import DropdownButton from 'react-bootstrap/DropdownButton';
import "../../styles/DropNotificacion.css";
import picture from "../../assets/logo.png";
import Profile from './Profile';

function LoginProfile() {/*
  const [show, setShow] = useState(false);

  const handleToggle = (isOpen) => {
    setShow(isOpen);
  };

  const handleItemClick = useCallback(() => {
    setShow(false);
  }, []);

  const { user, isAuthenticated, isLoading } = useAuth0();

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
        return <div>Inicie sesion</div>;
    }*/
  return (
    
    <DropdownButton
      
      className="drop-notification"
      
      title={<><img src={picture} className="img-box" alt='imagen-perfil'/> </>}
      /*
      show={show} 
      onToggle={handleToggle}*/
    > 
       <Profile/>
    </DropdownButton>
  );
}

export default LoginProfile;