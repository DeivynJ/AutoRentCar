const {
    pool
} = require(
    "../config/database"
);


/* =========================================================
   ESTADOS QUE CONSUMEN DISPONIBILIDAD
========================================================= */

const ESTADOS_RESERVACION_BLOQUEANTES = [
    "pendiente",

    "pendiente_pago",

    "confirmada",

    "en_curso"
];


/* =========================================================
   ERROR CONTROLADO DEL SERVICIO
========================================================= */

function crearErrorDisponibilidad(
    codigo,
    mensaje,
    status = 400
) {

    const error =
        new Error(
            mensaje
        );

    error.codigo =
        codigo;

    error.status =
        status;

    return error;

}


/* =========================================================
   VALIDAR ID ENTERO POSITIVO
========================================================= */

function normalizarId(
    valor,
    nombreCampo
) {

    const numero =
        Number(
            valor
        );


    if (
        !Number.isInteger(
            numero
        ) ||
        numero <= 0
    ) {

        throw crearErrorDisponibilidad(
            "ID_INVALIDO",
            `El campo ${nombreCampo} no es válido.`
        );

    }


    return numero;

}


/* =========================================================
   VALIDAR FECHA YYYY-MM-DD
========================================================= */

function normalizarFecha(
    valor,
    nombreCampo
) {

    const fecha =
        String(
            valor ||
            ""
        ).trim();


    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(
            fecha
        )
    ) {

        throw crearErrorDisponibilidad(
            "FECHA_INVALIDA",
            `El campo ${nombreCampo} no tiene una fecha válida.`
        );

    }


    const [
        anio,
        mes,
        dia
    ] =
        fecha
            .split("-")
            .map(Number);


    const fechaValidacion =
        new Date(
            Date.UTC(
                anio,
                mes - 1,
                dia
            )
        );


    const esFechaReal =
        fechaValidacion.getUTCFullYear() === anio &&
        fechaValidacion.getUTCMonth() === mes - 1 &&
        fechaValidacion.getUTCDate() === dia;


    if (!esFechaReal) {

        throw crearErrorDisponibilidad(
            "FECHA_INVALIDA",
            `El campo ${nombreCampo} no tiene una fecha válida.`
        );

    }


    return fecha;

}


/* =========================================================
   VALIDAR Y NORMALIZAR HORA
========================================================= */

function normalizarHora(
    valor,
    nombreCampo
) {

    const hora =
        String(
            valor ||
            ""
        ).trim();


    const coincidencia =
        hora.match(
            /^(\d{2}):(\d{2})(?::(\d{2}))?$/
        );


    if (!coincidencia) {

        throw crearErrorDisponibilidad(
            "HORA_INVALIDA",
            `El campo ${nombreCampo} no tiene una hora válida.`
        );

    }


    const horas =
        Number(
            coincidencia[1]
        );

    const minutos =
        Number(
            coincidencia[2]
        );

    const segundos =
        Number(
            coincidencia[3] ||
            0
        );


    if (
        horas > 23 ||
        minutos > 59 ||
        segundos > 59
    ) {

        throw crearErrorDisponibilidad(
            "HORA_INVALIDA",
            `El campo ${nombreCampo} no tiene una hora válida.`
        );

    }


    return [
        String(horas).padStart(
            2,
            "0"
        ),

        String(minutos).padStart(
            2,
            "0"
        ),

        String(segundos).padStart(
            2,
            "0"
        )
    ].join(":");

}


/* =========================================================
   VALIDAR PERÍODO
========================================================= */

function normalizarPeriodo({
    fechaRecogida,
    horaRecogida,
    fechaEntrega,
    horaEntrega
}) {

    const fechaInicio =
        normalizarFecha(
            fechaRecogida,
            "fechaRecogida"
        );

    const horaInicio =
        normalizarHora(
            horaRecogida,
            "horaRecogida"
        );

    const fechaFin =
        normalizarFecha(
            fechaEntrega,
            "fechaEntrega"
        );

    const horaFin =
        normalizarHora(
            horaEntrega,
            "horaEntrega"
        );


    const inicio =
        `${fechaInicio} ${horaInicio}`;

    const fin =
        `${fechaFin} ${horaFin}`;


    /*
     * Como usamos:
     *
     * YYYY-MM-DD HH:MM:SS
     *
     * podemos comparar correctamente ambos
     * valores en este punto.
     */

    if (
        fin <= inicio
    ) {

        throw crearErrorDisponibilidad(
            "PERIODO_INVALIDO",
            "La fecha y hora de entrega deben ser posteriores a la recogida."
        );

    }


    return {

        fechaRecogida:
            fechaInicio,

        horaRecogida:
            horaInicio,

        fechaEntrega:
            fechaFin,

        horaEntrega:
            horaFin,

        inicio,

        fin

    };

}

