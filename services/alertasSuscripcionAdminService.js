/* =========================================================
   AUTORENTCAR
   ALERTAS DE SUSCRIPCIÓN
   SUPERADMIN + ADMINISTRADORES DE AGENCIA
========================================================= */

const {
    pool
} = require(
    "../config/database"
);


const {
    crearNotificacionAdmin
} = require(
    "./notificacionAdminService"
);


const {
    crearNotificacionAgencia
} = require(
    "./notificacionAgenciaService"
);


/* =========================================================
   DETERMINAR EVENTO SEGÚN DÍAS RESTANTES
========================================================= */

function determinarEventoSuscripcion(
    suscripcion
) {

    const diasRestantes =
        Number(
            suscripcion.dias_restantes
        );


    if (
        !Number.isInteger(
            diasRestantes
        )
    ) {

        return null;

    }


    const esPrueba =
        suscripcion.estado ===
        "prueba";


    /*
     * Si administrativamente está marcada
     * como vencida pero la fecha aún no pasó,
     * no generamos aviso de próximo vencimiento.
     */

    if (
        suscripcion.estado ===
            "vencida" &&
        diasRestantes >= 0
    ) {

        return null;

    }


    /* =====================================================
       YA VENCIÓ
    ===================================================== */

    if (
        diasRestantes < 0
    ) {

        return {

            codigo:
                esPrueba
                    ? "prueba_vencida"
                    : "vencida",

            tipoAdmin:
                esPrueba
                    ? "prueba_vencida"
                    : "suscripcion_vencida",

            nivel:
                "critica",

            tituloAdmin:
                esPrueba
                    ? "Período de prueba vencido"
                    : "Suscripción vencida",

            mensajeAdmin:
                esPrueba
                    ? `${suscripcion.agencia_nombre} tiene su período de prueba vencido desde el ${suscripcion.fecha_fin}.`
                    : `${suscripcion.agencia_nombre} tiene su suscripción vencida desde el ${suscripcion.fecha_fin}.`,

            /*
             * Después de vencer no dependemos
             * de la campana de la agencia.
             */

            notificarAgencia:
                false

        };

    }


    /* =====================================================
       VENCE HOY
    ===================================================== */

    if (
        diasRestantes === 0
    ) {

        return {

            codigo:
                esPrueba
                    ? "prueba_vence_hoy"
                    : "vence_hoy",

            tipoAdmin:
                esPrueba
                    ? "prueba_vence_hoy"
                    : "suscripcion_vence_hoy",

            nivel:
                "advertencia",

            tituloAdmin:
                esPrueba
                    ? "El período de prueba vence hoy"
                    : "La suscripción vence hoy",

            mensajeAdmin:
                esPrueba
                    ? `El período de prueba de ${suscripcion.agencia_nombre} vence hoy ${suscripcion.fecha_fin}.`
                    : `La suscripción de ${suscripcion.agencia_nombre} vence hoy ${suscripcion.fecha_fin}.`,

            tituloAgencia:
                esPrueba
                    ? "Tu período de prueba vence hoy"
                    : "Tu suscripción vence hoy",

            mensajeAgencia:
                esPrueba
                    ? `Tu período de prueba del plan ${suscripcion.plan_nombre} vence hoy. Comunícate con AutoRentCar para continuar utilizando el servicio.`
                    : `Tu suscripción al plan ${suscripcion.plan_nombre} vence hoy. Realiza la renovación para mantener activo el servicio.`,

            tipoAgencia:
                esPrueba
                    ? "prueba_vence_hoy"
                    : "suscripcion_vence_hoy",

            notificarAgencia:
                true

        };

    }


    /* =====================================================
       1 DÍA
    ===================================================== */

    if (
        diasRestantes <= 1
    ) {

        return {

            codigo:
                esPrueba
                    ? "prueba_vence_1"
                    : "vence_1",

            tipoAdmin:
                esPrueba
                    ? "prueba_vence_1_dia"
                    : "suscripcion_vence_1_dia",

            nivel:
                "advertencia",

            tituloAdmin:
                esPrueba
                    ? "Período de prueba próximo a vencer"
                    : "Suscripción próxima a vencer",

            mensajeAdmin:
                esPrueba
                    ? `El período de prueba de ${suscripcion.agencia_nombre} vence mañana, ${suscripcion.fecha_fin}.`
                    : `La suscripción de ${suscripcion.agencia_nombre} vence mañana, ${suscripcion.fecha_fin}.`,

            tituloAgencia:
                esPrueba
                    ? "Tu período de prueba vence mañana"
                    : "Tu suscripción vence mañana",

            mensajeAgencia:
                esPrueba
                    ? `Tu período de prueba del plan ${suscripcion.plan_nombre} vence mañana. Comunícate con AutoRentCar para continuar utilizando el servicio.`
                    : `Tu suscripción al plan ${suscripcion.plan_nombre} vence mañana. Te recomendamos realizar la renovación antes de su vencimiento.`,

            tipoAgencia:
                esPrueba
                    ? "prueba_vence_1_dia"
                    : "suscripcion_vence_1_dia",

            notificarAgencia:
                true

        };

    }


    /* =====================================================
       3 DÍAS O MENOS
    ===================================================== */

    if (
        diasRestantes <= 3
    ) {

        return {

            codigo:
                esPrueba
                    ? "prueba_vence_3"
                    : "vence_3",

            tipoAdmin:
                esPrueba
                    ? "prueba_vence_3_dias"
                    : "suscripcion_vence_3_dias",

            nivel:
                "advertencia",

            tituloAdmin:
                esPrueba
                    ? "Período de prueba próximo a vencer"
                    : "Suscripción próxima a vencer",

            mensajeAdmin:
                esPrueba
                    ? `El período de prueba de ${suscripcion.agencia_nombre} vence en ${diasRestantes} días, el ${suscripcion.fecha_fin}.`
                    : `La suscripción de ${suscripcion.agencia_nombre} vence en ${diasRestantes} días, el ${suscripcion.fecha_fin}.`,

            tituloAgencia:
                esPrueba
                    ? "Tu período de prueba está por vencer"
                    : "Tu suscripción está por vencer",

            mensajeAgencia:
                esPrueba
                    ? `Tu período de prueba del plan ${suscripcion.plan_nombre} vence en ${diasRestantes} días. Comunícate con AutoRentCar para continuar con el servicio.`
                    : `Tu suscripción al plan ${suscripcion.plan_nombre} vence en ${diasRestantes} días. Te recomendamos realizar la renovación a tiempo.`,

            tipoAgencia:
                esPrueba
                    ? "prueba_vence_3_dias"
                    : "suscripcion_vence_3_dias",

            notificarAgencia:
                true

        };

    }


    /* =====================================================
       7 DÍAS O MENOS
    ===================================================== */

    if (
        diasRestantes <= 7
    ) {

        return {

            codigo:
                esPrueba
                    ? "prueba_vence_7"
                    : "vence_7",

            tipoAdmin:
                esPrueba
                    ? "prueba_vence_7_dias"
                    : "suscripcion_vence_7_dias",

            nivel:
                "advertencia",

            tituloAdmin:
                esPrueba
                    ? "Período de prueba próximo a vencer"
                    : "Suscripción próxima a vencer",

            mensajeAdmin:
                esPrueba
                    ? `El período de prueba de ${suscripcion.agencia_nombre} vence en ${diasRestantes} días, el ${suscripcion.fecha_fin}.`
                    : `La suscripción de ${suscripcion.agencia_nombre} vence en ${diasRestantes} días, el ${suscripcion.fecha_fin}.`,

            tituloAgencia:
                esPrueba
                    ? "Tu período de prueba vence próximamente"
                    : "Tu suscripción vence próximamente",

            mensajeAgencia:
                esPrueba
                    ? `Tu período de prueba del plan ${suscripcion.plan_nombre} vence en ${diasRestantes} días. Comunícate con AutoRentCar si deseas continuar con el servicio.`
                    : `Tu suscripción al plan ${suscripcion.plan_nombre} vence en ${diasRestantes} días. Puedes gestionar la renovación con AutoRentCar antes de la fecha de vencimiento.`,

            tipoAgencia:
                esPrueba
                    ? "prueba_vence_7_dias"
                    : "suscripcion_vence_7_dias",

            notificarAgencia:
                true

        };

    }


    return null;

}


