// Controllers/proveedoresController.js
// Auditoría completa: creado_por, actualizado_por, fechas — igual que bienesController
const Proveedor = require('../Models/proveedorModel');

// ── Helper: detectar cambios ─────────────────────────────────
const detectarCambios = (anterior, nuevo) => {
  if (!anterior || !nuevo) return { cambios: null, descripcion: '' };

  const camposIgnorar = [
    '_id', '__v', 'fecha_creacion', 'fecha_actualizacion',
    'creado_por', 'creado_por_email',
    'actualizado_por', 'actualizado_por_email',
    'createdAt', 'updatedAt',
  ];

  const cambios = {};
  const todosLosCampos = new Set([...Object.keys(anterior), ...Object.keys(nuevo)]);

  for (const campo of todosLosCampos) {
    if (camposIgnorar.includes(campo)) continue;
    if (JSON.stringify(anterior[campo]) !== JSON.stringify(nuevo[campo])) {
      cambios[campo] = {
        anterior: anterior[campo] ?? 'vacío',
        nuevo:    nuevo[campo]    ?? 'vacío',
      };
    }
  }

  const descripcion = Object.keys(cambios)
    .map(c => `${c}: "${String(cambios[c].anterior).substring(0, 50)}" → "${String(cambios[c].nuevo).substring(0, 50)}"`)
    .join('; ');

  return { cambios, descripcion };
};

// ── Helper: info del usuario desde token ─────────────────────
const getUserInfo = (req) => {
  const user = req.user;
  if (!user) return { id: 'sistema', email: 'sistema@escuela.edu' };
  return {
    id:    user._id || user.id || user.sub,
    email: user.email || 'sistema@escuela.edu',
  };
};

// ── Obtener todos los proveedores ────────────────────────────
const obtenerProveedores = async (req, res) => {
  try {
    const proveedores = await Proveedor.find().sort({ fecha_creacion: -1 });
    res.status(200).json(proveedores);
  } catch (error) {
    console.error('❌ Error al obtener proveedores:', error);
    res.status(500).json({ message: 'Error al obtener los proveedores', error: error.message });
  }
};

// ── Obtener un proveedor por ID ──────────────────────────────
const obtenerProveedorPorId = async (req, res) => {
  try {
    const proveedor = await Proveedor.findById(req.params.id);
    if (!proveedor) return res.status(404).json({ message: 'Proveedor no encontrado' });
    res.status(200).json(proveedor);
  } catch (error) {
    console.error('❌ Error al obtener proveedor:', error);
    res.status(500).json({ message: 'Error al obtener el proveedor', error: error.message });
  }
};

// ── Crear proveedor ──────────────────────────────────────────
const crearProveedor = async (req, res) => {
  try {
    console.log('🚀 Iniciando creación de proveedor...');
    const usuario = getUserInfo(req);
    console.log(`👤 Usuario: ${usuario.email} (${usuario.id})`);

    const {
      id_proveedor, nombre, contacto, email, telefono, empresa,
      direccion, ciudad, pais, sitio_web, rtn, tipo_proveedor,
      estado, calificacion, notas, condiciones_pago,
      tiempo_entrega_promedio, fecha_registro,
    } = req.body;

    // Validar duplicado de id_proveedor
    const idExiste = await Proveedor.findOne({ id_proveedor });
    if (idExiste) return res.status(400).json({ message: 'Ya existe un proveedor con este ID' });

    // Validar duplicado de email
    const emailExiste = await Proveedor.findOne({ email });
    if (emailExiste) return res.status(400).json({ message: 'Ya existe un proveedor con este email' });

    const nuevoProveedor = new Proveedor({
      id_proveedor,
      nombre,
      contacto,
      email,
      telefono,
      empresa,
      direccion,
      ciudad,
      pais,
      sitio_web,
      rtn,
      tipo_proveedor,
      estado: estado || 'ACTIVO',
      calificacion,
      notas,
      condiciones_pago,
      tiempo_entrega_promedio,
      fecha_registro: fecha_registro || Date.now(),
      // ── Auditoría ─────────────────────────────────────────
      creado_por:          usuario.id,
      creado_por_email:    usuario.email,
      fecha_creacion:      new Date(),
      actualizado_por:     usuario.id,
      actualizado_por_email: usuario.email,
      fecha_actualizacion: new Date(),
    });

    const guardado = await nuevoProveedor.save();
    console.log(`✅ Proveedor creado por ${usuario.email}: ${guardado.nombre}`);

    res.status(201).json(guardado);
  } catch (error) {
    console.error('❌ Error al crear proveedor:', error);
    if (error.name === 'ValidationError') {
      const errores = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: 'Error de validación', errores });
    }
    res.status(500).json({ message: 'Error al crear el proveedor', error: error.message });
  }
};

