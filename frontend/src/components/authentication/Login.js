import React, { useEffect, useState } from "react";
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
          navigate("/home"); // Redirige a Kanban después de iniciar sesión
        }
    // Obtener el Token de ID
    const token = await user.getIdToken();
    const displayName = user.displayName;
    console.log("Token de ID:", token); // Envía este token al backend
    console.log("Usuario logueado con Google:", user);
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
        
          navigate("/home"); // Redirige a Kanban después de iniciar sesión
        
        // Actualizar el perfil del usuario en Firebase
        await updateProfile(user, { displayName: name });
  
        // Enviar el usuario registrado a la API
        await saveUserToAPI(user, name, password);

  
        alert("Usuario registrado exitosamente");
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
         const userCredential = await signInWithEmailAndPassword(auth, email, password);
         const user = userCredential.user;
         if (user) {
          navigate("/home"); // Redirige a Kanban después de iniciar sesión
        }
          // Obtener el Token de ID
          const token = await user.getIdToken();
          console.log("Token de ID:", token); // Envía este token al backend
        alert("Inicio de sesión exitoso");
      } catch (error) {
        if (error.code === "auth/too-many-requests") {
          setError("Demasiados intentos de inicio de sesión. Por favor, espera un momento e inténtalo de nuevo.");
        } else {
          setError("El correo o contraseña no son válidos");
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
    if (!user) throw new Error("No hay usuario autenticado");

    const token = await user.getIdToken();
    const response = await fetch("http://localhost:5000/api/usuarios", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
      authId: user.uid,
      email: user.email,
      username: name,
      // Campos faltantes con valores por defecto
      roles: ["ADMIN"],              // o puedes dejarlo como [] si no asignas nada
      password_hash: password              // o algún valor por defecto
    }),
    });

    const data = await response.json();
    console.log("Usuario guardado en la API:", data);

  } catch (error) {
    console.error("Error al guardar el usuario en la API:", error);
    setError("Error al guardar el usuario. Intenta nuevamente más tarde.");
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
                <div className="remember-div">
                  <input type="checkbox" id="remember-checkbox" />
                  <label htmlFor="remember-checkbox">
                    Recuerdame por 30 días
                  </label>
                </div>
                <a href="#" className="forgot-pass-link">
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
