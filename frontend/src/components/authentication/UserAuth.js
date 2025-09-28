import React, { useEffect, useState } from 'react';
import {Auth} from "./Auth";
import { onAuthStateChanged } from 'firebase/auth';


const AuthContext = React.createContext();
const UserAuth = () => {
  return (AuthContext);
}
export function AuthProvider({children}){
    const [currentUser, setCurrentUser] = useState(null)
    const [userLoggedIn, setUserLoggedIn] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(()=>{
        const unsubscribe = onAuthStateChanged(Auth, initializerUser);
        return unsubscribe;
    },[])
}
export default UserAuth