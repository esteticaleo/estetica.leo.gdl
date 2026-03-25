const db = require('../config/database');

// GET - Obtener todos los clientes
exports.obtenerClientes = async (req, res) => {
  try {
    // Obtener parámetros de query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    // Construir la query base con búsqueda
    let whereClause = '';
    let queryParams = [];

    if (search.trim() !== '') {
      whereClause = 'WHERE nombre LIKE ? OR tel LIKE ?';
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern);
    }

    // Obtener el total de registros
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM clientes ${whereClause}`,
      queryParams
    );
    const total = countResult[0].total;

    // Obtener los clientes paginados
    const [clientes] = await db.query(
      `SELECT * FROM clientes 
       ${whereClause}
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    // Calcular información de paginación
    const totalPages = Math.ceil(total / limit);

    res.json({
      clientes,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords: total,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error al obtener clientes',
      detalle: error.message
    });
  }
};

// GET - Obtener un cliente por ID
exports.obtenerClientePorId = async (req, res) => {
  try {
    const { id } = req.params;
    const [cliente] = await db.query('SELECT * FROM clientes WHERE id = ?', [id]);

    if (cliente.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json(cliente[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener cliente', detalle: error.message });
  }
};

// POST - Crear nuevo cliente
exports.crearCliente = async (req, res) => {
  try {
    const { nombre, domicilio, ciudad, cp, fecha_nac, tel, instagram, facebook } = req.body;

    // Validación básica
    if (!nombre || !tel) {
      return res.status(400).json({ error: 'Nombre y teléfono son obligatorios' });
    }

    const [resultado] = await db.query(
      `INSERT INTO clientes (nombre, domicilio, ciudad, cp, fecha_nac, tel, instagram, facebook, fecha_reg) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURDATE())`,
      [nombre, domicilio, ciudad, cp, fecha_nac, tel, instagram, facebook]
    );

    res.status(201).json({
      mensaje: 'Cliente creado exitosamente',
      id: resultado.insertId
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'El teléfono ya está registrado' });
    } else {
      res.status(500).json({ error: 'Error al crear cliente', detalle: error.message });
    }
  }
};

// PUT - Actualizar cliente
exports.actualizarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, domicilio, ciudad, cp, fecha_nac, tel, instagram, facebook } = req.body;

    const [resultado] = await db.query(
      `UPDATE clientes 
       SET nombre = ?, domicilio = ?, ciudad = ?, cp = ?, fecha_nac = ?, 
           tel = ?, instagram = ?, facebook = ?
       WHERE id = ?`,
      [nombre, domicilio, ciudad, cp, fecha_nac, tel, instagram, facebook, id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json({ mensaje: 'Cliente actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar cliente', detalle: error.message });
  }
};

// DELETE - Desactivar cliente (soft delete)
exports.eliminarCliente = async (req, res) => {
  try {
    const { id } = req.params;

    const [resultado] = await db.query(
      'UPDATE clientes SET estatus = false WHERE id = ?',
      [id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json({ mensaje: 'Cliente desactivado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar cliente', detalle: error.message });
  }
};