/* =========================================================
   GENERAR ALERTAS
========================================================= */

async function generarAlertasSuscripcionesAdmin() {

    let conexion;


    try {

        conexion =
            await pool.getConnection();


        /*
         * Conservamos la misma regla utilizada
         * actualmente por el sistema:
         *
         * última suscripción registrada por agencia.
         */

        const suscripciones =
            await conexion.query(
                `
                SELECT

                    s.id
                        AS suscripcion_id,

                    s.agencia_id,

                    s.plan_id,

                    s.estado,

                    DATE_FORMAT(
                        s.fecha_fin,
                        '%Y-%m-%d'
                    )
                        AS fecha_fin,

                    DATEDIFF(
                        s.fecha_fin,
                        CURDATE()
                    )
                        AS dias_restantes,

                    a.nombre
                        AS agencia_nombre,

                    p.nombre
                        AS plan_nombre

                FROM suscripciones s

                INNER JOIN
                (
                    SELECT

                        agencia_id,

                        MAX(id)
                            AS suscripcion_id

                    FROM suscripciones

                    GROUP BY
                        agencia_id

                ) ultima

                    ON ultima.suscripcion_id =
                        s.id

                INNER JOIN agencias a

                    ON a.id =
                        s.agencia_id

                INNER JOIN planes p

                    ON p.id =
                        s.plan_id

                WHERE

                    s.fecha_fin IS NOT NULL

                    AND s.estado IN
                    (
                        'activa',
                        'prueba',
                        'vencida'
                    )

                ORDER BY
                    s.fecha_fin ASC,
                    s.id ASC
                `
            );


        const resumen = {

            revisadas:
                suscripciones.length,

            conAlerta:
                0,

            superadminCreadas:
                0,

            superadminDuplicadas:
                0,

            agenciaCreadas:
                0,

            agenciaDuplicadas:
                0,

            sinAlerta:
                0

        };


        for (
            const suscripcion
            of suscripciones
        ) {

            const evento =
                determinarEventoSuscripcion(
                    suscripcion
                );


            if (
                !evento
            ) {

                resumen.sinAlerta +=
                    1;


                continue;

            }


            resumen.conAlerta +=
                1;


            /* =================================================
               SUPERADMIN
            ================================================= */

            const claveAdmin =
                `suscripcion:${
                    suscripcion.suscripcion_id
                }:${
                    evento.codigo
                }:${
                    suscripcion.fecha_fin
                }`;


            const resultadoAdmin =
                await crearNotificacionAdmin(
                    {

                        categoria:
                            "suscripciones",

                        tipo:
                            evento.tipoAdmin,

                        claveEvento:
                            claveAdmin,

                        titulo:
                            evento.tituloAdmin,

                        mensaje:
                            evento.mensajeAdmin,

                        destinoUrl:
                            `/admin/agencias/${
                                suscripcion.agencia_id
                            }/suscripcion`,

                        entidadTipo:
                            "suscripcion",

                        entidadId:
                            suscripcion.suscripcion_id,

                        nivel:
                            evento.nivel

                    },
                    conexion
                );


            if (
                resultadoAdmin.creada
            ) {

                resumen.superadminCreadas +=
                    1;

            }


            if (
                resultadoAdmin.duplicada
            ) {

                resumen.superadminDuplicadas +=
                    1;

            }


            /* =================================================
               ADMINISTRADORES DE LA AGENCIA

               Solo mientras todavía puede acceder al panel.
            ================================================= */

            if (
                evento.notificarAgencia
            ) {

                const claveAgencia =
                    `suscripcion:${
                        suscripcion.suscripcion_id
                    }:${
                        evento.codigo
                    }:${
                        suscripcion.fecha_fin
                    }`;


                const resultadoAgencia =
                    await crearNotificacionAgencia({

                        agenciaId:
                            suscripcion.agencia_id,

                        categoria:
                            "suscripciones",

                        tipo:
                            evento.tipoAgencia,

                        claveEvento:
                            claveAgencia,

                        titulo:
                            evento.tituloAgencia,

                        mensaje:
                            evento.mensajeAgencia,

                        /*
                         * Actualmente la agencia no posee
                         * una pantalla propia para gestionar
                         * la suscripción de la plataforma.
                         */

                        destinoUrl:
                            "/panel",

                        entidadTipo:
                            "suscripcion",

                        entidadId:
                            suscripcion.suscripcion_id,

                        nivel:
                            evento.nivel,

                        audiencia:
                            "administradores",

                        conexion

                    });


                if (
                    resultadoAgencia.creada
                ) {

                    resumen.agenciaCreadas +=
                        1;

                }


                if (
                    resultadoAgencia.duplicada
                ) {

                    resumen.agenciaDuplicadas +=
                        1;

                }

            }

        }


        return resumen;


    } finally {

        if (
            conexion
        ) {

            conexion.release();

        }

    }

}


/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports = {

    generarAlertasSuscripcionesAdmin

};