/* =========================================================
   AUTORENTCAR
   PROGRAMADOR AUTOMÁTICO DE ALERTAS DE SUSCRIPCIÓN
========================================================= */

const {
    generarAlertasSuscripcionesAdmin
} = require(
    "./alertasSuscripcionAdminService"
);


/* =========================================================
   CONFIGURACIÓN

   Las suscripciones se revisan cada 6 horas.

   El generador utiliza CURDATE() de MariaDB y las claves
   únicas impiden que una misma alerta se duplique.
========================================================= */

const INTERVALO_REVISION_MS =
    6 *
    60 *
    60 *
    1000;


/* =========================================================
   ESTADO INTERNO
========================================================= */

let temporizador =
    null;


let revisionEnCurso =
    false;


/* =========================================================
   EJECUTAR UNA REVISIÓN
========================================================= */

async function ejecutarRevisionAlertasSuscripcion() {

    /*
     * Evitamos que dos revisiones del mismo proceso
     * se ejecuten simultáneamente.
     */

    if (
        revisionEnCurso
    ) {

        return {

            omitida:
                true,

            motivo:
                "REVISION_EN_CURSO"

        };

    }


    revisionEnCurso =
        true;


    try {

        const resultado =
            await generarAlertasSuscripcionesAdmin();


        const totalCreadas =
            Number(
                resultado.superadminCreadas ||
                0
            ) +
            Number(
                resultado.agenciaCreadas ||
                0
            );


        /*
         * Evitamos llenar los logs cada seis horas
         * cuando no ocurrió nada nuevo.
         */

        if (
            totalCreadas >
            0
        ) {

            console.log(
                "🔔 Alertas de suscripción generadas:",
                {

                    superadmin:
                        resultado.superadminCreadas,

                    agencias:
                        resultado.agenciaCreadas,

                    revisadas:
                        resultado.revisadas

                }
            );

        }


        return {

            omitida:
                false,

            ...resultado

        };


    } catch (error) {

        /*
         * Un fallo del programador no debe apagar
         * AutoRentCar.
         *
         * La siguiente revisión volverá a intentarlo.
         */

        console.error(
            "❌ Error en la revisión automática de suscripciones:"
        );


        console.error(
            error
        );


        return {

            omitida:
                false,

            error:
                true

        };


    } finally {

        revisionEnCurso =
            false;

    }

}


/* =========================================================
   INICIAR PROGRAMADOR
========================================================= */

function iniciarProgramadorAlertasSuscripcion() {

    /*
     * No permitimos instalar dos temporizadores dentro
     * del mismo proceso de Node.js.
     */

    if (
        temporizador
    ) {

        return temporizador;

    }


    console.log(
        "⏱️ Revisión automática de suscripciones activa cada 6 horas."
    );


    /*
     * Primera revisión inmediatamente al iniciar
     * AutoRentCar.
     *
     * No esperamos seis horas para comprobar el estado
     * de las suscripciones.
     */

    void ejecutarRevisionAlertasSuscripcion();


    temporizador =
        setInterval(
            () => {

                void ejecutarRevisionAlertasSuscripcion();

            },
            INTERVALO_REVISION_MS
        );


    return temporizador;

}


/* =========================================================
   DETENER PROGRAMADOR
========================================================= */

function detenerProgramadorAlertasSuscripcion() {

    if (
        !temporizador
    ) {

        return;

    }


    clearInterval(
        temporizador
    );


    temporizador =
        null;


    console.log(
        "⏹️ Revisión automática de suscripciones detenida."
    );

}


/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports = {

    ejecutarRevisionAlertasSuscripcion,

    iniciarProgramadorAlertasSuscripcion,

    detenerProgramadorAlertasSuscripcion

};