// ── Actualizar proveedor ─────────────────────────────────────
const actualizarProveedor = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = getUserInfo(req);
    console.log(`🔄 Actualización de proveedor por ${usuario.email}`);

    const anterior = await Proveedor.findById(id);
    if (!anterior) return res.status(404).json({ message: 'Proveedor no encontrado' });

    const datosActualizados = req.body;

    // Verificar unicidad de id_proveedor si se actualiza
    if (datosActualizados.id_proveedor) {
      const idExiste = await Proveedor.findOne({
        id_proveedor: datosActualizados.id_proveedor,
        _id: { $ne: id },
      });
      if (idExiste) return res.status(400).json({ message: 'Ya existe un proveedor con este ID' });
    }

    // Verificar unicidad de email si se actualiza
    if (datosActualizados.email) {
      const emailExiste = await Proveedor.findOne({
        email: datosActualizados.email,
        _id: { $ne: id },
      });
      if (emailExiste) return res.status(400).json({ message: 'Ya existe un proveedor con este email' });
    }

    // Agregar campos de auditoría
    datosActualizados.actualizado_por       = usuario.id;
    datosActualizados.actualizado_por_email = usuario.email;
    datosActualizados.fecha_actualizacion   = new Date();

    // Detectar y loguear cambios
    const anteriorObj = anterior.toObject ? anterior.toObject() : anterior;
    const { cambios, descripcion } = detectarCambios(anteriorObj, datosActualizados);
    if (cambios && Object.keys(cambios).length > 0) {
      console.log(`📝 Cambios por ${usuario.email}:`, descripcion);
    } else {
      console.log(`ℹ️ Sin cambios detectados en actualización por ${usuario.email}`);
    }

    const actualizado = await Proveedor.findByIdAndUpdate(
      id,
      datosActualizados,
      { new: true, runValidators: true }
    );

    console.log(`✅ Proveedor actualizado: ${actualizado.nombre}`);
    res.status(200).json(actualizado);
  } catch (error) {
    console.error('❌ Error al actualizar proveedor:', error);
    if (error.name === 'ValidationError') {
      const errores = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: 'Error de validación', errores });
    }
    res.status(500).json({ message: 'Error al actualizar el proveedor', error: error.message });
  }
};

// ── Eliminar proveedor ───────────────────────────────────────
const eliminarProveedor = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = getUserInfo(req);

    const proveedor = await Proveedor.findById(id);
    if (!proveedor) return res.status(404).json({ message: 'Proveedor no encontrado' });

    await Proveedor.findByIdAndDelete(id);
    console.log(`🗑️ Proveedor "${proveedor.nombre}" eliminado por ${usuario.email}`);

    res.status(200).json({
      message: 'Proveedor eliminado exitosamente',
      proveedor,
      audit: {
        eliminado_por:   usuario.email,
        fecha_eliminacion: new Date(),
      },
    });
  } catch (error) {
    console.error('❌ Error al eliminar proveedor:', error);
    res.status(500).json({ message: 'Error al eliminar el proveedor', error: error.message });
  }
};

// ── Buscar por estado ────────────────────────────────────────
const buscarPorEstado = async (req, res) => {
  try {
    const proveedores = await Proveedor.find({ estado: req.params.estado }).sort({ fecha_creacion: -1 });
    res.status(200).json(proveedores);
  } catch (error) {
    res.status(500).json({ message: 'Error al buscar por estado', error: error.message });
  }
};

// ── Buscar por tipo ──────────────────────────────────────────
const buscarPorTipo = async (req, res) => {
  try {
    const proveedores = await Proveedor.find({ tipo_proveedor: req.params.tipo }).sort({ fecha_creacion: -1 });
    res.status(200).json(proveedores);
  } catch (error) {
    res.status(500).json({ message: 'Error al buscar por tipo', error: error.message });
  }
};

// ── Buscar por calificación ──────────────────────────────────
const buscarPorCalificacion = async (req, res) => {
  try {
    const proveedores = await Proveedor.find({ calificacion: Number(req.params.calificacion) }).sort({ fecha_creacion: -1 });
    res.status(200).json(proveedores);
  } catch (error) {
    res.status(500).json({ message: 'Error al buscar por calificación', error: error.message });
  }
};

module.exports = {
  obtenerProveedores,
  obtenerProveedorPorId,
  crearProveedor,
  actualizarProveedor,
  eliminarProveedor,
  buscarPorEstado,
  buscarPorTipo,
  buscarPorCalificacion,
};