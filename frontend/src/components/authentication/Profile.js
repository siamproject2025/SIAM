import React, { useContext } from "react";
import { AuthContext } from "./AuthProvider";
import LogoutButton from "./LogoutButton";
import { IoMail } from "react-icons/io5";

const Profile = () => {
  const { user } = useContext(AuthContext);

  return (
    <div>
      <h6>Bienvenido: <br/> {user ? user.displayName : ""}</h6>
      {user && <p><IoMail />: {user.email}</p>}
      <LogoutButton />
    </div>
  );
};

export default Profile;
