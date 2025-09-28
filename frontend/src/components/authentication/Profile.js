import React, { useContext } from "react";
import { AuthContext } from "./AuthProvider";
import LogoutButton from "./LogoutButton";

const Profile = () => {
  const { user } = useContext(AuthContext);

  return (
    <div>
      <h6>Bienvenido {user ? user.name : ""}</h6>
      {user && <p>Email: {user.email}</p>}
      <LogoutButton />
    </div>
  );
};

export default Profile;
