const db = require('../config/database'); 
const bcrypt = require('bcrypt');

const login = async (req, res) => {
  const { identificador, password } = req.body; 

  try {
    // Buscamos al usuario (limpiamos espacios con trim)
    const idLimpio = identificador.trim();
    const [rows] = await db.query(
      'SELECT id, nombre, cel, pass_hash, id_permisos FROM estilistas WHERE nombre = ? OR cel = ?', 
      [idLimpio, idLimpio]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    const user = rows[0];

    // LA PARTE CRUCIAL: Comparación real con Bcrypt
    const validPassword = await bcrypt.compare(password.trim(), user.pass_hash);

    if (!validPassword) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    // Si todo coincide, mandamos la info
    res.json({ 
      id: user.id, 
      nombre: user.nombre,
      id_permisos: user.id_permisos 
    });

  } catch (error) {
    console.error("Error en authController:", error);
    res.status(500).json({ error: error.message });
  }
};


// Función para registrar un nuevo estilista (con contraseña encriptada)
const registrarEstilista = async (req, res) => {
    const { nombre, cel, password, id_permisos } = req.body;

    try {
        // 1. Encripta la contraseña antes de guardarla
        const saltRounds = 10;
        const hashedPass = await bcrypt.hash(password, saltRounds);

        // 2. Inserta en la base de datos
        const [result] = await db.query(
            'INSERT INTO estilistas (nombre, cel, pass_hash, id_permisos) VALUES (?, ?, ?, ?)',
            [nombre, cel, hashedPass, id_permisos || null]
        );

        res.status(201).json({ 
            mensaje: "Estilista registrado con éxito, morro.",
            id: result.insertId 
        });

    } catch (error) {
        console.error("Error al registrar:", error);
        res.status(500).json({ error: "No se pudo registrar, chécale bien." });
    }
};

module.exports = { login, registrarEstilista };

