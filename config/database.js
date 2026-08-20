const mariadb = require("mariadb");

/* =========================================================
   POOL DE CONEXIONES
========================================================= */

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    connectionLimit: 5,

    acquireTimeout: 10000,

    idleTimeout: 60
});


/* =========================================================
   PROBAR CONEXIÓN
========================================================= */

async function probarConexion() {
    let conexion;

    try {

        conexion = await pool.getConnection();

        const resultado =
            await conexion.query(`
                SELECT
                    DATABASE() AS baseDatos,
                    VERSION() AS version
            `);

        console.log(
            "✅ Conexión a MariaDB correcta."
        );

        console.log(
            `📦 Base de datos: ${resultado[0].baseDatos}`
        );

        console.log(
            `🗄️ Versión: ${resultado[0].version}`
        );

        return true;

    } catch (error) {

        console.error(
            "❌ No fue posible conectar con MariaDB."
        );

        console.error(
            `Detalle: ${error.message}`
        );

        /*
         * Importante:
         * relanzamos el error para impedir que
         * Express arranque sin base de datos.
         */
        throw error;

    } finally {

        if (conexion) {
            conexion.release();
        }

    }
}
/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports = {
    pool,
    probarConexion
};