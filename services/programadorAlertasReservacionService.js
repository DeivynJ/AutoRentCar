/* =========================================================
   AUTORENTCAR
   PROGRAMADOR AUTOMÁTICO DE ALERTAS DE RESERVACIONES
========================================================= */


const {

    generarAlertasEntregaPendiente,

    generarAlertasDevolucionPendiente

} = require(
    "./alertasReservacionAgenciaService"
);


/* =========================================================
   CONFIGURACIÓN

   Las reservaciones se revisan cada hora.

   La clave_evento evita que una misma alerta
   de entrega se genere varias veces.
========================================================= */


const INTERVALO_REVISION_MS =
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


async function ejecutarRevisionAlertasReservacion() {


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


        const resultadoEntrega =
    await generarAlertasEntregaPendiente();


const resultadoDevolucion =
    await generarAlertasDevolucionPendiente();



const totalCreadas =
    Number(
        resultadoEntrega?.creadas ||
        0
    ) +
    Number(
        resultadoDevolucion?.creadas ||
        0
    );



        if (
            totalCreadas >
            0
        ) {


            console.log(
    "🔔 Alertas de reservaciones generadas:",
    {

        entregas:
            Number(
                resultadoEntrega?.creadas ||
                0
            ),

        devoluciones:
            Number(
                resultadoDevolucion?.creadas ||
                0
            ),

        total:
            totalCreadas

    }
);

 
        }



        return {

    omitida:
        false,

    entrega:
        resultadoEntrega ||
        null,

    devolucion:
        resultadoDevolucion ||
        null

};;



    } catch (error) {


        console.error(
            "❌ Error en la revisión automática de reservaciones:"
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


function iniciarProgramadorAlertasReservacion() {


    if (
        temporizador
    ) {

        return temporizador;

    }



    console.log(
        "⏱️ Revisión automática de reservaciones activa cada hora."
    );



    /*
     * Primera revisión inmediatamente al iniciar
     * AutoRentCar.
     */

    void ejecutarRevisionAlertasReservacion();



    temporizador =
        setInterval(
            () => {


                void ejecutarRevisionAlertasReservacion();


            },
            INTERVALO_REVISION_MS
        );



    return temporizador;


}



/* =========================================================
   DETENER PROGRAMADOR
========================================================= */


function detenerProgramadorAlertasReservacion() {


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
        "⏹️ Revisión automática de reservaciones detenida."
    );


}



/* =========================================================
   EXPORTACIONES
========================================================= */


module.exports = {


    ejecutarRevisionAlertasReservacion,


    iniciarProgramadorAlertasReservacion,


    detenerProgramadorAlertasReservacion


};