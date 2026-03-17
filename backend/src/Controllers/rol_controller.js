const Rol = require('../Models/Rol');

const rolController = {
  // Obtener todos los roles
  async listarRoles(req, res) {
    try {
      const roles = await Rol.find();
      res.json(roles);
    } catch (error) {
      console.error('Error al listar roles:', error);
      res.status(500).json({ message: 'Error al obtener roles' });
    }
  },

  // Obtener un rol específico
  async obtenerRol(req, res) {
    try {
      const rol = await Rol.findById(req.params.id);
      if (!rol) {
        return res.status(404).json({ message: 'Rol no encontrado' });
      }
      res.json(rol);
    } catch (error) {
      console.error('Error al obtener rol:', error);
      res.status(500).json({ message: 'Error al obtener rol' });
    }
  },

  // Crear un nuevo rol
  // Crear un nuevo rol
async crearRol(req, res) {
  try {
    console.log('📥 Body recibido:', req.body);
    
    // ✅ Incluir 'nombre' en la desestructuración
    const { _id, nombre, permisos, descripcion } = req.body;
    
    console.log('📦 Datos extraídos:', { _id, nombre, permisos, descripcion });
    
    const existe = await Rol.findById(_id);
    if (existe) {
      return res.status(400).json({ message: 'El rol ya existe' });
    }

    // ✅ Incluir 'nombre' al crear el nuevo rol
    const nuevoRol = new Rol({ 
      _id, 
      nombre,      // ← Esto estaba faltando
      permisos, 
      descripcion 
    });
    
    await nuevoRol.save();
    
    res.status(201).json(nuevoRol);
  } catch (error) {
    console.error('Error al crear rol:', error);
    res.status(500).json({ message: 'Error al crear rol' });
  }
},

  // Actualizar permisos de un rol
  async actualizarRol(req, res) {
    try {
      const { permisos, descripcion } = req.body;
      
      const rol = await Rol.findByIdAndUpdate(
        req.params.id,
        { permisos, descripcion },
        { new: true }
      );

      if (!rol) {
        return res.status(404).json({ message: 'Rol no encontrado' });
      }

      res.json(rol);
    } catch (error) {
      console.error('Error al actualizar rol:', error);
      res.status(500).json({ message: 'Error al actualizar rol' });
    }
  },

  // Eliminar un rol
  async eliminarRol(req, res) {
    try {
      const rol = await Rol.findByIdAndDelete(req.params.id);
      if (!rol) {
        return res.status(404).json({ message: 'Rol no encontrado' });
      }
      res.json({ message: 'Rol eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar rol:', error);
      res.status(500).json({ message: 'Error al eliminar rol' });
    }
  },

  // Obtener permisos de un usuario específico
  async obtenerPermisosUsuario(req, res) {
    try {
      const Usuario = require('../Models/usuario_modelo');
      const usuarioId = req.params.id;
      const usuario = await Usuario.findById(usuarioId);
      
      if (!usuario) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      const roles = await Rol.find({ _id: { $in: usuario.roles } });
      const permisos = [...new Set(roles.flatMap(rol => rol.permisos))];
      
      res.json({ 
        usuario: usuario.username,
        roles: usuario.roles,
        permisos 
      });
    } catch (error) {
      console.error('Error al obtener permisos:', error);
      res.status(500).json({ message: 'Error al obtener permisos' });
    }
  },

  // Obtener permisos del usuario actual
  async obtenerMisPermisos(req, res) {
    try {
      const userRoles = req.user.roles;
      const roles = await Rol.find({ _id: { $in: userRoles } });
      const permisos = [...new Set(roles.flatMap(rol => rol.permisos))];
      
      res.json({
        roles: userRoles,
        permisos: permisos,
        rolesDetalle: roles
      });
    } catch (error) {
      console.error('Error al obtener mis permisos:', error);
      res.status(500).json({ message: 'Error al obtener permisos' });
    }
  }
};

module.exports = rolController;