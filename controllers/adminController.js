const {
    pool
} = require("../config/database");

/* =========================================================
   MOSTRAR DASHBOARD DEL SUPERADMINISTRADOR
========================================================= */

async function mostrarDashboard(req, res) {
    let conexion;

    try {
        conexion = await pool.getConnection();

        /* -------------------------------------------------
           ESTADÍSTICAS GENERALES
        ------------------------------------------------- */

        const agenciasResultado =
            await conexion.query(`
                SELECT
                    COUNT(*) AS total
                FROM agencias
            `);

        const agenciasActivasResultado =
            await conexion.query(`
                SELECT
                    COUNT(*) AS total
                FROM agencias
                WHERE estado = 'activa'
            `);

        const suscripcionesResultado =
            await conexion.query(`
                SELECT
                    COUNT(*) AS total
                FROM suscripciones
                WHERE estado = 'activa'
            `);

        const usuariosResultado =
            await conexion.query(`
                SELECT
                    COUNT(*) AS total
                FROM usuarios
                WHERE estado = 'activo'
            `);

        /* -------------------------------------------------
           AGENCIAS RECIENTES
        ------------------------------------------------- */

        const agenciasRecientes =
            await conexion.query(`
                SELECT
                    a.id,
                    a.nombre,
                    a.ciudad,
                    a.provincia,
                    a.estado,
                    a.fecha_creacion
                FROM agencias a
                ORDER BY a.fecha_creacion DESC
                LIMIT 5
            `);

        /* -------------------------------------------------
           PREPARAR ESTADÍSTICAS
        ------------------------------------------------- */

        const estadisticas = {

            agencias:
                Number(
                    agenciasResultado[0].total
                ),

            agenciasActivas:
                Number(
                    agenciasActivasResultado[0].total
                ),

            suscripciones:
                Number(
                    suscripcionesResultado[0].total
                ),

            usuarios:
                Number(
                    usuariosResultado[0].total
                )
        };

        /* -------------------------------------------------
           RENDER
        ------------------------------------------------- */

        return res.render(
            "admin/dashboard",
            {
                titulo:
                    "Dashboard",

                subtituloPagina:
                    "Resumen general",

                paginaActual:
                    "dashboard",

                usuario:
                    req.session.usuario,

                estadisticas,

                agenciasRecientes,

                totalAgencias:
                    estadisticas.agencias
            }
        );

    } catch (error) {

        console.error(
            "Error cargando el dashboard:",
            error
        );

        return res
            .status(500)
            .send(
                "No fue posible cargar el panel administrativo."
            );

    } finally {

        if (conexion) {
            conexion.release();
        }

    }
}

module.exports = {
    mostrarDashboard
};