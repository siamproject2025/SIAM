import React, { useEffect, useState } from "react";
import Image from "../../assets/login.png"
import Logo from "../../assets/logo.png";
import { FaEye } from "react-icons/fa6";
import { FaEyeSlash } from "react-icons/fa6";
import "../../styles/login.css"
import { FcGoogle } from "react-icons/fc";
import { useForm } from "react-hook-form";
import axios from "axios";
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../authentication/Auth";
import { ArrowBigLeftDash } from 'lucide-react';
import Swal from 'sweetalert2';

const API_URL = process.env.REACT_APP_API_URL;

const Login = () => {   
  const [showPassword, setShowPassword] = useState(false);
  const [registered, setRegister] = useState(false);
  const [error, setError] = useState(null);
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();
  const navigate = useNavigate();
  

  const showError = (message) => {
    setError(message);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message,
      timer: 2000,
      showConfirmButton: false,
      position: 'top',
      toast: true
    });
    setTimeout(() => setError(null), 2000);
  };

  const showSuccess = (message) => {
    Swal.fire({
      icon: 'success',
      title: 'Éxito',
      text: message,
      timer: 2000,
      showConfirmButton: false,
      position: 'top',
      toast: true
    });
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: "select_account"
    });

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      if (user) {
        await saveUserToAPI(user, user.displayName, null);
        showSuccess("Inicio de sesión exitoso");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error en login con Google:", error.message);
      //showError("Error al iniciar sesión con Google");
    }
  };

   const functAuth = async (data) => {
  const { email, password, name } = data;
  const normalizedEmail = email.toLowerCase().trim();

  if (registered) {
    try {
      console.log("🔵 PASO 1: Creando usuario en Firebase...");
      const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      const user = userCredential.user;
      console.log("✅ Usuario creado en Firebase:", user.uid);

      console.log("🔵 PASO 2: Actualizando perfil...");
      await updateProfile(user, { displayName: name.toUpperCase() });
      
      console.log("🔵 PASO 3: Guardando en API...");
      try {
        await saveUserToAPI(user, name.toUpperCase(), password);
      } catch (apiError) {
        console.error("❌ Error en API (continuamos):", apiError);
      }

      console.log("🔵 PASO 4: Enviando email de verificación...");
      // IMPORTANTE: Enviar email antes de cualquier otra cosa que pueda interferir
      const actionCodeSettings = {
        url: 'http://localhost:3000/verify-email',
        handleCodeInApp: true
      };
      
      // Enviar email y esperar confirmación
      await sendEmailVerification(user, actionCodeSettings);
      console.log("✅ Email de verificación enviado a:", user.email);
      
      // Pequeña pausa para asegurar que el email se envió
      
      console.log("🔵 PASO 5: Cerrando sesión...");
      await auth.signOut();
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      showSuccess(`✅ Registro exitoso! Hemos enviado un correo de verificación a ${email}. Por favor revisa tu bandeja de entrada o SPAM.`);
      setRegister(false);
      reset();
      navigate("/landing"); // Redirigir al landing
      return; // Detiene la ejecución de la función
    } catch (error) {
      console.error("❌ ERROR EN REGISTRO:", {
        codigo: error.code,
        mensaje: error.message,
        errorCompleto: error
      });
      
      // Mostrar error específico
      if (error.code === 'auth/email-already-in-use') {
        showError("Este correo ya está registrado. Intenta iniciar sesión.");
      } else if (error.code === 'auth/weak-password') {
        showError("La contraseña debe tener al menos 6 caracteres.");
      } else if (error.code === 'auth/invalid-email') {
        showError("El formato del email no es válido.");
      } else if (error.code === 'auth/network-request-failed') {
        showError("Error de conexión. Verifica tu internet.");
      } else {
        showError(`Error: ${error.message}`);
      }
      
      await auth.signOut().catch(() => {});
      reset();
    }
  
  } else {
    try {
      console.log("🔵 Verificando bloqueo para:", normalizedEmail);
      const bloqueoRes = await axios.post(`${API_URL}/api/usuarios/login`, 
        { email: normalizedEmail }, 
        { validateStatus: (status) => status === 200 || status === 429 }
      );
      
      if (!bloqueoRes.data.permitido) {
        console.log("🚫 Cuenta bloqueada:", bloqueoRes.data.message);
        showError(bloqueoRes.data.message || "Cuenta bloqueada temporalmente");
        return;
      }

      console.log("🔵 Intentando iniciar sesión...");
      const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      const user = userCredential.user;
      
      console.log("✅ Usuario autenticado:", user.uid);
      console.log("📧 Email verificado:", user.emailVerified);

      if (!user.emailVerified) {
        console.log("🚫 Email no verificado, cerrando sesión...");
        await auth.signOut();
        showError("Verifica tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada o spam.");
        return;
      }

      console.log("🔵 Registrando éxito de login en API...");
      await axios.post(`${API_URL}/api/usuarios/login/exito`, { email: normalizedEmail });
      
      console.log("✅ Login exitoso, redirigiendo...");
      showSuccess("Inicio de sesión exitoso");
      navigate("/dashboard");

    } catch (error) {
      console.error("❌ Error en login:", {
        code: error.code,
        message: error.message
      });
      
      await auth.signOut().catch(() => {});
      await handleLoginError(error, normalizedEmail);
    }
  }
};
  const handleAuthError = (error) => {
    if (error.code === "auth/email-already-in-use") {
      showError("El correo ingresado ya se encuentra registrado");
    } else if (error.code === "auth/weak-password") {
      showError("La contraseña debe tener al menos 6 caracteres");
    } else if (error.code === "auth/invalid-email") {
      showError("El formato del correo electrónico no es válido");
    } else {
      showError("Error al registrar el usuario");
    }
  };

  const handleLoginError = async (error, email) => {
    if (error.response && error.response.status === 429) {
      showError(error.response.data.message || "Cuenta bloqueada temporalmente");
      return;
    }

    const code = error.code || "";

    if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
      await axios.post(`${API_URL}/api/usuarios/login/fallo`, 
        { email: email.toLowerCase().trim() }, 
        { validateStatus: (status) => status === 200 || status === 429 }
      );
      showError("Contraseña incorrecta");
    } else if (code === "auth/user-not-found") {
      showError("El usuario no existe. Por favor, regístrese.");
    } else if (code === "auth/too-many-requests") {
      showError("Demasiados intentos. Intenta nuevamente más tarde.");
    } else if (code === "auth/network-request-failed") {
      showError("Error de conexión. Verifique su internet.");
    } else {
      showError("Error al iniciar sesión");
    }
  };

  const saveUserToAPI = async (user, name, password) => {
    try {
      if (!user || !user.uid) {
        throw new Error("Usuario no válido para guardar en API");
      }

      const token = await user.getIdToken();
      
      const response = await fetch(`${API_URL}/api/usuarios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          authId: user.uid,
          email: user.email,
          username: name || user.displayName,
          password_hash: password,
          emailVerified: user.emailVerified
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error en la API");
      }

      return await response.json();
    } catch (error) {
      console.error("Error detallado al guardar usuario:", error);
      throw error;
    }
  };

  const onSubmit = (data) => {
    functAuth(data);
  };

  // Función para transformar el nombre a mayúsculas mientras escribe
  // ✅ DESPUÉS - Usar setValue de react-hook-form

const handleNameChange = (e) => {
    const upperCaseValue = e.target.value.toUpperCase().replace(/[^A-Z\s]/g, '');
    setValue("name", upperCaseValue, { shouldValidate: true });
};

  return (
    <div className="login-main">
      <div className="login-left">
        <img src={Image} alt="" />
      </div>
      <div className="login-right">
        <div className="login-right-container">
          <div className="login-logo">
            <img src={Logo} alt="" />
          </div>
          <div className="login-center">
            <h2>¡Bienvenido!</h2>
            <p>Por favor, introduzca sus datos</p>
            <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
              <input 
                autoComplete="offCom" 
                type="email" 
                placeholder="Correo" 
                id="email" 
                {...register("email", { 
                  required: "Este campo es obligatorio",
                  pattern: {
                    value: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
                    message: "Formato de email inválido",
                  }
                })}
              />
              {errors.email && <span className="loginMessage"><strong>{errors.email.message}</strong></span>}
              
              {registered && (
              <input 
                type="text" 
                placeholder="Nombre (Solo letras)"
                id="name"
                onChange={handleNameChange} // ✅ Intercepta y transforma
                {...register("name", { 
                  required: registered ? "Este campo es obligatorio" : false,
                  pattern: {
                    value: /^[A-Z\s]+$/,
                    message: "Solo se permiten letras y espacios"
                  }
                })}
              />
            )}
              {errors.name && <span className="loginMessage">{errors.name.message}</span>}
              
              <div className="pass-input-div">
                <input 
                  autoComplete="offCom" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Contraseña" 
                  id="password" 
                  {...register("password", { 
                    required: "Este campo es obligatorio",
                    pattern: registered ? {
                      value: /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                      message: "La contraseña debe incluir letra mayúscula, una letra minúscula, un número, un carácter especial y mínimo 8 caracteres."
                    } : undefined
                  })}
                />
                <div className="messageWi">
                  {errors.password && <span className="loginMessage"><strong>{errors.password.message}</strong></span>}<br/>
                  {showPassword ? 
                    <FaEyeSlash onClick={() => setShowPassword(!showPassword)} /> : 
                    <FaEye onClick={() => setShowPassword(!showPassword)} />
                  }
                </div>
              </div>

              <div className="login-center-options">
                <a className="forgot-pass-link" onClick={() => navigate("/ResetPassword")}>
                  ¿Has olvidado tu contraseña?
                </a>
              </div>
              
              <div className="login-center-buttons">
                <button type="submit" className="button">
                  {registered ? "Registrarse" : "Iniciar sesión"}
                </button>
                <button 
                  type="button" 
                  className="button" 
                  onClick={handleGoogleLogin}
                >
                  <FcGoogle style={{ marginRight: "8px" }} />
                  Ingresar con Google
                </button>
              </div>
            </form>
          </div>

          <p className="login-bottom-p">
            {registered ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"} 
            <a onClick={() => {
              setRegister(!registered);
              reset();
              setError(null);
            }} href="#">
              {registered ? "Inicia sesión" : "Regístrate"}
            </a>
          </p>
        </div>
      </div>
      <div className="login-back">
        <a href="/landing">
          <ArrowBigLeftDash size={"100%"} />
        </a>
      </div>
    </div>
  );
};

export default Login;







































/*import React, { useEffect, useState } from "react";
import Image from "../../assets/login.png"
import Logo from "../../assets/logo.png";
//import GoogleSvg from "../assets/icons8-google.svg";
import { FaEye } from "react-icons/fa6";
import { FaEyeSlash } from "react-icons/fa6";
import "../../styles/login.css"
import { FcGoogle } from "react-icons/fc";
import appFirebase from "./Auth"
import { useForm } from "react-hook-form";
import axios from "axios";
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword,signInWithEmailAndPassword,updateProfile  } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../authentication/Auth"; // tu configuración de Firebase
import { ArrowBigLeftDash } from 'lucide-react';
import ResetPassword from "./ResetPassword";

const API_URL = process.env.REACT_APP_API_URL;

const Login = () => {
  const [ showPassword, setShowPassword ] = useState(false);
  const [ registered, setRegister ] = useState(false);
  const [error, setError] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
  const provider = new GoogleAuthProvider();
   provider.setCustomParameters({
    prompt: "select_account" // Esto fuerza a elegir cuenta
  });

  try {
    const result = await signInWithPopup(auth, provider);
    // Información del usuario
    const user = result.user;
    if (user) {
          navigate("/dashboard"); // Redirige a Kanban después de iniciar sesión
        }
    // Obtener el Token de ID
    const token = await user.getIdToken();
    const displayName = user.displayName;
    
    await saveUserToAPI(user, displayName, null);
  } catch (error) {
    console.error("Error en login con Google:", error.message);
  }
};

  // Función que maneja la autenticación y el registro
  const functAuth = async (data) => {
    const { email, password, name } = data;
  
    if (registered) {
     
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
          navigate("/dashboard"); // Redirige a Kanban después de iniciar sesión
        
        // Actualizar el perfil del usuario en Firebase
        await updateProfile(user, { displayName: name });
  
        // Enviar el usuario registrado a la API
        await saveUserToAPI(user, name, password);

  
        
      } catch (error) {
        if (error.code === "auth/email-already-in-use") {
          setError("El correo ingresado ya se encuentra registrado");
        } else {
          setError("Error al registrar el usuario");
        }
        setTimeout(() => setError(null), 2000);
        reset();
      }
    } else {
      // Inicio de sesión
      try {
          //  Consultar si está bloqueado
         const bloqueoRes = await axios.post(`${API_URL}/api/usuarios/login`, 
              { email }, 
              { validateStatus: (status) => status === 200 || status === 429 } // acepta cualquier status como "normal"
          );
          if (!bloqueoRes.data.permitido) {
              setError(bloqueoRes.data.message || "Cuenta bloqueada temporalmente");
              return;
          }

         const userCredential = await signInWithEmailAndPassword(auth, email, password);
         const user = userCredential.user;
         if (user) {
          navigate("/dashboard"); // Redirige a Kanban después de iniciar sesión
        }
          // Obtener el Token de ID
          const token = await user.getIdToken();
         
         // Login exitoso → resetear intentos en backend
           await axios.post(`${API_URL}/api/usuarios/login/exito`, { email });
      } catch (error) {
          if (error.response && error.response.status === 429) {
            setError(error.response.data.message || "Cuenta bloqueada temporalmente");
            return; // cortamos el login AQUÍ
          }
            
          const code = error.code || "";

          if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
            await axios.post(`${API_URL}/api/usuarios/login/fallo`, 
            { email: email.toLowerCase().trim() }, 
            { validateStatus: (status) => status === 200 || status === 429 } 
          );
            setError("Contraseña incorrecta");
          } else if (code === "auth/user-not-found") {
            setError("El usuario no existe");
          } else if (code === "auth/too-many-requests") {
            setError("Demasiados intentos. Intenta nuevamente más tarde.");
          } else {
            setError("Error al iniciar sesión");
          }

      setTimeout(() => setError(null), 2000);
      reset();
    }
  }

  reset();
};
// Función para guardar el usuario en la 
const saveUserToAPI = async (user, name, password) => {
  try {
    if (!user || !user.uid) {
      throw new Error("Usuario no válido para guardar en API");
    }

    const token = await user.getIdToken();
    
    const response = await fetch(`${API_URL}/api/usuarios`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        authId: user.uid,
        email: user.email,
        username: name,
        password_hash: password              
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error en la API");
    }

    const data = await response.json();
    
  } catch (error) {
    console.error("Error detallado al guardar usuario:", error);
    throw error; // Propagar el error para manejarlo en el flujo principal
  }
};

  const onSubmit = (data) => {
    functAuth(data); // Pasamos los datos de formulario a la función functAuth
  };

  return (
    <div className="login-main">
      {error && (
        <>
       <svg xmlns="http://www.w3.org/2000/svg" className="d-none">
       <symbol id="exclamation-triangle-fill" viewBox="0 0 16 16">
    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
  </symbol>
       </svg>
         <div className="alert alert-danger d-flex align-items-center" role="alert"
         style={{
          position: "fixed",
          top: "20px",
          zIndex: 1050,
          width: "500px",
          height: "60px",
          boxShadow: "0 0 10px rgba(0, 0, 0, 0.2)",
          right: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          justifyContent: "center"
        }}>
         <svg className="bi flex-shrink-0 me-2" role="img" style={{width: "35px"}} aria-label="Danger:"><use href="#exclamation-triangle-fill"/></svg>
         <div>
           {error}
         </div>
       </div>
       </>
      )}
      <div className="login-left">
        <img src={Image} alt="" />
      </div>
      <div className="login-right">
        <div className="login-right-container">
          <div className="login-logo">
            <img src={Logo} alt="" />
          </div>
          <div className="login-center">
            <h2>¡Bienvenido!</h2>
            <p>Por favor, introduzca sus datos</p>
            <form autoComplete="off" onSubmit={handleSubmit(onSubmit)} >
              <input autoComplete="offCom" type="email" placeholder="Correo" id="email" {...register("email", 
                { required: {
                  value: true,
                  message: "Este campo es obligatorio"
                },
                pattern: {
                  value: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/, // Regex para validar formato de email
                  message: "Formato de email inválido", // Mensaje de error si el email no es válido
                 }
                })}/>
               {errors.email && <span className="loginMessage"><strong className="loginMessage">{errors.email.message}</strong></span>}
               {registered ? 
                      <input type="text" placeholder="Nombre" id="name" {...register("name", 
                      { required: {
                        value: true,
                        message: "Este campo es obligatorio"
                      }
                      })}/>
                      
                      : <></>}
              {errors.name && <span className="loginMessage">{errors.name.message}</span>}
              <div className="pass-input-div">
                <input autoComplete="offCom" type={showPassword ? "text" : "password"} placeholder="Contraseña" id="password" {...register("password", 
                  { required: {
                      value: true,
                      message: "Este campo es obligatorio"
                  },
                    pattern:{
                       value: /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                       message: registered
                       ?  "La contraseña debe incluir letra mayúscula, una letra minúscula, un número, un carácter especial y mínimo 8 caracteres."
                       : "Contraseña incorrecta" , 

                    }
                  })}/>
                <div className="messageWi">
                {errors.password && <span  className="loginMessage" ><strong className="loginMessage">{errors.password.message}</strong></span>}<br/>
                
                {showPassword ? <FaEyeSlash onClick={() => {setShowPassword(!showPassword)}} /> : <FaEye onClick={() => {setShowPassword(!showPassword)}} />}
                </div>
              </div>

              <div className="login-center-options">
                
                <a className="forgot-pass-link" onClick={() => navigate("/ResetPassword")}>
                  ¿Has olvidado tu contraseña?
                </a>
              </div>
              <div className="login-center-buttons">
                <button className="button">{registered ? "Registrate" : "Inicia sesion"}</button>
                <button className="button" onClick={(e) => {
                      e.preventDefault(); // evita que se haga submit
                      handleGoogleLogin();
                    }}>
                      <FcGoogle style={{ marginRight: "8px" }} />
                  Ingresar con Google
                </button>


              </div>
            </form>
          </div>

          <p className="login-bottom-p">
            {registered ? "Ya tienes cuenta?": "No tienes cuenta?"} <a onClick={()=>setRegister(!registered)} href="#">{registered ? "Inicia sesion" : "Registrate"}</a>
          </p>
        </div>
      </div>
        <div className="login-back"><a href="/landing" >
              
              <ArrowBigLeftDash size={"100%"}/>
            </a>
            </div>
    </div>
  );
};

export default Login;
*/