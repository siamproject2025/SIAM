import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Mail, Phone, UserCheck, FileText, Hash, Search, HelpCircle,
  Plus, Edit, Trash2, X, Save, Check, Briefcase, Shield, Filter
} from 'lucide-react';

const API_URL = "http://localhost:3000/api/personal";

const styles = `
  .personal-container { padding: 2rem; max-width: 100%; margin: 0 auto; width: 100%; }
  .personal-header { margin-bottom: 2rem; width: 100%; }
  .personal-header h2 { font-size: 2rem; color: #333; margin-bottom: 0.5rem; }
  .personal-header p { color: #666; font-size: 1rem; }
  .personal-busqueda-bar { display: flex; gap: 1rem; margin-top: 1.5rem; align-items: center; width: 100%; }
  .personal-busqueda { flex: 1; width: 100%; padding: 0.8rem 1rem; padding-left: 40px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem; transition: all 0.3s ease; }
  .personal-busqueda:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); }
  .btn-ayuda { padding: 0.8rem 1.5rem; background: #667eea; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: all 0.3s ease; }
  .btn-ayuda:hover { background: #5568d3; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3); }
  .personal-categorias-container { margin-top: 1rem; width: 205%; }
  .personal-categoria-section { margin-bottom: 2rem; width: 100%; }
  .personal-categoria-header { margin-bottom: 0.75rem; width: 100%; }
  .personal-subtitulo { font-size: 1.3rem; color: #333; display: flex; align-items: center; gap: 0.5rem; }
  .personal-vacio { text-align: center; padding: 3rem; color: #999; font-size: 1.1rem; }
  .tabla-personal { width: 100%; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 3px 10px rgba(0,0,0,0.1); min-height: 600px; max-height: calc(100vh - 300px); display: flex; flex-direction: column; margin-bottom: 2rem; }
  .tabla-header { display: grid; grid-template-columns: 80px 220px 200px 160px 140px 120px 120px 100px; gap: 1rem; padding: 1rem 1.5rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-weight: 600; font-size: 0.9rem; align-items: center; position: sticky; top: 0; z-index: 10; }
  .tabla-body { flex: 1; overflow-y: auto; }
  .tabla-fila { display: grid; grid-template-columns: 80px 220px 200px 160px 140px 120px 120px 100px; gap: 1rem; padding: 1.2rem 1.5rem; border-bottom: 1px solid #e9ecef; align-items: center; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; }
  .tabla-fila::before { content: ''; position: absolute; left: 0; top: 0; height: 100%; width: 3px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); transform: scaleY(0); transition: transform 0.3s ease; }
  .tabla-fila:hover { background: linear-gradient(90deg, rgba(102, 126, 234, 0.05) 0%, rgba(255, 255, 255, 1) 100%); transform: translateX(5px); box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .tabla-fila:hover::before { transform: scaleY(1); }
  .tabla-fila:last-child { border-bottom: none; }
  .estado-badge { padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; display: inline-block; text-align: center; }
  .estado-badge.activo { background: #4CAF50; color: white; }
  .estado-badge.inactivo { background: #f44336; color: white; }
  .estado-badge.vacaciones { background: #2196F3; color: white; }
  .estado-badge.licencia { background: #ff9800; color: white; }
  .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
  .modal-content { background: white; border-radius: 12px; padding: 2rem; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2); max-width: 90vw; }
  .modal-title { font-size: 1.5rem; color: #333; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem; }
  .form-group { margin-bottom: 1rem; }
  .form-group label { display: block; margin-bottom: 0.5rem; color: #333; font-weight: 600; }
  .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 0.8rem; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem; transition: all 0.3s ease; }
  .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .form-group.full-width { grid-column: 1 / -1; }
  .modal-actions { display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem; }
  .btn-guardar, .btn-cancelar, .btn-eliminar, .btn-cerrar { padding: 0.8rem 1.5rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: all 0.3s ease; }
  .btn-guardar { background: #4CAF50; color: white; }
  .btn-guardar:hover { background: #45a049; }
  .btn-cancelar { background: #f44336; color: white; }
  .btn-cancelar:hover { background: #da190b; }
  .btn-eliminar { background: #ff9800; color: white; }
  .btn-eliminar:hover { background: #fb8c00; }
  .btn-cerrar { background: #667eea; color: white; }
  .btn-cerrar:hover { background: #5568d3; }
  .filtros-menu { position: absolute; top: 100%; right: 0; margin-top: 0.5rem; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); padding: 0.5rem; min-width: 200px; z-index: 100; }
  .filtro-opcion { padding: 0.7rem 1rem; cursor: pointer; border-radius: 6px; transition: all 0.2s ease; font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem; }
  .filtro-opcion:hover { background: #f5f5f5; }
  .filtro-opcion.active { background: #667eea; color: white; }
  .filtro-separador { height: 1px; background: #e0e0e0; margin: 0.5rem 0; }
`;

