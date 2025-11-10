import React from "react";
import "../styles/RestrictedPage.css";
import { Lock } from "lucide-react";
import { Navigate } from "react-router-dom";

const RestrictedPage = () => {
  return (
    <div className="restricted-container">
      <div className="restricted-content">
        <Lock className="lock-icon" />
        <h1 className="restricted-text">ACCESO RESTRINGIDO</h1>
        <button className="pin-button"><Navigate to="" replace/>Regresar</button>
      </div>
    </div>
  );
};

export default RestrictedPage;
