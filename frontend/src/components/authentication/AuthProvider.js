import React, { createContext, useContext, useEffect, useState } from "react"; 
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./Auth";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    // Limpia el listener al desmontar el componente
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user: currentUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
