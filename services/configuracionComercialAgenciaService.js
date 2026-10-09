/* =========================================================
   AVYNEXO
   CONFIGURACIÓN COMERCIAL POR AGENCIA
========================================================= */

const {
    pool
} = require(
    "../config/database"
);


/* =========================================================
   VALIDAR AGENCIA
========================================================= */

function normalizarAgenciaId(
    valor
) {

    const agenciaId =
        Number(
            valor
        );


    if (
        !Number.isInteger(
            agenciaId
        ) ||
        agenciaId <= 0
    ) {

        throw new Error(
            "AGENCIA_ID_INVALIDO"
        );

    }


    return agenciaId;

}


/* =========================================================
   OBTENER ADICIONALES DE LA AGENCIA
========================================================= */

async function obtenerAdicionalesAgencia(
    agenciaId,
    {
        soloActivos = false
    } = {}
) {

    const idAgencia =
        normalizarAgenciaId(
            agenciaId
        );


    const conexion =
        await pool.getConnection();


    try {

        const condiciones = [

            "agencia_id = ?"

        ];


        const parametros = [

            idAgencia

        ];


        if (
            soloActivos
        ) {

            condiciones.push(
                "activo = 1"
            );

        }


        const filas =
            await conexion.query(
                `
                SELECT

                    id,
                    agencia_id,
                    codigo,
                    nombre,
                    descripcion,
                    precio_diario,
                    activo,
                    orden,
                    fecha_creacion,
                    fecha_actualizacion

                FROM adicionales_agencia

                WHERE
                    ${condiciones.join(
                        " AND "
                    )}

                ORDER BY
                    orden ASC,
                    id ASC
                `,
                parametros
            );


        return filas.map(
            (fila) => ({

                id:
                    Number(
                        fila.id
                    ),

                agenciaId:
                    Number(
                        fila.agencia_id
                    ),

                codigo:
                    fila.codigo,

                nombre:
                    fila.nombre,

                descripcion:
                    fila.descripcion ||
                    "",

                precioDiario:
                    Number(
                        fila.precio_diario ||
                        0
                    ),

                activo:
                    Number(
                        fila.activo
                    ) === 1,

                orden:
                    Number(
                        fila.orden ||
                        0
                    ),

                fechaCreacion:
                    fila.fecha_creacion,

                fechaActualizacion:
                    fila.fecha_actualizacion

            })
        );


    } finally {

        conexion.release();

    }

}


/* =========================================================
   OBTENER PROMOCIONES DE LA AGENCIA
========================================================= */

async function obtenerPromocionesAgencia(
    agenciaId,
    {
        soloActivas = false,
        soloPublicas = false
    } = {}
) {

    const idAgencia =
        normalizarAgenciaId(
            agenciaId
        );


    const conexion =
        await pool.getConnection();


    try {

        const condiciones = [

            "agencia_id = ?"

        ];


        const parametros = [

            idAgencia

        ];


        if (
            soloActivas
        ) {

            condiciones.push(
                "activo = 1"
            );

        }


        if (
            soloPublicas
        ) {

            condiciones.push(
                "publica = 1"
            );

        }


        const filas =
            await conexion.query(
                `
                SELECT

                    id,
                    agencia_id,
                    codigo,
                    nombre,
                    porcentaje_descuento,

                    DATE_FORMAT(
                        fecha_inicio,
                        '%Y-%m-%d'
                    ) AS fecha_inicio,

                    DATE_FORMAT(
                        fecha_fin,
                        '%Y-%m-%d'
                    ) AS fecha_fin,

                    publica,
                    activo,

                    fecha_creacion,
                    fecha_actualizacion

                FROM promociones_agencia

                WHERE
                    ${condiciones.join(
                        " AND "
                    )}

                ORDER BY
                    id ASC
                `,
                parametros
            );


        return filas.map(
            (fila) => ({

                id:
                    Number(
                        fila.id
                    ),

                agenciaId:
                    Number(
                        fila.agencia_id
                    ),

                codigo:
                    fila.codigo,

                nombre:
                    fila.nombre,

                porcentajeDescuento:
                    Number(
                        fila.porcentaje_descuento ||
                        0
                    ),

                fechaInicio:
                    fila.fecha_inicio ||
                    null,

                fechaFin:
                    fila.fecha_fin ||
                    null,

                publica:
                    Number(
                        fila.publica
                    ) === 1,

                activo:
                    Number(
                        fila.activo
                    ) === 1,

                fechaCreacion:
                    fila.fecha_creacion,

                fechaActualizacion:
                    fila.fecha_actualizacion

            })
        );


    } finally {

        conexion.release();

    }

}

