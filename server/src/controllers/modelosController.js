const pool = require('../config/db');

const modelosController = {
    getAllModelos: async (req, res) => {
        try {
            const query = `
                SELECT 
                    id_modelo AS "id", 
                    modelo AS "nombre", 
                    year AS "anoVersion", 
                    "Serie" AS "numeroSerie",
                    link_fich_tecn AS "enlaceFichaTecnica",
                    inf_tecnica AS "infoTecnica",
                    id_marca AS "marcaId", 
                    id_tipo_equipo AS "tipoEquipoId"
                FROM "Modelos_Equipos"
                ORDER BY modelo ASC;
            `;
            const { rows } = await pool.query(query);
            res.json(rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener los modelos de la base de datos.' });
        }
    },

    //Crear un nuevo modelo en "Modelos_Equipos"
    createModelo: async (req, res) => {
        const { nombre, anoVersion, numeroSerie, enlaceFichaTecnica, infoTecnica, marcaId, tipoEquipoId } = req.body;
        try {
            const query = `
                INSERT INTO "Modelos_Equipos" (modelo, year, "Serie", link_fich_tecn, inf_tecnica, id_marca, id_tipo_equipo)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING 
                    id_modelo AS "id", 
                    modelo AS "nombre", 
                    year AS "anoVersion", 
                    "Serie" AS "numeroSerie",
                    link_fich_tecn AS "enlaceFichaTecnica",
                    inf_tecnica AS "infoTecnica", 
                    id_marca AS "marcaId", 
                    id_tipo_equipo AS "tipoEquipoId";
            `;
            const values = [
                nombre, 
                anoVersion || null, 
                numeroSerie || null, // Se insertará como NULL si viene vacío desde la UI
                enlaceFichaTecnica || null, 
                infoTecnica || null, 
                marcaId, 
                tipoEquipoId
            ];
            const { rows } = await pool.query(query, values);
            res.status(201).json(rows[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al registrar el nuevo modelo.' });
        }
    },

    // 3. Actualizar un modelo existente en "Modelos_Equipos" (permitiendo modificar la Serie)
    updateModelo: async (req, res) => {
        const { id } = req.params; // Corresponde al id_modelo
        const { nombre, anoVersion, numeroSerie, enlaceFichaTecnica, infoTecnica, marcaId, tipoEquipoId } = req.body;
        try {
            const query = `
                UPDATE "Modelos_Equipos" 
                SET 
                    modelo = $1, 
                    year = $2, 
                    "Serie" = $3, 
                    link_fich_tecn = $4, 
                    inf_tecnica = $5, 
                    id_marca = $6, 
                    id_tipo_equipo = $7
                WHERE id_modelo = $8
                RETURNING 
                    id_modelo AS "id", 
                    modelo AS "nombre", 
                    year AS "anoVersion", 
                    "Serie" AS "numeroSerie",
                    link_fich_tecn AS "enlaceFichaTecnica",
                    inf_tecnica AS "infoTecnica", 
                    id_marca AS "marcaId", 
                    id_tipo_equipo AS "tipoEquipoId";
            `;
            const values = [
                nombre, 
                anoVersion || null, 
                numeroSerie || null, 
                enlaceFichaTecnica || null, 
                infoTecnica || null, 
                marcaId, 
                tipoEquipoId, 
                id
            ];
            const { rows } = await pool.query(query, values);
            
            if (rows.length === 0) {
                return res.status(404).json({ error: 'Modelo no encontrado.' });
            }
            res.json(rows[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al actualizar el modelo.' });
        }
    },

    // 4. Eliminar un modelo de "Modelos_Equipos"
    deleteModelo: async (req, res) => {
        const { id } = req.params;
        try {
            const { rowCount } = await pool.query('DELETE FROM "Modelos_Equipos" WHERE id_modelo = $1', [id]);
            if (rowCount === 0) {
                return res.status(404).json({ error: 'Modelo no encontrado.' });
            }
            res.json({ message: 'Modelo eliminado correctamente de la base de datos.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al eliminar el modelo.' });
        }
    },

    // =======================================================
    // GESTIÓN DE RELACIÓN CON REPUESTOS
    // =======================================================

    // 5. Vincular un repuesto con un modelo utilizando "Modelo_Repuesto"
    linkRepuestoToModelo: async (req, res) => {
        const { modeloId, repuestoId } = req.body;
        try {
            const query = `
                INSERT INTO "Modelo_Repuesto" (id_modelo, id_repuesto)
                VALUES ($1, $2)
                ON CONFLICT (id_modelo, id_repuesto) DO NOTHING 
                RETURNING id_modelo AS "modeloId", id_repuesto AS "repuestoId";
            `;
            const { rows } = await pool.query(query, [modeloId, repuestoId]);
            res.status(201).json(rows[0] || { modeloId, repuestoId });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al vincular el repuesto con el modelo.' });
        }
    },

    // 6. Obtener todas las relaciones activas de repuestos y modelos
    getAllRepuestosModelosLinks: async (req, res) => {
        try {
            const query = `
                SELECT 
                    id_modelo AS "modeloId", 
                    id_repuesto AS "repuestoId",
                    id_repuesto_modelo AS ""
                FROM "Modelo_Repuesto";
            `;
            const { rows } = await pool.query(query);
            res.json(rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener relaciones de componentes.' });
        }
    }
};

module.exports = modelosController;