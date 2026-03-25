const db = require('../config/database');
const path = require('path');
const fs = require('fs');

// GET - Obtener estado de un cliente
exports.obtenerEstadoPorCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const [estado] = await db.query(
      'SELECT * FROM estado WHERE cliente_id = ? ORDER BY created_at DESC LIMIT 1',
      [clienteId]
    );

    if (estado.length === 0) {
      return res.status(404).json({ mensaje: 'No hay estado registrado para este cliente' });
    }

    res.json(estado[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estado', detalle: error.message });
  }
};

// POST - Crear o actualizar estado del cliente
exports.guardarEstado = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const { 
      color_nat, 
      porc_canas, 
      textura, 
      colorimetrista,
      estructura,
      form_decol,
      pose_decol_largos,
      pose_decol_raiz,
      form_tinte,
      pose_tinte_largos,
      pose_tinte_raiz,
      observaciones
    } = req.body;

    // Verificar si ya existe un estado
    const [estadoExistente] = await db.query(
      'SELECT id FROM estado WHERE cliente_id = ?',
      [clienteId]
    );

    if (estadoExistente.length > 0) {
      // Actualizar
      await db.query(
        `UPDATE estado 
         SET color_nat = ?, porc_canas = ?, textura = ?, colorimetrista = ?,
             estructura = ?, form_decol = ?, pose_decol_largos = ?, pose_decol_raiz = ?,
             form_tinte = ?, pose_tinte_largos = ?, pose_tinte_raiz = ?, observaciones = ?
         WHERE cliente_id = ?`,
        [color_nat, porc_canas, textura, colorimetrista, 
         estructura, form_decol, pose_decol_largos, pose_decol_raiz,
         form_tinte, pose_tinte_largos, pose_tinte_raiz, observaciones,
         clienteId]
      );

      res.json({ mensaje: 'Estado actualizado exitosamente' });
    } else {
      // Crear nuevo
      const [resultado] = await db.query(
        `INSERT INTO estado 
         (cliente_id, color_nat, porc_canas, textura, colorimetrista,
          estructura, form_decol, pose_decol_largos, pose_decol_raiz,
          form_tinte, pose_tinte_largos, pose_tinte_raiz, observaciones)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [clienteId, color_nat, porc_canas, textura, colorimetrista,
         estructura, form_decol, pose_decol_largos, pose_decol_raiz,
         form_tinte, pose_tinte_largos, pose_tinte_raiz, observaciones]
      );

      res.status(201).json({
        mensaje: 'Estado creado exitosamente',
        id: resultado.insertId
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar estado', detalle: error.message });
  }
};

// POST - Subir fotos del cliente
exports.subirFotos = async (req, res) => {
  try {
    const { clienteId } = req.params;
    
    // Verificar que se hayan subido archivos
    if (!req.files || (Object.keys(req.files).length === 0)) {
      return res.status(400).json({ error: 'No se han subido archivos' });
    }

    const foto1 = req.files.foto1 ? req.files.foto1[0] : null;
    const foto2 = req.files.foto2 ? req.files.foto2[0] : null;

    // Verificar si existe el estado del cliente
    const [estadoExistente] = await db.query(
      'SELECT id, foto1, foto2 FROM estado WHERE cliente_id = ?',
      [clienteId]
    );

    let estadoId;

    if (estadoExistente.length > 0) {
      // Estado existe - actualizar
      estadoId = estadoExistente[0].id;
      
      // Eliminar fotos antiguas si existen
      if (foto1 && estadoExistente[0].foto1) {
        const oldPath = path.join(__dirname, '../uploads/fotos', estadoExistente[0].foto1);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      
      if (foto2 && estadoExistente[0].foto2) {
        const oldPath = path.join(__dirname, '../uploads/fotos', estadoExistente[0].foto2);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      // Construir query de actualización dinámicamente
      let updateFields = [];
      let updateValues = [];

      if (foto1) {
        updateFields.push('foto1 = ?', 'fecha_foto1 = NOW()');
        updateValues.push(foto1.filename);
      }

      if (foto2) {
        updateFields.push('foto2 = ?', 'fecha_foto2 = NOW()');
        updateValues.push(foto2.filename);
      }

      if (updateFields.length > 0) {
        updateValues.push(clienteId);
        await db.query(
          `UPDATE estado SET ${updateFields.join(', ')} WHERE cliente_id = ?`,
          updateValues
        );
      }
    } else {
      // Estado no existe - crear uno nuevo con las fotos
      const [resultado] = await db.query(
        `INSERT INTO estado 
         (cliente_id, foto1, fecha_foto1, foto2, fecha_foto2)
         VALUES (?, ?, NOW(), ?, NOW())`,
        [
          clienteId,
          foto1 ? foto1.filename : null,
          foto2 ? foto2.filename : null
        ]
      );
      estadoId = resultado.insertId;
    }

    res.json({
      mensaje: 'Fotos subidas exitosamente',
      foto1: foto1 ? foto1.filename : null,
      foto2: foto2 ? foto2.filename : null
    });
  } catch (error) {
    console.error('Error al subir fotos:', error);
    res.status(500).json({ error: 'Error al subir fotos', detalle: error.message });
  }
};

// DELETE - Eliminar una foto específica
exports.eliminarFoto = async (req, res) => {
  try {
    const { clienteId, fotoNumero } = req.params; // fotoNumero: '1' o '2'

    if (fotoNumero !== '1' && fotoNumero !== '2') {
      return res.status(400).json({ error: 'Número de foto inválido' });
    }

    const campoFoto = `foto${fotoNumero}`;
    const campoFecha = `fecha_foto${fotoNumero}`;

    // Obtener el nombre de la foto actual
    const [estado] = await db.query(
      `SELECT ${campoFoto} FROM estado WHERE cliente_id = ?`,
      [clienteId]
    );

    if (estado.length === 0 || !estado[0][campoFoto]) {
      return res.status(404).json({ error: 'Foto no encontrada' });
    }

    const nombreFoto = estado[0][campoFoto];
    const rutaFoto = path.join(__dirname, '../uploads/fotos', nombreFoto);

    // Eliminar archivo físico
    if (fs.existsSync(rutaFoto)) {
      fs.unlinkSync(rutaFoto);
    }

    // Actualizar base de datos
    await db.query(
      `UPDATE estado SET ${campoFoto} = NULL, ${campoFecha} = NULL WHERE cliente_id = ?`,
      [clienteId]
    );

    res.json({ mensaje: `Foto ${fotoNumero} eliminada exitosamente` });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar foto', detalle: error.message });
  }
};