/* =========================================================
   ACTUALIZAR ADICIONAL DE LA AGENCIA
========================================================= */

async function actualizarAdicionalAgencia({

    agenciaId,

    adicionalId,

    precioDiario,

    activo

}) {

    const idAgencia =
        normalizarAgenciaId(
            agenciaId
        );


    const idAdicional =
        Number(
            adicionalId
        );


    const precio =
        Number(
            precioDiario
        );


    if (
        !Number.isInteger(
            idAdicional
        ) ||
        idAdicional <= 0
    ) {

        throw new Error(
            "ADICIONAL_ID_INVALIDO"
        );

    }


    if (
        !Number.isFinite(
            precio
        ) ||
        precio < 0 ||
        precio > 9999999999.99
    ) {

        throw new Error(
            "PRECIO_ADICIONAL_INVALIDO"
        );

    }


    const estadoActivo =
        activo === true ||
        activo === 1 ||
        activo === "1" ||
        activo === "true" ||
        activo === "on";


    const conexion =
        await pool.getConnection();


    try {

        const resultado =
            await conexion.query(
                `
                UPDATE adicionales_agencia

                SET
                    precio_diario = ?,
                    activo = ?

                WHERE
                    id = ?
                    AND agencia_id = ?
                `,
                [
                    precio,
                    estadoActivo
                        ? 1
                        : 0,
                    idAdicional,
                    idAgencia
                ]
            );


        if (
            Number(
                resultado.affectedRows ||
                0
            ) === 0
        ) {

            /*
             * También puede ocurrir que los datos enviados
             * sean exactamente iguales a los actuales.
             *
             * Comprobamos que el registro realmente
             * pertenezca a esta agencia antes de decidir
             * que no existe.
             */

            const filas =
                await conexion.query(
                    `
                    SELECT
                        id
                    FROM adicionales_agencia
                    WHERE
                        id = ?
                        AND agencia_id = ?
                    LIMIT 1
                    `,
                    [
                        idAdicional,
                        idAgencia
                    ]
                );


            if (
                filas.length === 0
            ) {

                throw new Error(
                    "ADICIONAL_NO_ENCONTRADO"
                );

            }

        }


        return {

            actualizado:
                true,

            adicionalId:
                idAdicional,

            agenciaId:
                idAgencia,

            precioDiario:
                precio,

            activo:
                estadoActivo

        };


    } finally {

        conexion.release();

    }

}

/* =========================================================
   ACTUALIZAR PROMOCIÓN DE LA AGENCIA
========================================================= */

