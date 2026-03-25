const db = require('../config/database');

// GET - Obtener todas las visitas de un cliente
exports.obtenerVisitasPorCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;

    // Parámetros de paginación y filtros
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const fecha = req.query.fecha || '';
    const tipo = req.query.tipo || '';
    const offset = (page - 1) * limit;

    // Construir WHERE clause
    let whereConditions = ['v.cliente_id = ?'];
    let queryParams = [clienteId];

    // Filtro fecha
    if (fecha && fecha !== '') {
      whereConditions.push('DATE(v.fecha) = ?');
      queryParams.push(fecha);
    }

    // Filtro por tipo
    if (tipo && tipo !== '') {
      whereConditions.push('v.tipo = ?');
      queryParams.push(tipo);
    }

    const whereClause = 'WHERE ' + whereConditions.join(' AND ');

    // Obtener total de registros
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total 
       FROM visitas v 
       ${whereClause}`,
      queryParams
    );
    const total = countResult[0].total;

    // Obtener visitas paginadas
    const [visitas] = await db.query(
      `SELECT v.*, e.nombre as estilista_nombre
       FROM visitas v
       LEFT JOIN estilistas e ON v.estilista_id = e.id
       ${whereClause}
       ORDER BY v.fecha DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    // Calcular paginación
    const totalPages = Math.ceil(total / limit);

    res.json({
      visitas,
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
    res.status(500).json({ error: 'Error al obtener visitas', detalle: error.message });
  }
};

// GET - Obtener una visita por ID
exports.obtenerVisitaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const [visita] = await db.query(
      `SELECT v.*, e.nombre as estilista_nombre
       FROM visitas v
       LEFT JOIN estilistas e ON v.estilista_id = e.id
       WHERE v.id = ?`,
      [id]
    );

    if (visita.length === 0) {
      return res.status(404).json({ error: 'Visita no encontrada' });
    }

    res.json(visita[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener visita', detalle: error.message });
  }
};

// POST - Crear nueva visita
exports.crearVisita = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const {
      estilista_id,
      tipo,
      retoque,
      fecha,
      peticiones,
      tipo_cambio
    } = req.body;

    // VALIDACIÓN: tipo_cambio solo si tipo = 'Cambio de color'
    if (tipo !== 'Cambio de color' && tipo_cambio) {
      return res.status(400).json({
        error: 'tipo_cambio solo es válido cuando tipo = "Cambio de color"'
      });
    }

    const [resultado] = await db.query(
      `INSERT INTO visitas
       (cliente_id, estilista_id, tipo, retoque, fecha, peticiones, tipo_cambio)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [clienteId, estilista_id, tipo, retoque, fecha || new Date(),
        peticiones, tipo_cambio || null]
    );

    res.status(201).json({
      mensaje: 'Visita registrada exitosamente',
      id: resultado.insertId
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear visita', detalle: error.message });
  }
};

// PUT - Actualizar visita
exports.actualizarVisita = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      estilista_id,
      tipo,
      retoque,
      fecha,
      peticiones,
      tipo_cambio
    } = req.body;

    // VALIDACIÓN: tipo_cambio solo si tipo = 'Cambio de color'
    if (tipo !== 'Cambio de color' && tipo_cambio) {
      return res.status(400).json({
        error: 'tipo_cambio solo es válido cuando tipo = "Cambio de color"'
      });
    }

    const [resultado] = await db.query(
      `UPDATE visitas
       SET estilista_id = ?, tipo = ?, retoque = ?, fecha = ?,
           peticiones = ?, tipo_cambio = ?
       WHERE id = ?`,
      [estilista_id, tipo, retoque, fecha, peticiones,
        tipo_cambio || null, id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: 'Visita no encontrada' });
    }

    res.json({ mensaje: 'Visita actualizada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar visita', detalle: error.message });
  }
};

// DELETE - Eliminar visita
exports.eliminarVisita = async (req, res) => {
  try {
    const { id } = req.params;
    const [resultado] = await db.query('DELETE FROM visitas WHERE id = ?', [id]);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: 'Visita no encontrada' });
    }

    res.json({ mensaje: 'Visita eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar visita', detalle: error.message });
  }
};