/* =========================================================
   CALCULAR PICO DE VEHÍCULOS COMPROMETIDOS

   No sumamos simplemente todas las reservaciones que se
   cruzan con el período.

   Calculamos cuántos vehículos están ocupados de manera
   simultánea en el punto de mayor demanda.
========================================================= */

function calcularPicoComprometido({
    reservaciones,
    periodo
}) {

    const eventos = [];


    for (
        const reservacion
        of reservaciones
    ) {

        const cantidad =
            Number(
                reservacion.cantidad_vehiculos ||
                0
            );


        if (
            !Number.isInteger(cantidad) ||
            cantidad <= 0
        ) {
            continue;
        }


        /*
         * Limitamos cada reservación al período que
         * estamos consultando.
         */

        const inicioReserva =
            String(
                reservacion.inicio_reserva
            );


        const finReserva =
            String(
                reservacion.fin_reserva
            );


        const inicioEfectivo =
            inicioReserva < periodo.inicio
                ? periodo.inicio
                : inicioReserva;


        const finEfectivo =
            finReserva > periodo.fin
                ? periodo.fin
                : finReserva;


        if (
            inicioEfectivo >=
            finEfectivo
        ) {
            continue;
        }


        eventos.push({
            momento:
                inicioEfectivo,

            tipo:
                "inicio",

            cantidad
        });


        eventos.push({
            momento:
                finEfectivo,

            tipo:
                "fin",

            cantidad
        });

    }


    /*
     * Si una reserva termina exactamente cuando otra
     * comienza, procesamos primero la finalización.
     *
     * Ejemplo:
     *
     * A: 10 → 15
     * B: 15 → 20
     *
     * No existe solapamiento.
     */

    eventos.sort(
        (
            eventoA,
            eventoB
        ) => {

            const comparacionMomento =
                eventoA.momento.localeCompare(
                    eventoB.momento
                );


            if (
                comparacionMomento !==
                0
            ) {
                return comparacionMomento;
            }


            if (
                eventoA.tipo ===
                eventoB.tipo
            ) {
                return 0;
            }


            return eventoA.tipo === "fin"
                ? -1
                : 1;

        }
    );


    let cantidadActual =
        0;


    let cantidadMaxima =
        0;


    for (
        const evento
        of eventos
    ) {

        if (
            evento.tipo ===
            "fin"
        ) {

            cantidadActual =
                Math.max(
                    0,
                    cantidadActual -
                    evento.cantidad
                );

        } else {

            cantidadActual +=
                evento.cantidad;


            cantidadMaxima =
                Math.max(
                    cantidadMaxima,
                    cantidadActual
                );

        }

    }


    return cantidadMaxima;

}

/* =========================================================
   OBTENER DISPONIBILIDAD DE UN MODELO
========================================================= */

