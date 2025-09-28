import { useAuth0 } from '@auth0/auth0-react'; 


const LoginButton = () => {
    const{loginWithRedirect}=useAuth0()
  return (
    <div>
        <button type="button" className="btn btn-primary" onClick={()=>loginWithRedirect()}>Login</button>
    </div>
  )
}

export default LoginButton