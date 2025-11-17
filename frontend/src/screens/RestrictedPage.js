import React from "react";
import "../styles/RestrictedPage.css";
import { Lock } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";

const RestrictedPage = () => {
  
const navigate = useNavigate();
  return (
    <div className="restricted-container">
      <div className="restricted-content">
        <Lock className="lock-icon" />
        <h1 className="restricted-text">ACCESO RESTRINGIDO</h1>
        <button className="pin-button" onClick={() =>navigate("/dashboard")}>Regresar</button>
      </div>
    </div>
  );
};

export default RestrictedPage;
