// controllers/moduloController.js
const Modulo = require("../Models/dashboard_modelo");

exports.listarModulos = async (req, res) => {
  try {
    // Obtener permisos del usuario (desde el middleware de autenticación)
    const userPermissions = req.user.permisos || [];
    
    console.log('👤 Usuario:', req.user.email);
    console.log('🔑 Permisos del usuario:', userPermissions);

    // Obtener TODOS los módulos (sin filtro por roles)
    const todosLosModulos = await Modulo.find().sort('orden');
    
    console.log('📦 Total módulos en BD:', todosLosModulos.length);

    // Filtrar módulos por permisos
    const modulosFiltrados = todosLosModulos.filter(modulo => {
      // Si el módulo no requiere permisos especiales, todos lo ven
      if (!modulo.permisos || modulo.permisos.length === 0) {
        return true;
      }
      
      // Verificar si el usuario tiene ALGUNO de los permisos requeridos
      const tienePermiso = modulo.permisos.some(permiso => 
        userPermissions.includes(permiso)
      );
      
      if (!tienePermiso) {
        console.log(`🚫 Módulo ${modulo.titulo} - Permisos requeridos:`, modulo.permisos);
      }
      
      return tienePermiso;
    });

    console.log('✅ Módulos visibles:', modulosFiltrados.length);
    
    res.json({ modulos: modulosFiltrados });
    
  } catch (err) {
    console.error("❌ Error al obtener módulos:", err);
    res.status(500).json({ message: "Error al obtener módulos" });
  }
};