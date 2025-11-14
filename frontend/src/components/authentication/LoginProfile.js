import React, { useState, useEffect } from "react";
import DropdownButton from 'react-bootstrap/DropdownButton';
import "../../styles/DropNotificacion.css";
import { AuthContext } from "./AuthProvider";
import picture from "../../assets/logo.png";
import Profile from './Profile';
import { auth } from "../../components/authentication/Auth";

function LoginProfile() {
  const user = auth.currentUser;
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(picture);

  useEffect(() => {
    if (user?.photoURL) {
      setImageLoaded(false);
      setImageError(false);
      setImageSrc(user.photoURL);
    } else {
      setImageSrc(picture);
      setImageLoaded(true);
    }
  }, [user?.photoURL]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
    setImageSrc(picture);
  };

  return (
    <div className="profile-container">
      <DropdownButton
        align="end"
        className="drop-notification"
        title={
          <div className="image-container">
            {!imageLoaded && (
              <div className="image-loading">
                <div className="loading-spinner"></div>
              </div>
            )}
            <img
              src={imageSrc}
              className={`img-box ${!imageLoaded ? 'hidden' : ''}`}
              alt="imagen-perfil"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          </div>
        }
      >
        <Profile />
      </DropdownButton>
    </div>
  );
}

export default LoginProfile;