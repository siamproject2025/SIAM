import React, { useContext, useState } from "react";
import { AuthContext } from "./AuthProvider";
import LogoutButton from "./LogoutButton";
import { IoMail } from "react-icons/io5";
import picture from "../../assets/logo.png";

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [imageError, setImageError] = useState(false);

  const handleImageError = (e) => {
    setImageError(true);
    e.target.src = picture;
  };

  return (
    <div>
      <div className="dropdown-header">
        <h6>Mi Cuenta</h6>
        <p>Gestiona tu perfil</p>
      </div>
      
      <div style={{ padding: '20px' }}>
        <div className="user-info">
          <img
            src={imageError || !user?.photoURL ? "/default-avatar.png" : user.photoURL}
            className="user-avatar"
            alt="avatar"
            onError={handleImageError}
          />
          <div className="user-details">
            <h6>{user ? user.displayName : "Usuario"}</h6>
            <p>Bienvenido de vuelta</p>
          </div>
        </div>
        
        {user && (
          <p>
            <IoMail style={{ color: '#8B5FBF' }} />
            {user.email}
          </p>
        )}
        
        <LogoutButton />
      </div>
    </div>
  );
};

export default Profile;