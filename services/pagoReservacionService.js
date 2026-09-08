/* =========================================================
   AUTORENTCAR
   SERVICIO DE PAGOS DE RESERVACIÓN
========================================================= */

const {
    pool
} = require(
    "../config/database"
);


/* =========================================================
   ERROR CONTROLADO
========================================================= */

function crearErrorPago(
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
   VALIDAR ID
========================================================= */

function validarId(
    valor,
    nombre
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

        throw crearErrorPago(
            "ID_INVALIDO",
            `${nombre} no es válido.`
        );

    }


    return numero;

}


/* =========================================================
   NORMALIZAR TEXTO
========================================================= */

function normalizarTexto(
    valor
) {

    return String(
        valor ?? ""
    )
        .trim();

}


/* =========================================================
   REDONDEAR MONEDA
========================================================= */

function redondearMoneda(
    valor
) {

    return Math.round(
        (
            Number(
                valor
            ) +
            Number.EPSILON
        ) *
        100
    ) / 100;

}


/* =========================================================
   REGISTRAR PAGO PENDIENTE DE VALIDACIÓN
========================================================= */

async function registrarPagoPendienteValidacion(
    agenciaId,
    reservacionId,
    metodoPagoId,
    datos = {}
) {

    const agenciaIdSeguro =
        validarId(
            agenciaId,
            "La agencia"
        );


    const reservacionIdSeguro =
        validarId(
            reservacionId,
            "La reservación"
        );


    const metodoPagoIdSeguro =
        validarId(
            metodoPagoId,
            "El método de pago"
        );


    const monto =
        redondearMoneda(
            datos.monto
        );


    if (
        !Number.isFinite(
            monto
        ) ||
        monto <= 0
    ) {

        throw crearErrorPago(
            "MONTO_INVALIDO",
            "El monto del pago no es válido."
        );

    }


    const referencia =
        normalizarTexto(
            datos.referencia
        ) || null;


    const fechaPago =
        normalizarTexto(
            datos.fechaPago
        ) || null;


    const comprobanteRuta =
        normalizarTexto(
            datos.comprobanteRuta
        ) || null;


    const comprobanteNombreOriginal =
        normalizarTexto(
            datos.comprobanteNombreOriginal
        ) || null;


    const comprobanteMime =
        normalizarTexto(
            datos.comprobanteMime
        ) || null;


    const comprobanteTamano =
    datos.comprobanteTamano === undefined ||
    datos.comprobanteTamano === null
        ? null
        : Number(
            datos.comprobanteTamano
        );


const comprobanteHashSha256 =
    normalizarTexto(
        datos.comprobanteHashSha256
    )
        .toLowerCase() ||
    null;


if (
    comprobanteTamano !== null &&
    (
        !Number.isInteger(
            comprobanteTamano
        ) ||
        comprobanteTamano < 0
    )
) {

    throw crearErrorPago(
        "COMPROBANTE_INVALIDO",
        "El tamaño del comprobante no es válido."
    );

}


if (
    comprobanteHashSha256 &&
    !/^[a-f0-9]{64}$/.test(
        comprobanteHashSha256
    )
) {

    throw crearErrorPago(
        "COMPROBANTE_HASH_INVALIDO",
        "La huella de integridad del comprobante no es válida."
    );

}


if (
    comprobanteRuta &&
    !comprobanteHashSha256
) {

    throw crearErrorPago(
        "COMPROBANTE_HASH_REQUERIDO",
        "No fue posible verificar la integridad del comprobante."
    );

}


if (
    !comprobanteRuta &&
    comprobanteHashSha256
) {

    throw crearErrorPago(
        "COMPROBANTE_INVALIDO",
        "La huella del comprobante no corresponde a un archivo almacenado."
    );

}


    let conexion;


    try {

        conexion =
            await pool.getConnection();


        await conexion.beginTransaction();


        /* -------------------------------------------------
           RESERVACIÓN

           Debe pertenecer a la misma agencia y estar
           pendiente de pago.
        ------------------------------------------------- */

        const reservaciones =
    await conexion.query(
        `
        SELECT

            id,
            agencia_id,
            codigo,
            estado,
            total,
            monto_anticipo_requerido,
            fecha_limite_pago,

            CASE
                WHEN
                    fecha_limite_pago IS NOT NULL
                    AND fecha_limite_pago > NOW()
                THEN 1
                ELSE 0
            END AS plazo_vigente

        FROM reservaciones

        WHERE
            id = ?
            AND agencia_id = ?

        LIMIT 1

        FOR UPDATE
        `,
        [
            reservacionIdSeguro,
            agenciaIdSeguro
        ]
    );


        if (
            !reservaciones.length
        ) {

            throw crearErrorPago(
                "RESERVACION_NO_ENCONTRADA",
                "La reservación no existe o no pertenece a esta agencia.",
                404
            );

        }


        const reservacion =
            reservaciones[0];


        if (
            reservacion.estado !==
            "pendiente_pago"
        ) {

            throw crearErrorPago(
                "RESERVACION_NO_PENDIENTE_PAGO",
                "La reservación no se encuentra pendiente de pago.",
                409
            );

        }

 /* -------------------------------------------------
   PLAZO DE PAGO

   MariaDB determina si el plazo continúa vigente,
   evitando diferencias de zona horaria entre
   Node.js y la base de datos.
------------------------------------------------- */

if (
    Number(
        reservacion.plazo_vigente
    ) !== 1
) {

    throw crearErrorPago(
        "PLAZO_PAGO_VENCIDO",
        "El plazo para realizar el pago de esta reservación ha vencido.",
        409
    );

}


        /* -------------------------------------------------
           MÉTODO DE PAGO

           También debe pertenecer a la misma agencia.
        ------------------------------------------------- */

        const metodos =
            await conexion.query(
                `
                SELECT

                    id,
                    agencia_id,
                    codigo,
                    nombre,
                    tipo,
                    moneda,
                    requiere_comprobante,
                    activo

                FROM metodos_pago_agencia

                WHERE
                    id = ?
                    AND agencia_id = ?

                LIMIT 1
                `,
                [
                    metodoPagoIdSeguro,
                    agenciaIdSeguro
                ]
            );


        if (
            !metodos.length
        ) {

            throw crearErrorPago(
                "METODO_NO_ENCONTRADO",
                "El método de pago no existe o no pertenece a esta agencia.",
                404
            );

        }


        const metodo =
            metodos[0];


        if (
            Number(
                metodo.activo
            ) !== 1
        ) {

            throw crearErrorPago(
                "METODO_INACTIVO",
                "El método de pago seleccionado no está disponible.",
                409
            );

        }


        /* -------------------------------------------------
           COMPROBANTE

           Si el método lo requiere, el servicio exige que
           ya exista información del archivo procesado por
           el servidor.

           Nunca confiamos solamente en el nombre enviado
           por el navegador.
        ------------------------------------------------- */

        if (
    Number(
        metodo.requiere_comprobante
    ) === 1
) {

    if (
        !comprobanteRuta ||
        !comprobanteMime ||
        !Number.isInteger(
            comprobanteTamano
        ) ||
        comprobanteTamano <= 0 ||
        !comprobanteHashSha256
    ) {

        throw crearErrorPago(
            "COMPROBANTE_REQUERIDO",
            "Este método de pago requiere un comprobante válido."
        );

    }

}


        /* -------------------------------------------------
           NO PERMITIR QUE LOS PAGOS CONFIRMADOS SUPEREN
           EL TOTAL DE LA RESERVACIÓN.

           Los pagos pendientes todavía no se consideran
           dinero confirmado.
        ------------------------------------------------- */

        const totales =
            await conexion.query(
                `
                SELECT

                    COALESCE(
                        SUM(
                            CASE
                                WHEN estado = 'confirmado'
                                    THEN monto
                                ELSE 0
                            END
                        ),
                        0
                    ) AS total_confirmado

                FROM pagos_reservacion

                WHERE
                    reservacion_id = ?
                    AND agencia_id = ?
                `,
                [
                    reservacionIdSeguro,
                    agenciaIdSeguro
                ]
            );


        const totalConfirmado =
            redondearMoneda(
                totales[0]
                    ?.total_confirmado ||
                0
            );


        const totalReservacion =
            redondearMoneda(
                reservacion.total
            );


        const saldoPendiente =
            redondearMoneda(
                Math.max(
                    0,
                    totalReservacion -
                    totalConfirmado
                )
            );


        if (
            monto >
            saldoPendiente
        ) {

            throw crearErrorPago(
                "MONTO_SUPERA_SALDO",
                "El monto indicado supera el saldo pendiente de la reservación."
            );

        }


        /* -------------------------------------------------
           INSERTAR PAGO

           El estado y el origen se fijan en el servidor.
        ------------------------------------------------- */

        const resultado =
            await conexion.query(
                `
                INSERT INTO pagos_reservacion (

                    agencia_id,
                    reservacion_id,
                    metodo_pago_id,

                    metodo_codigo,
                    metodo_nombre,
                    metodo_tipo,

                    monto,
                    moneda,

                    referencia,
                    fecha_pago,

                    comprobante_ruta,
comprobante_nombre_original,
comprobante_mime,
comprobante_tamano,
comprobante_hash_sha256,

origen,
estado

                )
                VALUES (
                    ?,
                    ?,
                    ?,

                    ?,
                    ?,
                    ?,

                    ?,
                    ?,

                    ?,
                    ?,

                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    
                    'cliente',
                    'pendiente_validacion'
                )
                `,
                [

                    agenciaIdSeguro,
                    reservacionIdSeguro,
                    metodoPagoIdSeguro,

                    metodo.codigo,
                    metodo.nombre,
                    metodo.tipo,

                    monto,
                    metodo.moneda,

                    referencia,
                    fechaPago,

                    comprobanteRuta,
                    comprobanteNombreOriginal,
                    comprobanteMime,
                    comprobanteTamano,
                    comprobanteHashSha256

                ]
            );


        const pagos =
            await conexion.query(
                `
                SELECT

                    id,
                    agencia_id,
                    reservacion_id,

                    metodo_pago_id,
                    metodo_codigo,
                    metodo_nombre,
                    metodo_tipo,

                    monto,
                    moneda,

                    referencia,
                    fecha_pago,

                    comprobante_ruta,
                    comprobante_nombre_original,
                    comprobante_mime,
                    comprobante_tamano,
                    comprobante_hash_sha256,
                    
                    origen,
                    estado,

                    fecha_creacion

                FROM pagos_reservacion

                WHERE
                    id = ?
                    AND agencia_id = ?
                    AND reservacion_id = ?

                LIMIT 1
                `,
                [
                    Number(
                        resultado.insertId
                    ),
                    agenciaIdSeguro,
                    reservacionIdSeguro
                ]
            );


        await conexion.commit();


        return pagos[0];

    } catch (error) {

        if (
            conexion
        ) {

            try {

                await conexion.rollback();

            } catch (
                errorRollback
            ) {

                console.error(
                    "Error al revertir pago:",
                    errorRollback
                );

            }

        }


        throw error;

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

    registrarPagoPendienteValidacion

};