const crypto =
    require(
        "crypto"
    );


const {
    pool
} = require(
    "../config/database"
);


/* =========================================================
   ERRORES CONTROLADOS
========================================================= */

function crearErrorTokenPago(
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

    const id =
        Number(
            valor
        );


    if (
        !Number.isInteger(
            id
        ) ||
        id <= 0
    ) {

        throw crearErrorTokenPago(
            "ID_INVALIDO",
            `${nombre} no es válido.`,
            400
        );

    }


    return id;

}


/* =========================================================
   CREAR TOKEN ALEATORIO
========================================================= */

function crearTokenSeguro() {

    return crypto
        .randomBytes(
            32
        )
        .toString(
            "hex"
        );

}


/* =========================================================
   CREAR HASH SHA-256
========================================================= */

function crearHashToken(
    token
) {

    return crypto
        .createHash(
            "sha256"
        )
        .update(
            token
        )
        .digest(
            "hex"
        );

}


/* =========================================================
   GENERAR TOKEN DE PAGO
========================================================= */

async function generarTokenPagoReservacion(
    agenciaIdEntrada,
    reservacionIdEntrada
) {

    const agenciaId =
        validarId(
            agenciaIdEntrada,
            "La agencia"
        );


    const reservacionId =
        validarId(
            reservacionIdEntrada,
            "La reservación"
        );


    let conexion;


    try {

        conexion =
            await pool.getConnection();


        await conexion.beginTransaction();


        /* -------------------------------------------------
           BLOQUEAR Y VALIDAR RESERVACIÓN

           La fecha se compara directamente en MariaDB
           para evitar problemas de zona horaria.
        ------------------------------------------------- */

        const reservaciones =
            await conexion.query(
                `
                SELECT

                    id,
                    agencia_id,
                    codigo,
                    estado,

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
                    reservacionId,
                    agenciaId
                ]
            );


        if (
            !reservaciones.length
        ) {

            throw crearErrorTokenPago(
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

            throw crearErrorTokenPago(
                "RESERVACION_NO_PENDIENTE_PAGO",
                "La reservación no se encuentra pendiente de pago.",
                409
            );

        }


        if (
            Number(
                reservacion
                    .plazo_vigente
            ) !== 1
        ) {

            throw crearErrorTokenPago(
                "PLAZO_PAGO_VENCIDO",
                "El plazo de pago de esta reservación ha vencido.",
                409
            );

        }


        /* -------------------------------------------------
           REVOCAR TOKENS ANTERIORES

           Una reservación tendrá como máximo un enlace
           de pago vigente generado por este proceso.
        ------------------------------------------------- */

        await conexion.query(
            `
            UPDATE tokens_pago_reservacion

            SET
                fecha_revocacion =
                    NOW()

            WHERE
                agencia_id = ?
                AND reservacion_id = ?
                AND fecha_revocacion IS NULL
            `,
            [
                agenciaId,
                reservacionId
            ]
        );


        /* -------------------------------------------------
           GENERAR TOKEN

           El token original se devuelve una sola vez.
           En MariaDB solo almacenamos su SHA-256.
        ------------------------------------------------- */

        const token =
            crearTokenSeguro();


        const tokenHash =
            crearHashToken(
                token
            );


        /* -------------------------------------------------
           INSERTAR TOKEN

           La expiración se copia directamente desde
           fecha_limite_pago dentro de MariaDB.
        ------------------------------------------------- */

        const resultado =
            await conexion.query(
                `
                INSERT INTO tokens_pago_reservacion
                (
                    agencia_id,
                    reservacion_id,

                    token_hash,

                    fecha_expiracion
                )

                SELECT

                    agencia_id,
                    id,

                    ?,

                    fecha_limite_pago

                FROM reservaciones

                WHERE
                    id = ?
                    AND agencia_id = ?
                `,
                [
                    tokenHash,
                    reservacionId,
                    agenciaId
                ]
            );


        const tokenId =
            Number(
                resultado.insertId
            );


        const registros =
            await conexion.query(
                `
                SELECT

                    id,
                    agencia_id,
                    reservacion_id,

                    fecha_expiracion,
                    fecha_revocacion,
                    fecha_creacion

                FROM tokens_pago_reservacion

                WHERE
                    id = ?
                    AND agencia_id = ?

                LIMIT 1
                `,
                [
                    tokenId,
                    agenciaId
                ]
            );


        await conexion.commit();


        return {

            ok:
                true,

            token,

            registro:
            {

                id:
                    tokenId,

                agenciaId,

                reservacionId,

                codigoReservacion:
                    reservacion.codigo,

                montoAnticipoRequerido:
                    Number(
                        reservacion
                            .monto_anticipo_requerido ||
                        0
                    ),

                fechaExpiracion:
                    registros[0]
                        ?.fecha_expiracion ||
                    reservacion
                        .fecha_limite_pago

            }

        };

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
                    "Error haciendo rollback al generar token de pago:",
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
   VALIDAR TOKEN PÚBLICO
========================================================= */

async function validarTokenPagoReservacion(
    tokenEntrada
) {

    const token =
        String(
            tokenEntrada ||
            ""
        ).trim();


    /*
     * Nuestros tokens contienen exactamente
     * 64 caracteres hexadecimales.
     */

    if (
        !/^[a-f0-9]{64}$/i.test(
            token
        )
    ) {

        throw crearErrorTokenPago(
            "ENLACE_PAGO_INVALIDO",
            "El enlace de pago no es válido o ya no se encuentra disponible.",
            404
        );

    }


    const tokenHash =
        crearHashToken(
            token
        );


    let conexion;


    try {

        conexion =
            await pool.getConnection();


        /*
         * Se usa una respuesta genérica para:
         *
         * - token inexistente;
         * - token revocado;
         * - token vencido;
         * - reservación fuera de estado;
         * - plazo de reservación vencido.
         *
         * De esa forma no revelamos información
         * innecesaria a quien pruebe tokens inválidos.
         */

        const registros =
            await conexion.query(
                `
                SELECT

                    t.id AS token_id,

                    t.agencia_id,
                    t.reservacion_id,
                    t.fecha_expiracion,

                    r.codigo,
                    r.estado,
                    r.total,

                    r.monto_anticipo_requerido,
                    r.fecha_limite_pago,

                    r.cliente_nombre,

                    a.nombre AS agencia_nombre,
                    a.slug AS agencia_slug,
                    a.logo AS agencia_logo,
                    
                    a.color_primario AS agencia_color_primario,
                    a.color_secundario AS agencia_color_secundario

                FROM tokens_pago_reservacion t

                INNER JOIN reservaciones r
                    ON r.id =
                        t.reservacion_id
                    AND r.agencia_id =
                        t.agencia_id

                INNER JOIN agencias a
                    ON a.id =
                        t.agencia_id

                WHERE
                    t.token_hash = ?

                    AND t.fecha_revocacion IS NULL

                    AND t.fecha_expiracion > NOW()

                    AND r.estado =
                        'pendiente_pago'

                    AND r.fecha_limite_pago IS NOT NULL

                    AND r.fecha_limite_pago > NOW()

                LIMIT 1
                `,
                [
                    tokenHash
                ]
            );


        if (
            !registros.length
        ) {

            throw crearErrorTokenPago(
                "ENLACE_PAGO_INVALIDO",
                "El enlace de pago no es válido o ya no se encuentra disponible.",
                404
            );

        }


        const registro =
            registros[0];


        return {

            ok:
                true,

            tokenId:
                Number(
                    registro.token_id
                ),

            agencia:
{

    id:
        Number(
            registro.agencia_id
        ),

    nombre:
        registro.agencia_nombre,

    slug:
        registro.agencia_slug,

    logo:
        registro.agencia_logo ||
        "",

    colorPrimario:
        registro.agencia_color_primario ||
        "#0b1f3a",

    colorSecundario:
        registro.agencia_color_secundario ||
        "#ff8a00"

},

            reservacion:
            {

                id:
                    Number(
                        registro.reservacion_id
                    ),

                codigo:
                    registro.codigo,

                estado:
                    registro.estado,

                clienteNombre:
                    registro.cliente_nombre,

                total:
                    Number(
                        registro.total ||
                        0
                    ),

                montoAnticipoRequerido:
                    Number(
                        registro
                            .monto_anticipo_requerido ||
                        0
                    ),

                fechaLimitePago:
                    registro
                        .fecha_limite_pago

            },

            fechaExpiracion:
                registro
                    .fecha_expiracion

        };

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

module.exports =
{

    generarTokenPagoReservacion,
    validarTokenPagoReservacion

};