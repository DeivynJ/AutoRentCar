/* =========================================================
   AUTORENTCAR
   SERVICIO DE MÉTODOS DE PAGO DE AGENCIA
========================================================= */

const {
    pool
} = require(
    "../config/database"
);

const crypto =
    require(
        "crypto"
    );


/* =========================================================
   ERROR CONTROLADO
========================================================= */

function crearErrorMetodoPago(
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

        throw crearErrorMetodoPago(
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
   CREAR CÓDIGO INTERNO
========================================================= */

function crearCodigoMetodoPago(
    tipo
) {

    const tipoSeguro =
        normalizarTexto(
            tipo
        )
            .toLowerCase()
            .replace(
                /[^a-z0-9]+/g,
                "-"
            )
            .replace(
                /^-+|-+$/g,
                ""
            );


    const sufijo =
        crypto
            .randomBytes(
                4
            )
            .toString(
                "hex"
            );


    return `${tipoSeguro}-${sufijo}`;

}


/* =========================================================
   VALIDAR TIPO
========================================================= */

function validarTipoMetodoPago(
    tipo
) {

    const tipoSeguro =
        normalizarTexto(
            tipo
        )
            .toLowerCase();


    const tiposPermitidos = [

        "transferencia",
        "deposito",
        "efectivo",
        "otro"

    ];


    if (
        !tiposPermitidos.includes(
            tipoSeguro
        )
    ) {

        throw crearErrorMetodoPago(
            "TIPO_INVALIDO",
            "El tipo de método de pago no es válido."
        );

    }


    return tipoSeguro;

}

/* =========================================================
   VALIDAR BOOLEANO
========================================================= */

function normalizarBooleano(
    valor,
    valorPredeterminado = false
) {

    if (
        valor === undefined ||
        valor === null ||
        valor === ""
    ) {

        return valorPredeterminado
            ? 1
            : 0;

    }


    if (
        valor === true ||
        valor === 1 ||
        valor === "1" ||
        valor === "true" ||
        valor === "on"
    ) {

        return 1;

    }


    return 0;

}

/* =========================================================
   LISTAR MÉTODOS DE PAGO DE UNA AGENCIA
========================================================= */

async function listarMetodosPagoAgencia(
    agenciaId
) {

    const agenciaIdSeguro =
        validarId(
            agenciaId,
            "La agencia"
        );


    let conexion;


    try {

        conexion =
            await pool.getConnection();


        const metodos =
            await conexion.query(
                `
                SELECT

                    id,
                    agencia_id,

                    codigo,
                    nombre,
                    tipo,

                    banco,
                    titular,
                    tipo_cuenta,
                    numero_cuenta,

                    moneda,
                    instrucciones,

                    requiere_comprobante,
                    activo,
                    orden,

                    fecha_creacion,
                    fecha_actualizacion

                FROM metodos_pago_agencia

                WHERE
                    agencia_id = ?

                ORDER BY

                    activo DESC,

                    orden ASC,

                    id ASC
                `,
                [
                    agenciaIdSeguro
                ]
            );


        return metodos;

    } finally {

        if (
            conexion
        ) {

            conexion.release();

        }

    }

}

/* =========================================================
   OBTENER MÉTODO DE PAGO DE UNA AGENCIA
========================================================= */

async function obtenerMetodoPagoAgenciaPorId(
    agenciaId,
    metodoId
) {

    const agenciaIdSeguro =
        validarId(
            agenciaId,
            "La agencia"
        );


    const metodoIdSeguro =
        validarId(
            metodoId,
            "El método de pago"
        );


    let conexion;


    try {

        conexion =
            await pool.getConnection();


        const metodos =
            await conexion.query(
                `
                SELECT

                    id,
                    agencia_id,

                    codigo,
                    nombre,
                    tipo,

                    banco,
                    titular,
                    tipo_cuenta,
                    numero_cuenta,

                    moneda,
                    instrucciones,

                    requiere_comprobante,
                    activo,
                    orden,

                    fecha_creacion,
                    fecha_actualizacion

                FROM metodos_pago_agencia

                WHERE
                    id = ?
                    AND agencia_id = ?

                LIMIT 1
                `,
                [
                    metodoIdSeguro,
                    agenciaIdSeguro
                ]
            );


        if (
            !metodos.length
        ) {

            throw crearErrorMetodoPago(
                "METODO_NO_ENCONTRADO",
                "El método de pago no existe o no pertenece a esta agencia.",
                404
            );

        }


        return metodos[0];

    } finally {

        if (
            conexion
        ) {

            conexion.release();

        }

    }

}

/* =========================================================
   CREAR MÉTODO DE PAGO
========================================================= */

async function crearMetodoPagoAgencia(
    agenciaId,
    datos = {}
) {

    const agenciaIdSeguro =
        validarId(
            agenciaId,
            "La agencia"
        );


    const nombre =
        normalizarTexto(
            datos.nombre
        );


    const tipo =
        validarTipoMetodoPago(
            datos.tipo
        );


    const banco =
        normalizarTexto(
            datos.banco
        ) || null;


    const titular =
        normalizarTexto(
            datos.titular
        ) || null;


    const tipoCuenta =
        normalizarTexto(
            datos.tipoCuenta
        ) || null;


    const numeroCuenta =
        normalizarTexto(
            datos.numeroCuenta
        ) || null;


    const instrucciones =
        normalizarTexto(
            datos.instrucciones
        ) || null;


    if (
        nombre.length < 3 ||
        nombre.length > 150
    ) {

        throw crearErrorMetodoPago(
            "NOMBRE_INVALIDO",
            "El nombre del método de pago debe tener entre 3 y 150 caracteres."
        );

    }


    /*
     * En esta primera versión todo el sistema
     * trabaja económicamente en USD.
     *
     * No aceptamos que el navegador decida
     * otra moneda.
     */

    const moneda =
        "USD";


    /*
     * Transferencias y depósitos necesitan
     * información bancaria suficiente.
     */

    if (
        [
            "transferencia",
            "deposito"
        ].includes(
            tipo
        )
    ) {

        if (
            !banco ||
            !titular ||
            !numeroCuenta
        ) {

            throw crearErrorMetodoPago(
                "DATOS_BANCARIOS_INCOMPLETOS",
                "Debes indicar banco, titular y número de cuenta."
            );

        }

    }


    let requiereComprobante =
        normalizarBooleano(
            datos.requiereComprobante,
            true
        );


    /*
     * Para transferencia y depósito el
     * comprobante será obligatorio.
     */

    if (
        tipo === "transferencia" ||
        tipo === "deposito"
    ) {

        requiereComprobante =
            1;

    }


    const activo =
        normalizarBooleano(
            datos.activo,
            true
        );


    let orden =
        Number(
            datos.orden
        );


    if (
        !Number.isInteger(
            orden
        ) ||
        orden < 0 ||
        orden > 999
    ) {

        orden =
            0;

    }


    const codigo =
        crearCodigoMetodoPago(
            tipo
        );


    let conexion;


    try {

        conexion =
            await pool.getConnection();


        /*
         * Confirmamos que la agencia existe.
         */

        const agencias =
            await conexion.query(
                `
                SELECT
                    id
                FROM agencias
                WHERE
                    id = ?
                LIMIT 1
                `,
                [
                    agenciaIdSeguro
                ]
            );


        if (
            !agencias.length
        ) {

            throw crearErrorMetodoPago(
                "AGENCIA_NO_ENCONTRADA",
                "La agencia no existe.",
                404
            );

        }


        const resultado =
            await conexion.query(
                `
                INSERT INTO metodos_pago_agencia (

                    agencia_id,
                    codigo,
                    nombre,
                    tipo,

                    banco,
                    titular,
                    tipo_cuenta,
                    numero_cuenta,

                    moneda,
                    instrucciones,

                    requiere_comprobante,
                    activo,
                    orden

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
                    ?
                )
                `,
                [

                    agenciaIdSeguro,
                    codigo,
                    nombre,
                    tipo,

                    banco,
                    titular,
                    tipoCuenta,
                    numeroCuenta,

                    moneda,
                    instrucciones,

                    requiereComprobante,
                    activo,
                    orden

                ]
            );


        const metodos =
            await conexion.query(
                `
                SELECT

                    id,
                    agencia_id,

                    codigo,
                    nombre,
                    tipo,

                    banco,
                    titular,
                    tipo_cuenta,
                    numero_cuenta,

                    moneda,
                    instrucciones,

                    requiere_comprobante,
                    activo,
                    orden,

                    fecha_creacion,
                    fecha_actualizacion

                FROM metodos_pago_agencia

                WHERE
                    id = ?
                    AND agencia_id = ?

                LIMIT 1
                `,
                [
                    Number(
                        resultado.insertId
                    ),
                    agenciaIdSeguro
                ]
            );


        return metodos[0];

    } finally {

        if (
            conexion
        ) {

            conexion.release();

        }

    }

}

/* =========================================================
   ACTUALIZAR MÉTODO DE PAGO
========================================================= */

async function actualizarMetodoPagoAgencia(
    agenciaId,
    metodoId,
    datos = {}
) {

    const agenciaIdSeguro =
        validarId(
            agenciaId,
            "La agencia"
        );


    const metodoIdSeguro =
        validarId(
            metodoId,
            "El método de pago"
        );


    const nombre =
        normalizarTexto(
            datos.nombre
        );


    const tipo =
        validarTipoMetodoPago(
            datos.tipo
        );


    const banco =
        normalizarTexto(
            datos.banco
        ) || null;


    const titular =
        normalizarTexto(
            datos.titular
        ) || null;


    const tipoCuenta =
        normalizarTexto(
            datos.tipoCuenta
        ) || null;


    const numeroCuenta =
        normalizarTexto(
            datos.numeroCuenta
        ) || null;


    const instrucciones =
        normalizarTexto(
            datos.instrucciones
        ) || null;


    if (
        nombre.length < 3 ||
        nombre.length > 150
    ) {

        throw crearErrorMetodoPago(
            "NOMBRE_INVALIDO",
            "El nombre del método de pago debe tener entre 3 y 150 caracteres."
        );

    }


    if (
        [
            "transferencia",
            "deposito"
        ].includes(
            tipo
        )
    ) {

        if (
            !banco ||
            !titular ||
            !numeroCuenta
        ) {

            throw crearErrorMetodoPago(
                "DATOS_BANCARIOS_INCOMPLETOS",
                "Debes indicar banco, titular y número de cuenta."
            );

        }

    }


    let requiereComprobante =
        normalizarBooleano(
            datos.requiereComprobante,
            true
        );


    if (
        tipo === "transferencia" ||
        tipo === "deposito"
    ) {

        requiereComprobante =
            1;

    }


    const activo =
        normalizarBooleano(
            datos.activo,
            true
        );


    let orden =
        Number(
            datos.orden
        );


    if (
        !Number.isInteger(
            orden
        ) ||
        orden < 0 ||
        orden > 999
    ) {

        orden =
            0;

    }


    let conexion;


    try {

        conexion =
            await pool.getConnection();


        const resultado =
            await conexion.query(
                `
                UPDATE metodos_pago_agencia

                SET

                    nombre = ?,
                    tipo = ?,

                    banco = ?,
                    titular = ?,
                    tipo_cuenta = ?,
                    numero_cuenta = ?,

                    instrucciones = ?,

                    requiere_comprobante = ?,
                    activo = ?,
                    orden = ?

                WHERE
                    id = ?
                    AND agencia_id = ?
                `,
                [

                    nombre,
                    tipo,

                    banco,
                    titular,
                    tipoCuenta,
                    numeroCuenta,

                    instrucciones,

                    requiereComprobante,
                    activo,
                    orden,

                    metodoIdSeguro,
                    agenciaIdSeguro

                ]
            );


        if (
            Number(
                resultado.affectedRows
            ) === 0
        ) {

            const existentes =
                await conexion.query(
                    `
                    SELECT
                        id
                    FROM metodos_pago_agencia
                    WHERE
                        id = ?
                        AND agencia_id = ?
                    LIMIT 1
                    `,
                    [
                        metodoIdSeguro,
                        agenciaIdSeguro
                    ]
                );


            if (
                !existentes.length
            ) {

                throw crearErrorMetodoPago(
                    "METODO_NO_ENCONTRADO",
                    "El método de pago no existe o no pertenece a esta agencia.",
                    404
                );

            }

        }


        const metodos =
            await conexion.query(
                `
                SELECT

                    id,
                    agencia_id,

                    codigo,
                    nombre,
                    tipo,

                    banco,
                    titular,
                    tipo_cuenta,
                    numero_cuenta,

                    moneda,
                    instrucciones,

                    requiere_comprobante,
                    activo,
                    orden,

                    fecha_creacion,
                    fecha_actualizacion

                FROM metodos_pago_agencia

                WHERE
                    id = ?
                    AND agencia_id = ?

                LIMIT 1
                `,
                [
                    metodoIdSeguro,
                    agenciaIdSeguro
                ]
            );


        return metodos[0];

    } finally {

        if (
            conexion
        ) {

            conexion.release();

        }

    }

}

/* =========================================================
   CAMBIAR ESTADO DE MÉTODO DE PAGO
========================================================= */

async function cambiarEstadoMetodoPagoAgencia(
    agenciaId,
    metodoId,
    activo
) {

    const agenciaIdSeguro =
        validarId(
            agenciaId,
            "La agencia"
        );


    const metodoIdSeguro =
        validarId(
            metodoId,
            "El método de pago"
        );


    let activoSeguro;


    if (
        activo === true ||
        activo === 1 ||
        activo === "1" ||
        activo === "true"
    ) {

        activoSeguro =
            1;

    } else if (
        activo === false ||
        activo === 0 ||
        activo === "0" ||
        activo === "false"
    ) {

        activoSeguro =
            0;

    } else {

        throw crearErrorMetodoPago(
            "ESTADO_INVALIDO",
            "El estado del método de pago no es válido."
        );

    }


    let conexion;


    try {

        conexion =
            await pool.getConnection();


        const resultado =
            await conexion.query(
                `
                UPDATE metodos_pago_agencia

                SET
                    activo = ?

                WHERE
                    id = ?
                    AND agencia_id = ?
                `,
                [
                    activoSeguro,
                    metodoIdSeguro,
                    agenciaIdSeguro
                ]
            );


        if (
            Number(
                resultado.affectedRows
            ) === 0
        ) {

            const existentes =
                await conexion.query(
                    `
                    SELECT
                        id
                    FROM metodos_pago_agencia
                    WHERE
                        id = ?
                        AND agencia_id = ?
                    LIMIT 1
                    `,
                    [
                        metodoIdSeguro,
                        agenciaIdSeguro
                    ]
                );


            if (
                !existentes.length
            ) {

                throw crearErrorMetodoPago(
                    "METODO_NO_ENCONTRADO",
                    "El método de pago no existe o no pertenece a esta agencia.",
                    404
                );

            }

        }


        const metodos =
            await conexion.query(
                `
                SELECT

                    id,
                    agencia_id,

                    codigo,
                    nombre,
                    tipo,

                    banco,
                    titular,
                    tipo_cuenta,
                    numero_cuenta,

                    moneda,
                    instrucciones,

                    requiere_comprobante,
                    activo,
                    orden,

                    fecha_creacion,
                    fecha_actualizacion

                FROM metodos_pago_agencia

                WHERE
                    id = ?
                    AND agencia_id = ?

                LIMIT 1
                `,
                [
                    metodoIdSeguro,
                    agenciaIdSeguro
                ]
            );


        return metodos[0];

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

    listarMetodosPagoAgencia,

    obtenerMetodoPagoAgenciaPorId,

    crearMetodoPagoAgencia,

    actualizarMetodoPagoAgencia,

    cambiarEstadoMetodoPagoAgencia

};