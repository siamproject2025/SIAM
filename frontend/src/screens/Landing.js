import React, {useState} from 'react'
import { useNavigate } from 'react-router-dom';
import appFirebase from "../components/authentication/Auth";
import { RiFileEditFill } from "react-icons/ri";
import { getAuth, onAuthStateChanged } from "firebase/auth";
const auth = getAuth(appFirebase);

const LandingPage = () => {
    const [user, setUser] = useState(null);
  const navigate = useNavigate();

  onAuthStateChanged(auth, (userFirebase) => {
    if (userFirebase) {
      setUser(userFirebase);
    } else {
      setUser(null);
    }
  });
  return (
    <div style={styles.container}>
       <header className="header">
        <h1 className="logo"  style={{marginTop:"10px"}}> <RiFileEditFill style={{fontSize:"22px",marginBottom:"4px",marginRight:"5px"}}/>SIAM</h1>
        {user ? null : <button className="btn btn-primary" onClick={() => navigate('/login')}>¡Inicia sesion!</button>}
      </header>

      <section style={styles.featuresSection}>
        <h2 style={styles.sectionTitle}>Landing Page</h2>
        <div style={styles.features}>
          <div style={styles.featureBox}>
            <h3>Organiza</h3>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean
              euismod bibendum laoreet.
            </p>
          </div>
          <div style={styles.featureBox}>
            <h3>Colabora</h3>
            <p>
              Proin gravida nibh vel velit auctor aliquet. Aenean sollicitudin,
              lorem quis bibendum auctor.
            </p>
          </div>
          <div style={styles.featureBox}>
            <h3>Optimiza</h3>
            <p>
              Duis sed odio sit amet nibh vulputate cursus a sit amet mauris.
              Morbi accumsan ipsum velit.
            </p>
          </div>
          <div style={styles.featureBox}>
            <h3>Optimiza</h3>
            <p>
              Duis sed odio sit amet nibh vulputate cursus a sit amet mauris.
              Morbi accumsan ipsum velit.
            </p>
          </div>
          <div style={styles.featureBox}>
            <h3>Optimiza</h3>
            <p>
              Duis sed odio sit amet nibh vulputate cursus a sit amet mauris.
              Morbi accumsan ipsum velit.
            </p>
          </div>
          <div style={styles.featureBox}>
            <h3>Optimiza</h3>
            <p>
              Duis sed odio sit amet nibh vulputate cursus a sit amet mauris.
              Morbi accumsan ipsum velit.
            </p>
          </div>
          <div style={styles.featureBox}>
            <h3>Optimiza</h3>
            <p>
              Duis sed odio sit amet nibh vulputate cursus a sit amet mauris.
              Morbi accumsan ipsum velit.
            </p>
          </div>
          <div style={styles.featureBox}>
            <h3>Optimiza</h3>
            <p>
              Duis sed odio sit amet nibh vulputate cursus a sit amet mauris.
              Morbi accumsan ipsum velit.
            </p>
          </div>
          <div style={styles.featureBox}>
            <h3>Optimiza</h3>
            <p>
              Duis sed odio sit amet nibh vulputate cursus a sit amet mauris.
              Morbi accumsan ipsum velit.
            </p>
          </div>
        </div>
      </section>

      <footer style={styles.footer}>
        <p>&copy; {new Date().getFullYear()} LoremIpsum Inc. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

const styles = {
  container: {
    fontFamily: "Arial, sans-serif",
    color: "#333",
    padding: "0 20px",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  header: {
    textAlign: "center",
    padding: "60px 20px",
    backgroundColor: "#f4f4f4",
    borderRadius: "8px",
    marginTop: "20px"
  },
  title: {
    fontSize: "3rem",
    marginBottom: "10px",
  },
  subtitle: {
    fontSize: "1.2rem",
    marginBottom: "20px",
  },
  ctaButton: {
    padding: "12px 24px",
    fontSize: "1rem",
    backgroundColor: "#007BFF",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  featuresSection: {
    marginTop: "60px",
  },
  sectionTitle: {
    fontSize: "2rem",
    textAlign: "center",
    marginBottom: "40px",
  },
  features: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-around",
    gap: "20px",
    flexWrap: "wrap",
  },
  featureBox: {
    flex: "1 1 250px",
    padding: "20px",
    backgroundColor: "#f9f9f9",
    borderRadius: "8px",
    boxShadow: "0 0 10px rgba(0,0,0,0.05)",
  },
  footer: {
    textAlign: "center",
    marginTop: "80px",
    padding: "20px 0",
    borderTop: "1px solid #ddd",
    fontSize: "0.9rem",
  },
};

export default LandingPage;
