// src/hooks/useUserRole.js (Crea este nuevo archivo)

import { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "../authentication/Auth"; // Asumiendo que Auth.js tiene la instancia de Firebase/Auth

const useUserRole = () => {
    // 💡 Estado para el rol: Puede ser 'ADMIN', 'DOCENTE', 'PADRE', o null si no está logueado
    const [userRole, setUserRole] = useState(null); 
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const checkRole = async () => {
            setCargando(true);
            try {
                const user = auth.currentUser;
                if (!user) {
                    setUserRole(null);
                    return;
                }

                const token = await user.getIdToken();
                const res = await axios.get("http://localhost:5000/api/usuarios/role", {
                    headers: { Authorization: `Bearer ${token}` }
                });

                // 🚀 Devuelve el rol real (ej: "ADMIN", "PADRE", etc.)
                setUserRole(res.data.role); 

            } catch (err) {
                console.error("Error verificando rol:", err);
                setUserRole(null);
            } finally {
                setCargando(false);
            }
        };

        // Escucha cambios en el estado de autenticación (si estás usando Firebase)
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                checkRole();
            } else {
                setUserRole(null);
                setCargando(false);
            }
        });

        return () => unsubscribe();
    }, []);

    // Devuelve el rol y el estado de carga
    return { userRole, cargando };
};

export default useUserRole;