const PersonalManagement = () => {
  const [personal, setPersonal] = useState([]);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [notification, setNotification] = useState(null);
  const [mostrarAyuda, setMostrarAyuda] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filtroOrden, setFiltroOrden] = useState('ninguno');
  const [mostrarMenuFiltros, setMostrarMenuFiltros] = useState(false);

  const [formData, setFormData] = useState({
    codigo: '', nombres: '', apellidos: '', numero_identidad: '', tipo_contrato: 'TIEMPO_COMPLETO',
    estado: 'ACTIVO', area_trabajo: '', telefono: '', direccion_correo: '',
    cargo_asignacion: { cargo: '', horario_preferido: 'MATUTINO', fecha_asignacion: new Date().toISOString().split('T')[0] },
    salario: '', fecha_ingreso: new Date().toISOString().split('T')[0]
  });

  useEffect(() => { cargarPersonal(); }, []);

  const cargarPersonal = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al cargar personal');
      const data = await res.json();
      setPersonal(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error:', err);
      showNotification('Error al cargar el personal', 'error');
      setPersonal([]);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const resetForm = () => {
    setFormData({
      codigo: '', nombres: '', apellidos: '', numero_identidad: '', tipo_contrato: 'TIEMPO_COMPLETO',
      estado: 'ACTIVO', area_trabajo: '', telefono: '', direccion_correo: '',
      cargo_asignacion: { cargo: '', horario_preferido: 'MATUTINO', fecha_asignacion: new Date().toISOString().split('T')[0] },
      salario: '', fecha_ingreso: new Date().toISOString().split('T')[0]
    });
  };

  const handleCrearEmpleado = async (e) => {
    e.preventDefault();
    try {
      if (!formData.codigo.trim() || !formData.nombres.trim() || !formData.apellidos.trim()) {
        showNotification('Completa los campos obligatorios', 'error');
        return;
      }
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al crear el empleado');
      }
      await cargarPersonal();
      setMostrarModalCrear(false);
      resetForm();
      showNotification(`Empleado "${formData.nombres} ${formData.apellidos}" creado exitosamente`, 'success');
    } catch (err) {
      showNotification(err.message || 'Error al crear el empleado', 'error');
    }
  };

  const handleEditarEmpleado = async (e) => {
    e.preventDefault();
    try {
      if (!formData.nombres.trim()) {
        showNotification('Los nombres son obligatorios', 'error');
        return;
      }
      const res = await fetch(`${API_URL}/${empleadoSeleccionado._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al editar el empleado');
      }
      await cargarPersonal();
      setEmpleadoSeleccionado(null);
      resetForm();
      showNotification(`Empleado actualizado exitosamente`, 'success');
    } catch (err) {
      showNotification(err.message || 'Error al editar el empleado', 'error');
    }
  };

  const handleEliminarEmpleado = async () => {
    const empleadoAEliminar = personal.find(p => p._id === empleadoSeleccionado._id);
    if (!window.confirm(`¿Eliminar a "${empleadoAEliminar?.nombres} ${empleadoAEliminar?.apellidos}"?`)) return;
    try {
      const res = await fetch(`${API_URL}/${empleadoSeleccionado._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      await cargarPersonal();
      setEmpleadoSeleccionado(null);
      resetForm();
      showNotification(`Empleado eliminado exitosamente`, 'success');
    } catch (err) {
      showNotification(err.message || 'Error al eliminar el empleado', 'error');
    }
  };

  const personalFiltrado = personal.filter(p => {
    const t = busqueda.toLowerCase();
    return p.nombres?.toLowerCase().includes(t) || p.apellidos?.toLowerCase().includes(t) ||
      p.codigo?.toLowerCase().includes(t) || p.numero_identidad?.toString().includes(t) ||
      p.telefono?.toString().includes(t) || p.direccion_correo?.toLowerCase().includes(t) ||
      p.cargo_asignacion?.cargo?.toLowerCase().includes(t);
  });

  const personalOrdenado = [...personalFiltrado].sort((a, b) => {
    switch(filtroOrden) {
      case 'codigo-mayor': return (b.codigo || '').localeCompare(a.codigo || '');
      case 'codigo-menor': return (a.codigo || '').localeCompare(b.codigo || '');
      case 'nombre-az': return (a.nombres || '').localeCompare(b.nombres || '');
      case 'nombre-za': return (b.nombres || '').localeCompare(a.nombres || '');
      case 'estado-activo':
        const o1 = { 'ACTIVO': 1, 'VACACIONES': 2, 'LICENCIA': 3, 'INACTIVO': 4 };
        return (o1[a.estado] || 999) - (o1[b.estado] || 999);
      case 'estado-inactivo':
        const o2 = { 'INACTIVO': 1, 'LICENCIA': 2, 'VACACIONES': 3, 'ACTIVO': 4 };
        return (o2[a.estado] || 999) - (o2[b.estado] || 999);
      default: return 0;
    }
  });

  const handleOpenEditModal = (empleado) => {
    setEmpleadoSeleccionado(empleado);
    setFormData({
      codigo: empleado.codigo || '', nombres: empleado.nombres || '', apellidos: empleado.apellidos || '',
      numero_identidad: empleado.numero_identidad || '', tipo_contrato: empleado.tipo_contrato || 'TIEMPO_COMPLETO',
      estado: empleado.estado || 'ACTIVO', area_trabajo: empleado.area_trabajo || '',
      telefono: empleado.telefono || '', direccion_correo: empleado.direccion_correo || '',
      cargo_asignacion: {
        cargo: empleado.cargo_asignacion?.cargo || '',
        horario_preferido: empleado.cargo_asignacion?.horario_preferido || 'MATUTINO',
        fecha_asignacion: empleado.cargo_asignacion?.fecha_asignacion 
          ? new Date(empleado.cargo_asignacion.fecha_asignacion).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      },
      salario: empleado.salario || '',
      fecha_ingreso: empleado.fecha_ingreso 
        ? new Date(empleado.fecha_ingreso).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]
    });
  };

  const handleCloseModals = () => {
    setMostrarModalCrear(false);
    setEmpleadoSeleccionado(null);
    resetForm();
  };

  return (
    <>
      <style>{styles}</style>
      <div className="personal-container">
        <motion.div className="personal-header" initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <motion.h2 initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            Sistema de Gestión de Personal
          </motion.h2>
          <motion.p initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            Gestiona y controla todo el personal de la organización
          </motion.p>
          <motion.div className="personal-busqueda-bar" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }}>
                <Search size={18} />
              </motion.div>
              <input type="text" className="personal-busqueda"
                placeholder="Buscar por nombre, código, identidad, cargo, email o teléfono..."
                value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            </div>
            <div style={{ position: 'relative' }}>
              <motion.button className="btn-ayuda" onClick={() => setMostrarMenuFiltros(!mostrarMenuFiltros)}
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
                <motion.div animate={{ rotate: mostrarMenuFiltros ? 180 : 0 }} transition={{ duration: 0.3 }}>
                  <Filter size={18} />
                </motion.div>
                Filtros
              </motion.button>
              <AnimatePresence>
                {mostrarMenuFiltros && (
                  <motion.div className="filtros-menu" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <div className={`filtro-opcion ${filtroOrden === 'ninguno' ? 'active' : ''}`}
                      onClick={() => { setFiltroOrden('ninguno'); setMostrarMenuFiltros(false); }}>
                      <Hash size={16} /> Sin ordenar
                    </div>
                    <div className="filtro-separador"></div>
                    <div className={`filtro-opcion ${filtroOrden === 'codigo-mayor' ? 'active' : ''}`}
                      onClick={() => { setFiltroOrden('codigo-mayor'); setMostrarMenuFiltros(false); }}>
                      ⬇️ Código Z-A
                    </div>
                    <div className={`filtro-opcion ${filtroOrden === 'codigo-menor' ? 'active' : ''}`}
                      onClick={() => { setFiltroOrden('codigo-menor'); setMostrarMenuFiltros(false); }}>
                      ⬆️ Código A-Z
                    </div>
                    <div className="filtro-separador"></div>
                    <div className={`filtro-opcion ${filtroOrden === 'nombre-az' ? 'active' : ''}`}
                      onClick={() => { setFiltroOrden('nombre-az'); setMostrarMenuFiltros(false); }}>
                      🔤 Nombre A-Z
                    </div>
                    <div className={`filtro-opcion ${filtroOrden === 'nombre-za' ? 'active' : ''}`}
                      onClick={() => { setFiltroOrden('nombre-za'); setMostrarMenuFiltros(false); }}>
                      🔡 Nombre Z-A
                    </div>
                    <div className="filtro-separador"></div>
                    <div className={`filtro-opcion ${filtroOrden === 'estado-activo' ? 'active' : ''}`}
                      onClick={() => { setFiltroOrden('estado-activo'); setMostrarMenuFiltros(false); }}>
                      🟢 Activos Primero
                    </div>
                    <div className={`filtro-opcion ${filtroOrden === 'estado-inactivo' ? 'active' : ''}`}
                      onClick={() => { setFiltroOrden('estado-inactivo'); setMostrarMenuFiltros(false); }}>
                      🔴 Inactivos Primero
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <motion.button className="btn-ayuda" onClick={() => setMostrarAyuda(true)}
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
              <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>
                <HelpCircle size={18} />
              </motion.div>
              Ayuda
            </motion.button>
            <motion.button className="btn-ayuda" onClick={() => setMostrarModalCrear(true)}
              whileHover={{ scale: 1.08, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }} whileTap={{ scale: 0.95 }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                <Plus size={18} />
              </motion.div>
              Nuevo Empleado
            </motion.button>
          </motion.div>
        </motion.div>

        {loading && personal.length === 0 ? (
          <motion.div style={{ textAlign: 'center', padding: '3rem' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{ display: 'inline-block', marginBottom: '1rem' }}>
              <Users size={40} color="#667eea" />
            </motion.div>
            <p style={{ color: '#667eea', fontWeight: '600' }}>Cargando personal...</p>
          </motion.div>
        ) : (
          <motion.div className="personal-categorias-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <motion.div className="personal-categoria-section" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <motion.div className="personal-categoria-header" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                <h3 className="personal-subtitulo">
                  <motion.div initial={{ rotate: -180, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
                    <Users size={20} style={{ color: '#667eea' }} />
                  </motion.div>
                  Todo el Personal ({personalOrdenado.length})
                </h3>
              </motion.div>

              {personalOrdenado.length === 0 ? (
                <motion.p className="personal-vacio" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  No hay empleados registrados.
                </motion.p>
              ) : (
                <motion.div className="tabla-personal" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <motion.div className="tabla-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}>
                        <Hash size={14} />
                      </motion.div>
                      CÓDIGO
                    </div>
                    <div>NOMBRE COMPLETO</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Mail size={14} /> CONTACTO
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <UserCheck size={14} /> IDENTIDAD
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Briefcase size={14} /> CARGO
                    </div>
                    <div style={{ textAlign: 'center' }}>CONTRATO</div>
                    <div style={{ textAlign: 'center' }}>ESTADO</div>
                    <div style={{ textAlign: 'center' }}>ACCIONES</div>
                  </motion.div>

                  <div className="tabla-body">
                    {personalOrdenado.map((empleado, index) => (
                      <motion.div key={empleado._id} className="tabla-fila"
                        initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(index * 0.05, 1), duration: 0.4, type: "spring" }}
                        whileHover={{ scale: 1.01 }} onClick={() => handleOpenEditModal(empleado)}>
                        <motion.div style={{ fontWeight: 'bold', color: '#FF9800', fontSize: '0.95rem' }}
                          whileHover={{ scale: 1.1 }} transition={{ type: "spring", stiffness: 300 }}>
                          {empleado.codigo}
                        </motion.div>

                        <div>
                          <motion.div style={{ fontWeight: '600', fontSize: '1rem', color: '#333', marginBottom: '3px' }}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 + 0.2 }}>
                            {empleado.nombres} {empleado.apellidos}
                          </motion.div>
                          {empleado.area_trabajo && (
                            <motion.div style={{ fontSize: '0.85rem', color: '#666' }}
                              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 + 0.3 }}>
                              {empleado.area_trabajo}
                            </motion.div>
                          )}
                        </div>

                        <div>
                          <motion.div style={{ fontSize: '0.85rem', color: '#555', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}
                            whileHover={{ x: 5 }}>
                            <Mail size={14} /> {empleado.direccion_correo}
                          </motion.div>
                          <motion.div style={{ fontSize: '0.85rem', color: '#555', display: 'flex', alignItems: 'center', gap: '5px' }}
                            whileHover={{ x: 5 }}>
                            <Phone size={14} /> {empleado.telefono}
                          </motion.div>
                        </div>

                        <motion.div style={{ fontSize: '0.9rem', color: '#555' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05 + 0.25 }}>
                          {empleado.numero_identidad || '-'}
                        </motion.div>

                        <motion.div style={{ fontSize: '0.85rem', color: '#555', fontWeight: '600' }}
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 + 0.25 }}>
                          {empleado.cargo_asignacion?.cargo || '-'}
                        </motion.div>

                        <motion.div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#666' }}
                          whileHover={{ scale: 1.1 }} transition={{ type: "spring", stiffness: 300 }}>
                          {empleado.tipo_contrato?.replace('_', ' ')}
                        </motion.div>

                        <motion.div style={{ display: 'flex', justifyContent: 'center' }}
                          whileHover={{ scale: 1.15 }} transition={{ type: "spring", stiffness: 300 }}>
                          <span className={`estado-badge ${empleado.estado?.toLowerCase()}`}>
                            {empleado.estado}
                          </span>
                        </motion.div>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                          <motion.button whileHover={{ scale: 1.2, rotate: 15 }} whileTap={{ scale: 0.9, rotate: -15 }}
                            onClick={(e) => { e.stopPropagation(); handleOpenEditModal(empleado); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2196F3', padding: '5px', display: 'flex', alignItems: 'center' }}
                            title="Editar">
                            <Edit size={18} />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Modal Crear */}
        <AnimatePresence>
          {mostrarModalCrear && (
            <motion.div className="modal-overlay" onClick={handleCloseModals} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}
                onClick={(e) => e.stopPropagation()} initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 50 }}>
                <h3 className="modal-title"><Plus size={20} /> Crear Nuevo Empleado</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Código *</label>
                      <input type="text" value={formData.codigo} onChange={(e) => setFormData({...formData, codigo: e.target.value})}
                        placeholder="Código del empleado" required />
                    </div>
                    <div className="form-group">
                      <label>Número de Identidad *</label>
                      <input type="text" value={formData.numero_identidad} onChange={(e) => setFormData({...formData, numero_identidad: e.target.value})}
                        placeholder="Número de identidad" required />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Nombres *</label>
                      <input type="text" value={formData.nombres} onChange={(e) => setFormData({...formData, nombres: e.target.value})}
                        placeholder="Nombres" required />
                    </div>
                    <div className="form-group">
                      <label>Apellidos *</label>
                      <input type="text" value={formData.apellidos} onChange={(e) => setFormData({...formData, apellidos: e.target.value})}
                        placeholder="Apellidos" required />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Email *</label>
                      <input type="email" value={formData.direccion_correo} onChange={(e) => setFormData({...formData, direccion_correo: e.target.value})}
                        placeholder="correo@ejemplo.com" required />
                    </div>
                    <div className="form-group">
                      <label>Teléfono *</label>
                      <input type="tel" value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                        placeholder="+504 1234-5678" required />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Cargo *</label>
                      <input type="text" value={formData.cargo_asignacion.cargo}
                        onChange={(e) => setFormData({...formData, cargo_asignacion: {...formData.cargo_asignacion, cargo: e.target.value}})}
                        placeholder="Cargo del empleado" required />
                    </div>
                    <div className="form-group">
                      <label>Área de Trabajo</label>
                      <input type="text" value={formData.area_trabajo} onChange={(e) => setFormData({...formData, area_trabajo: e.target.value})}
                        placeholder="Área o departamento" />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Tipo de Contrato *</label>
                      <select value={formData.tipo_contrato} onChange={(e) => setFormData({...formData, tipo_contrato: e.target.value})}>
                        <option value="TIEMPO_COMPLETO">Tiempo Completo</option>
                        <option value="MEDIO_TIEMPO">Medio Tiempo</option>
                        <option value="TEMPORAL">Temporal</option>
                        <option value="HONORARIOS">Honorarios</option>
                        <option value="PRACTICANTE">Practicante</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Estado *</label>
                      <select value={formData.estado} onChange={(e) => setFormData({...formData, estado: e.target.value})}>
                        <option value="ACTIVO">ACTIVO</option>
                        <option value="VACACIONES">VACACIONES</option>
                        <option value="LICENCIA">LICENCIA</option>
                        <option value="INACTIVO">INACTIVO</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Horario</label>
                      <select value={formData.cargo_asignacion.horario_preferido}
                        onChange={(e) => setFormData({...formData, cargo_asignacion: {...formData.cargo_asignacion, horario_preferido: e.target.value}})}>
                        <option value="MATUTINO">Matutino</option>
                        <option value="VESPERTINO">Vespertino</option>
                        <option value="NOCTURNO">Nocturno</option>
                        <option value="ROTATIVO">Rotativo</option>
                        <option value="FLEXIBLE">Flexible</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Salario</label>
                      <input type="number" value={formData.salario} onChange={(e) => setFormData({...formData, salario: e.target.value})}
                        placeholder="Salario mensual" min="0" step="0.01" />
                    </div>
                    <div className="form-group">
                      <label>Fecha de Ingreso</label>
                      <input type="date" value={formData.fecha_ingreso} onChange={(e) => setFormData({...formData, fecha_ingreso: e.target.value})} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Fecha de Asignación de Cargo *</label>
                    <input type="date" value={formData.cargo_asignacion.fecha_asignacion}
                      onChange={(e) => setFormData({...formData, cargo_asignacion: {...formData.cargo_asignacion, fecha_asignacion: e.target.value}})} required />
                  </div>
                </div>
                <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                  <motion.button type="button" className="btn-cancelar" onClick={handleCloseModals} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <X size={16} /> Cancelar
                  </motion.button>
                  <motion.button onClick={handleCrearEmpleado} className="btn-guardar" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Check size={16} /> Crear Empleado
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Editar */}
        <AnimatePresence>
          {empleadoSeleccionado && (
            <motion.div className="modal-overlay" onClick={handleCloseModals} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}
                onClick={(e) => e.stopPropagation()} initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 50 }}>
                <h3 className="modal-title"><Edit size={20} /> Editar Empleado</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Código *</label>
                    <input type="text" value={formData.codigo} onChange={(e) => setFormData({...formData, codigo: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Número de Identidad *</label>
                    <input type="text" value={formData.numero_identidad} onChange={(e) => setFormData({...formData, numero_identidad: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Nombres *</label>
                    <input type="text" value={formData.nombres} onChange={(e) => setFormData({...formData, nombres: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Apellidos *</label>
                    <input type="text" value={formData.apellidos} onChange={(e) => setFormData({...formData, apellidos: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input type="email" value={formData.direccion_correo} onChange={(e) => setFormData({...formData, direccion_correo: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Teléfono *</label>
                    <input type="tel" value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Cargo *</label>
                    <input type="text" value={formData.cargo_asignacion.cargo}
                      onChange={(e) => setFormData({...formData, cargo_asignacion: {...formData.cargo_asignacion, cargo: e.target.value}})} required />
                  </div>
                  <div className="form-group">
                    <label>Área de Trabajo</label>
                    <input type="text" value={formData.area_trabajo} onChange={(e) => setFormData({...formData, area_trabajo: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Tipo de Contrato *</label>
                    <select value={formData.tipo_contrato} onChange={(e) => setFormData({...formData, tipo_contrato: e.target.value})}>
                      <option value="TIEMPO_COMPLETO">Tiempo Completo</option>
                      <option value="MEDIO_TIEMPO">Medio Tiempo</option>
                      <option value="TEMPORAL">Temporal</option>
                      <option value="HONORARIOS">Honorarios</option>
                      <option value="PRACTICANTE">Practicante</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Estado *</label>
                    <select value={formData.estado} onChange={(e) => setFormData({...formData, estado: e.target.value})}>
                      <option value="ACTIVO">ACTIVO</option>
                      <option value="VACACIONES">VACACIONES</option>
                      <option value="LICENCIA">LICENCIA</option>
                      <option value="INACTIVO">INACTIVO</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Horario</label>
                    <select value={formData.cargo_asignacion.horario_preferido}
                      onChange={(e) => setFormData({...formData, cargo_asignacion: {...formData.cargo_asignacion, horario_preferido: e.target.value}})}>
                      <option value="MATUTINO">Matutino</option>
                      <option value="VESPERTINO">Vespertino</option>
                      <option value="NOCTURNO">Nocturno</option>
                      <option value="ROTATIVO">Rotativo</option>
                      <option value="FLEXIBLE">Flexible</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Salario</label>
                    <input type="number" value={formData.salario} onChange={(e) => setFormData({...formData, salario: e.target.value})} min="0" step="0.01" />
                  </div>
                  <div className="form-group">
                    <label>Fecha de Ingreso</label>
                    <input type="date" value={formData.fecha_ingreso} onChange={(e) => setFormData({...formData, fecha_ingreso: e.target.value})} />
                  </div>
                  <div className="form-group full-width">
                    <label>Fecha de Asignación de Cargo *</label>
                    <input type="date" value={formData.cargo_asignacion.fecha_asignacion}
                      onChange={(e) => setFormData({...formData, cargo_asignacion: {...formData.cargo_asignacion, fecha_asignacion: e.target.value}})} required />
                  </div>
                </div>
                <div className="modal-actions">
                  <motion.button type="button" className="btn-eliminar" onClick={handleEliminarEmpleado} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Trash2 size={16} /> Eliminar
                  </motion.button>
                  <motion.button type="button" className="btn-cancelar" onClick={handleCloseModals} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <X size={16} /> Cancelar
                  </motion.button>
                  <motion.button onClick={handleEditarEmpleado} className="btn-guardar" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Save size={16} /> Guardar Cambios
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notificaciones */}
        <AnimatePresence>
          {notification && (
            <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
              style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 10000,
                background: notification.type === 'success' ? '#4CAF50' : '#f44336',
                color: 'white', padding: '1rem 1.5rem', borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {notification.message}
              <button onClick={() => setNotification(null)}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}>
                <X size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Ayuda */}
        <AnimatePresence>
          {mostrarAyuda && (
            <motion.div className="modal-overlay" onClick={() => setMostrarAyuda(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div className="modal-content" style={{ maxWidth: '600px', maxHeight: '80vh', overflow: 'auto', paddingBottom: '80px' }}
                onClick={(e) => e.stopPropagation()} initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 50 }}>
                <h3 className="modal-title"><FileText size={20} /> Guía de Uso - Sistema de Personal</h3>
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ color: '#667eea', marginBottom: '0.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Search size={16} /> Búsqueda
                  </h4>
                  <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Busca por: nombre, código, identidad, cargo, email o teléfono.</p>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ color: '#667eea', marginBottom: '0.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={16} /> Estados
                  </h4>
                  <ul style={{ marginLeft: '1rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    <li><strong>🟢 ACTIVO:</strong> Empleado activo trabajando</li>
                    <li><strong>🔵 VACACIONES:</strong> En período de vacaciones</li>
                    <li><strong>🟡 LICENCIA:</strong> Con licencia temporal</li>
                    <li><strong>🔴 INACTIVO:</strong> Empleado inactivo</li>
                  </ul>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ color: '#667eea', marginBottom: '0.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Briefcase size={16} /> Tipos de Contrato
                  </h4>
                  <ul style={{ marginLeft: '1rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    <li><strong>TIEMPO COMPLETO:</strong> Jornada completa</li>
                    <li><strong>MEDIO TIEMPO:</strong> Media jornada</li>
                    <li><strong>TEMPORAL:</strong> Contrato por tiempo limitado</li>
                    <li><strong>HONORARIOS:</strong> Pago por honorarios</li>
                    <li><strong>PRACTICANTE:</strong> En práctica</li>
                  </ul>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ color: '#667eea', marginBottom: '0.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ✨ Funciones
                  </h4>
                  <ul style={{ marginLeft: '1rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    <li>Clic en fila para ver/editar detalles del empleado</li>
                    <li>Búsqueda en tiempo real</li>
                    <li>Filtros de ordenamiento múltiples</li>
                    <li>Gestión completa de información del personal</li>
                  </ul>
                </div>
                <div style={{ position: 'sticky', bottom: '0', left: '0', right: '0', padding: '1rem', background: 'white',
                  borderTop: '1px solid #e0e0e0', marginLeft: '-2rem', marginRight: '-2rem', marginBottom: '-2rem', display: 'flex', justifyContent: 'center' }}>
                  <motion.button className="btn-cerrar" onClick={() => setMostrarAyuda(false)} style={{ width: '200px' }}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Check size={16} /> Entendido
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default PersonalManagement;