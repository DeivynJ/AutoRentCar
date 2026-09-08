/* =========================================================
   AUTORENTCAR
   PRUEBA DEL GENERADOR DE ALERTAS DE SUSCRIPCIÓN
========================================================= */

require(
    "dotenv"
).config();


const {
    pool
} = require(
    "../config/database"
);


const {
    generarAlertasSuscripcionesAdmin
} = require(
    "../services/alertasSuscripcionAdminService"
);


/* =========================================================
   EJECUTAR
========================================================= */

async function ejecutar() {

    try {

        const resultado =
            await generarAlertasSuscripcionesAdmin();


        console.log(
            "\n========================================"
        );

        console.log(
            "ALERTAS DE SUSCRIPCIÓN"
        );

        console.log(
            "========================================"
        );


        console.log(
            resultado
        );


        console.log(
            "\nPrueba completada."
        );


    } catch (error) {

        console.error(
            "\n❌ Error generando alertas:"
        );

        console.error(
            error
        );


        process.exitCode =
            1;


    } finally {

        await pool.end();

    }

}


ejecutar();