async function obtenerDisponibilidadModelo({

    agenciaId,

    modeloId,

    fechaRecogida,

    horaRecogida,

    fechaEntrega,

    horaEntrega,

    conexion = null,

    bloquearModelo = false

}) {

    const agenciaIdNormalizado =
        normalizarId(
            agenciaId,
            "agenciaId"
        );


    const modeloIdNormalizado =
        normalizarId(
            modeloId,
            "modeloId"
        );


    const periodo =
        normalizarPeriodo({

            fechaRecogida,

            horaRecogida,

            fechaEntrega,

            horaEntrega

        });


    /*
     * Cuando creemos una reservación real,
     * bloquearModelo se utilizará dentro
     * de una transacción.
     *
     * Así dos clientes no podrán reservar
     * simultáneamente la última disponibilidad
     * del mismo modelo.
     */

    if (
        bloquearModelo &&
        !conexion
    ) {

        throw crearErrorDisponibilidad(
            "CONEXION_REQUERIDA",
            "Para bloquear el modelo debe utilizarse una conexión transaccional existente.",
            500
        );

    }


    let db =
        conexion;


    let conexionPropia =
        false;


    try {

        if (!db) {

            db =
                await pool.getConnection();

            conexionPropia =
                true;

        }


        /* -------------------------------------------------
           VALIDAR MODELO Y AGENCIA
        ------------------------------------------------- */

        const sqlModelo =
            `
            SELECT

                id,

                agencia_id,

                nombre,

                marca,

                precio_diario,

                estado

            FROM modelos_vehiculos

            WHERE

                id = ?

                AND agencia_id = ?

            LIMIT 1

            ${
                bloquearModelo
                    ? "FOR UPDATE"
                    : ""
            }
            `;


        const modeloResultado =
            await db.query(
                sqlModelo,
                [
                    modeloIdNormalizado,
                    agenciaIdNormalizado
                ]
            );


        if (
            modeloResultado.length ===
            0
        ) {

            throw crearErrorDisponibilidad(
                "MODELO_NO_ENCONTRADO",
                "El modelo indicado no existe dentro de esta agencia.",
                404
            );

        }


        const modelo =
            modeloResultado[0];


        if (
            modelo.estado !==
            "activo"
        ) {

            throw crearErrorDisponibilidad(
                "MODELO_INACTIVO",
                "El modelo indicado no está disponible para reservaciones.",
                409
            );

        }


        /* -------------------------------------------------
           CAPACIDAD FÍSICA OPERATIVA

           Mantenimiento e inactivo no cuentan.

           Reservado y alquilado no se eliminan
           automáticamente de la capacidad futura porque
           las fechas de las reservaciones serán las que
           determinen el conflicto.
        ------------------------------------------------- */

        const unidadesResultado =
            await db.query(
                `
                SELECT

                    COUNT(*) AS total

                FROM vehiculos

                WHERE

                    agencia_id = ?

                    AND modelo_id = ?

                    AND estado NOT IN (
                        'mantenimiento',
                        'inactivo'
                    )
                `,
                [
                    agenciaIdNormalizado,
                    modeloIdNormalizado
                ]
            );


        const capacidadOperativa =
            Number(
                unidadesResultado[0]
                    ?.total ||
                0
            );


                /* -------------------------------------------------
           RESERVACIONES QUE BLOQUEAN EL PERÍODO

           Regla de solapamiento:

           inicioExistente < nuevoFin
           AND
           finExistente > nuevoInicio

           Después calculamos el pico de ocupación
           simultánea y no la suma simple de todas
           las reservaciones encontradas.
        ------------------------------------------------- */

        const reservacionesResultado =
            await db.query(
                `
                SELECT

                    id,

                    codigo,

                    cantidad_vehiculos,

                    estado,

                    CONCAT(
                        DATE_FORMAT(
                            fecha_recogida,
                            '%Y-%m-%d'
                        ),
                        ' ',
                        TIME_FORMAT(
                            hora_recogida,
                            '%H:%i:%s'
                        )
                    ) AS inicio_reserva,

                    CONCAT(
                        DATE_FORMAT(
                            fecha_entrega,
                            '%Y-%m-%d'
                        ),
                        ' ',
                        TIME_FORMAT(
                            hora_entrega,
                            '%H:%i:%s'
                        )
                    ) AS fin_reserva

                FROM reservaciones

                WHERE

                    agencia_id = ?

                    AND modelo_id = ?

                    AND estado IN (
                    
                    ?,
                    ?,
                    ?,
                    ?
                    
                )

                    AND (

                        fecha_recogida < ?

                        OR (

                            fecha_recogida = ?

                            AND hora_recogida < ?

                        )

                    )

                    AND (

                        fecha_entrega > ?

                        OR (

                            fecha_entrega = ?

                            AND hora_entrega > ?

                        )

                    )

                ORDER BY

                    fecha_recogida ASC,

                    hora_recogida ASC,

                    id ASC
                `,
                [

                    agenciaIdNormalizado,

                    modeloIdNormalizado,

                    ...ESTADOS_RESERVACION_BLOQUEANTES,

                    periodo.fechaEntrega,

                    periodo.fechaEntrega,

                    periodo.horaEntrega,

                    periodo.fechaRecogida,

                    periodo.fechaRecogida,

                    periodo.horaRecogida

                ]
            );


        /* -------------------------------------------------
           MÁXIMO COMPROMETIDO SIMULTÁNEAMENTE
        ------------------------------------------------- */

        const cantidadComprometida =
            calcularPicoComprometido({

                reservaciones:
                    reservacionesResultado,

                periodo

            });


        /* -------------------------------------------------
           DISPONIBILIDAD REAL
        ------------------------------------------------- */

        const cantidadDisponible =
            Math.max(
                0,
                capacidadOperativa -
                cantidadComprometida
            );


        return {

            agenciaId:
                agenciaIdNormalizado,


            modelo: {

                id:
                    Number(
                        modelo.id
                    ),

                nombre:
                    modelo.nombre,

                marca:
                    modelo.marca,

                precioDiario:
                    Number(
                        modelo.precio_diario ||
                        0
                    )

            },


            periodo,


            capacidadOperativa,


            cantidadComprometida,


            cantidadDisponible,


            disponible:
                cantidadDisponible > 0,


            reservasSolapadas:
                reservacionesResultado.length

        };


    } finally {

        if (
            conexionPropia &&
            db
        ) {

            db.release();

        }

    }

}


/* =========================================================
   VALIDAR UNA CANTIDAD SOLICITADA
========================================================= */

async function validarCantidadDisponible({

    cantidad,

    ...datosDisponibilidad

}) {

    const cantidadNormalizada =
        normalizarId(
            cantidad,
            "cantidad"
        );


    const disponibilidad =
        await obtenerDisponibilidadModelo(
            datosDisponibilidad
        );


    return {

        ...disponibilidad,


        cantidadSolicitada:
            cantidadNormalizada,


        suficiente:
            disponibilidad
                .cantidadDisponible >=
            cantidadNormalizada

    };

}


/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports = {

    ESTADOS_RESERVACION_BLOQUEANTES,

    obtenerDisponibilidadModelo,

    validarCantidadDisponible

};
