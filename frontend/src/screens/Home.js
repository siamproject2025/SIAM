import React from "react";
import { Link } from 'react-router-dom';
import OrdenCompra from "./Models/ordencompra";

const Home = () => {
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>Pagina Home</h1>
        <p>Tu sistema inteligente de administración y monitoreo.</p>
      </header>

      <section style={styles.section}>
        <h2>Resumen general</h2>
        <div style={styles.cardsContainer}>


         <div style={styles.card}>
      <Link to="/ordencompra" style={{ textDecoration: 'none' }}>
        <p>Modulo orden</p>
      </Link>
    </div>



          <div style={styles.card}>
            <h3>Tareas</h3>
            <p>14 pendientes</p>
          </div>
          <div style={styles.card}>
            <h3>Colaboradores</h3>
            <p>8 conectados</p>
          </div>
          <div style={styles.card}>
            <h3>Proyectos</h3>
            <p>5 activos</p>
          </div>
          <div style={styles.card}>
            <h3>Tareas</h3>
            <p>14 pendientes</p>
          </div>
          <div style={styles.card}>
            <h3>Colaboradores</h3>
            <p>8 conectados</p>
          </div>
          <div style={styles.card}>
            <h3>Proyectos</h3>
            <p>5 activos</p>
          </div>
          <div style={styles.card}>
            <h3>Tareas</h3>
            <p>14 pendientes</p>
          </div>
          <div style={styles.card}>
            <h3>Colaboradores</h3>
            <p>8 conectados</p>
          </div>
        </div>
      </section>

      <section style={styles.section}>
        <h2>Últimas actividades</h2>
        <ul style={styles.activityList}>
          <li>✔️ Juan actualizó el proyecto “Marketing 2025”.</li>
          <li>📌 Nueva tarea asignada a María.</li>
          <li>🕒 Reunión programada para el 28 de septiembre.</li>
        </ul>
      </section>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: "#edededff",
    marginTop: "8vh",
    padding: "30px",
    fontFamily: "Arial, sans-serif",
    color: "#333",
  },
  header: {
    marginBottom: "40px",
  },
  section: {
    marginBottom: "40px",
  },
  cardsContainer: {
    display: "flex",
    gap: "20px",
    flexWrap: "wrap",
    marginTop: "20px",
  },
  card: {
    flex: "1 1 200px",
    backgroundColor: "#f5f5f5",
    borderRadius: "8px",
    padding: "20px",
    boxShadow: "0 0 10px rgba(0,0,0,0.05)",
  },
  activityList: {
    listStyle: "none",
    paddingLeft: 0,
    lineHeight: "1.8em",
  },
};

export default Home;
