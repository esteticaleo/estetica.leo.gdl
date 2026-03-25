const db = require('../config/database');

const agendaController = {

    getAgenda: async (req, res) => {
        try {
            console.log("Entró a getAgenda");

            const { estilista_id, fecha_inicio, fecha_fin } = req.query;

            let query = `
                SELECT a.*, c.nombre as cliente_nombre, c.tel as cliente_tel, e.nombre as estilista_nombre 
                FROM agenda a
                LEFT JOIN clientes c ON a.cliente_id = c.id
                LEFT JOIN estilistas e ON a.estilista_id = e.id
                WHERE 1=1
            `;

            const params = [];

            if (estilista_id) {
                query += " AND a.estilista_id = ?";
                params.push(estilista_id);
            }

            if (fecha_inicio && fecha_fin) {
                query += " AND a.fecha BETWEEN ? AND ?";
                params.push(fecha_inicio, fecha_fin);
            }

            query += " ORDER BY a.fecha ASC, a.hora ASC";

            const [rows] = await db.query(query, params);

            res.json(rows);

        } catch (error) {
            console.error("Error en getAgenda:", error);
            res.status(500).json({ error: error.message });
        }
    },

   crearCita: async (req, res) => {
    try {
        const { fecha, hora, estilista_id, cliente_id, servicio_id, notas, anticipo } = req.body;

        // 1. Validar disponibilidad
      const [existe] = await db.query(
    `SELECT id FROM agenda 
     WHERE fecha = ? 
     AND TIME_FORMAT(hora, '%H:%i') = TIME_FORMAT(?, '%H:%i') 
     AND estilista_id = ? 
     AND estado_id = 1 
     AND estatus_cita NOT IN ('Cancelada', 'No vino')`, 
    [fecha, hora, estilista_id]
    );

        if (existe.length > 0) {
            return res.status(400).json({ 
                mensaje: 'Ese estilista ya tiene cita agendada a esa hora, Elige otra fecha u horario.' 
            });
        }

        // 2. Si está libre, procedemos al INSERT
        const query = `INSERT INTO agenda (fecha, hora, cliente_id, estilista_id, servicio_id, notas, anticipo, estatus_pago, estado_id, estatus_cita) 
                       VALUES (?, ?, ?, ?, ?, ?, ?, 'Pendiente', 1, 'Agendada')`;
        
        await db.query(query, [fecha, hora, cliente_id, estilista_id, servicio_id, notas, anticipo]);

        res.json({ message: "Cita agendada con éxito" });
    } catch (error) {
        console.error("Error al crear cita:", error);
        res.status(500).json({ error: error.message });
    }
    },

    actualizarCita: async (req, res) => {
    try {
        const { id } = req.params;
        const datos = req.body; // Aquí llega { estatus_cita: 'Cancelada' } o { referencia_pago: 'XXX' }

        // se crea el query dinámicamente para no borrar otros datos
        const query = `
            UPDATE agenda 
            SET ? 
            WHERE id = ?
        `;

        // El "?" de mysql2 se encarga de mapear las llaves del objeto a las columnas de la BD
        const [result] = await db.query(query, [datos, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: "No se encontró la cita" });
        }

        res.json({ mensaje: "¡Cita actualizada con éxito!" });
    } catch (error) {
        console.error("Error en actualizarCita:", error);
        res.status(500).json({ error: error.message });
    }
},

getCitaById: async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT a.*, c.nombre as cliente_nombre, c.tel as cliente_tel, 
                   c.fecha_nacimiento, e.nombre as estilista_nombre 
            FROM agenda a
            LEFT JOIN clientes c ON a.cliente_id = c.id
            LEFT JOIN estilistas e ON a.estilista_id = e.id
            WHERE a.id = ?
        `;
        const [rows] = await db.query(query, [id]);
        if (rows.length === 0) return res.status(404).json({ mensaje: "No se encontró la cita" });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
},

eliminarCita: async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM agenda WHERE id = ?', [id]);
        res.json({ message: "Cita borrada" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

};

module.exports = agendaController;