async function actualizarPromocionAgencia({

    agenciaId,

    promocionId,

    codigo,

    porcentajeDescuento,

    fechaInicio,

    fechaFin,

    publica,

    activo

}) {

    const idAgencia =
        normalizarAgenciaId(
            agenciaId
        );


    const idPromocion =
        Number(
            promocionId
        );

    const codigoNormalizado =
    String(
        codigo ||
        ""
    )
        .trim()
        .toUpperCase();


if (
    !codigoNormalizado ||
    codigoNormalizado.length > 80 ||
    !/^[A-Z0-9_-]+$/.test(
        codigoNormalizado
    )
) {

    throw new Error(
        "CODIGO_PROMOCION_INVALIDO"
    );

}

    const porcentaje =
        Number(
            porcentajeDescuento
        );


    if (
        !Number.isInteger(
            idPromocion
        ) ||
        idPromocion <= 0
    ) {

        throw new Error(
            "PROMOCION_ID_INVALIDO"
        );

    }


    if (
        !Number.isFinite(
            porcentaje
        ) ||
        porcentaje <= 0 ||
        porcentaje > 100
    ) {

        throw new Error(
            "PORCENTAJE_PROMOCION_INVALIDO"
        );

    }


    const fechaInicioNormalizada =
        String(
            fechaInicio ||
            ""
        ).trim() ||
        null;


    const fechaFinNormalizada =
        String(
            fechaFin ||
            ""
        ).trim() ||
        null;


    const patronFecha =
        /^\d{4}-\d{2}-\d{2}$/;


    if (
        fechaInicioNormalizada &&
        !patronFecha.test(
            fechaInicioNormalizada
        )
    ) {

        throw new Error(
            "FECHA_PROMOCION_INVALIDA"
        );

    }


    if (
        fechaFinNormalizada &&
        !patronFecha.test(
            fechaFinNormalizada
        )
    ) {

        throw new Error(
            "FECHA_PROMOCION_INVALIDA"
        );

    }


    const esPublica =
        publica === true ||
        publica === 1 ||
        publica === "1" ||
        publica === "true" ||
        publica === "on";


    const estaActiva =
        activo === true ||
        activo === 1 ||
        activo === "1" ||
        activo === "true" ||
        activo === "on";


    const conexion =
        await pool.getConnection();

    const promocionesMismoCodigo =
    await conexion.query(
        `
        SELECT
            id
        FROM promociones_agencia
        WHERE
            agencia_id = ?
            AND codigo = ?
            AND id <> ?
        LIMIT 1
        `,
        [
            idAgencia,
            codigoNormalizado,
            idPromocion
        ]
    );


if (
    promocionesMismoCodigo.length >
    0
) {

    throw new Error(
        "CODIGO_PROMOCION_DUPLICADO"
    );

}   

    try {

        /*
         * Validamos las fechas utilizando MariaDB
         * para evitar depender del reloj de JavaScript.
         */

        if (
            fechaInicioNormalizada &&
            fechaFinNormalizada
        ) {

            const validacionFechas =
                await conexion.query(
                    `
                    SELECT
                        CASE
                            WHEN DATE(?) <= DATE(?)
                                THEN 1
                            ELSE 0
                        END AS fechas_validas
                    `,
                    [
                        fechaInicioNormalizada,
                        fechaFinNormalizada
                    ]
                );


            if (
                Number(
                    validacionFechas[0]
                        ?.fechas_validas
                ) !== 1
            ) {

                throw new Error(
                    "PERIODO_PROMOCION_INVALIDO"
                );

            }

        }


        const resultado =
            await conexion.query(
                `
                UPDATE promociones_agencia

SET
    codigo = ?,
    porcentaje_descuento = ?,
    fecha_inicio = ?,
    fecha_fin = ?,
    publica = ?,
    activo = ?

WHERE
    id = ?
    AND agencia_id = ?
                `,
                [
    codigoNormalizado,
    porcentaje,
    fechaInicioNormalizada,
    fechaFinNormalizada,
    esPublica
        ? 1
        : 0,
    estaActiva
        ? 1
        : 0,
    idPromocion,
    idAgencia
]
            );


        if (
            Number(
                resultado.affectedRows ||
                0
            ) === 0
        ) {

            const filas =
                await conexion.query(
                    `
                    SELECT
                        id
                    FROM promociones_agencia
                    WHERE
                        id = ?
                        AND agencia_id = ?
                    LIMIT 1
                    `,
                    [
                        idPromocion,
                        idAgencia
                    ]
                );


            if (
                filas.length === 0
            ) {

                throw new Error(
                    "PROMOCION_NO_ENCONTRADA"
                );

            }

        }


        return {

            actualizado:
                true,

            promocionId:
    idPromocion,

agenciaId:
    idAgencia,

codigo:
    codigoNormalizado,

porcentajeDescuento:
    porcentaje,

            fechaInicio:
                fechaInicioNormalizada,

            fechaFin:
                fechaFinNormalizada,

            publica:
                esPublica,

            activo:
                estaActiva

        };


    } finally {

        conexion.release();

    }

}

/* =========================================================
   OBTENER CONFIGURACIÓN COMERCIAL COMPLETA
========================================================= */

async function obtenerConfiguracionComercialAgencia(
    agenciaId
) {

    const idAgencia =
        normalizarAgenciaId(
            agenciaId
        );


    const [
        adicionales,
        promociones
    ] =
        await Promise.all([

            obtenerAdicionalesAgencia(
                idAgencia
            ),

            obtenerPromocionesAgencia(
                idAgencia
            )

        ]);


    return {

        agenciaId:
            idAgencia,

        adicionales,

        promociones

    };

}

/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports = {

    obtenerAdicionalesAgencia,

    obtenerPromocionesAgencia,

    actualizarAdicionalAgencia,

    actualizarPromocionAgencia,

    obtenerConfiguracionComercialAgencia

};