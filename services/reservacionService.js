const crypto =
    require(
        "crypto"
    );


const {
    pool
} = require(
    "../config/database"
);


const {
    validarCantidadDisponible
} = require(
    "./disponibilidadService"
);


/* =========================================================
   CONFIGURACIÓN COMERCIAL TEMPORAL

   IMPORTANTE:
   Los precios se validan en el servidor.
   El navegador NO decide estos importes.

   Más adelante estos adicionales y promociones podrán
   administrarse por agencia desde MariaDB.
========================================================= */

const ADICIONALES_DISPONIBLES = {

    "seguro-ampliado": {
        codigo:
            "seguro-ampliado",

        nombre:
            "Seguro ampliado",

        precioDiario:
            12
    },


    "gps-adicional": {
        codigo:
            "gps-adicional",

        nombre:
            "Sistema GPS",

        precioDiario:
            5
    },


    "asiento-infantil": {
        codigo:
            "asiento-infantil",

        nombre:
            "Asiento infantil",

        precioDiario:
            4
    }

};


const PROMOCIONES_DISPONIBLES = {

    AUTO15: {
        codigo:
            "AUTO15",

        porcentaje:
            0.15
    }

};


/* =========================================================
   ERROR CONTROLADO
========================================================= */

function crearErrorReservacion(
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
   NORMALIZAR TEXTO
========================================================= */

function normalizarTexto(
    valor,
    nombreCampo,
    {
        requerido = false,
        minimo = 0,
        maximo = 255
    } = {}
) {

    const texto =
        String(
            valor ??
            ""
        )
            .trim();


    if (
        requerido &&
        !texto
    ) {

        throw crearErrorReservacion(
            "CAMPO_REQUERIDO",
            `El campo ${nombreCampo} es obligatorio.`
        );

    }


    if (
        texto &&
        texto.length <
            minimo
    ) {

        throw crearErrorReservacion(
            "CAMPO_INVALIDO",
            `El campo ${nombreCampo} no tiene una longitud válida.`
        );

    }


    if (
        texto.length >
        maximo
    ) {

        throw crearErrorReservacion(
            "CAMPO_INVALIDO",
            `El campo ${nombreCampo} supera la longitud permitida.`
        );

    }


    return texto ||
        null;

}


/* =========================================================
   VALIDAR CORREO
========================================================= */

function normalizarCorreo(
    valor
) {

    const correo =
        normalizarTexto(
            valor,
            "cliente.correo",
            {
                requerido:
                    true,

                minimo:
                    5,

                maximo:
                    150
            }
        );


    const formatoValido =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            correo
        );


    if (!formatoValido) {

        throw crearErrorReservacion(
            "CORREO_INVALIDO",
            "El correo del cliente no es válido."
        );

    }


    return correo
        .toLowerCase();

}


/* =========================================================
   VALIDAR TELÉFONO
========================================================= */

function normalizarTelefono(
    valor
) {

    const telefono =
        normalizarTexto(
            valor,
            "cliente.telefono",
            {
                requerido:
                    true,

                minimo:
                    8,

                maximo:
                    30
            }
        );


    const formatoValido =
        /^[0-9+\-()\s]{8,30}$/.test(
            telefono
        );


    const cantidadDigitos =
        telefono
            .replace(
                /\D/g,
                ""
            )
            .length;


    if (
        !formatoValido ||
        cantidadDigitos < 8 ||
        cantidadDigitos > 15
    ) {

        throw crearErrorReservacion(
            "TELEFONO_INVALIDO",
            "El teléfono del cliente no es válido."
        );

    }


    return telefono;

}


/* =========================================================
   VALIDAR EDAD
========================================================= */

function normalizarEdad(
    valor
) {

    const edad =
        Number(
            valor
        );


    if (
        !Number.isInteger(
            edad
        ) ||
        edad < 18 ||
        edad > 85
    ) {

        throw crearErrorReservacion(
            "EDAD_INVALIDA",
            "La edad del cliente debe estar entre 18 y 85 años."
        );

    }


    return edad;

}


/* =========================================================
   ADICIONALES SOLICITADOS

   El cliente únicamente envía códigos.
   Precio y nombre salen del servidor.
========================================================= */

function normalizarAdicionales(
    valor
) {

    if (
        valor === undefined ||
        valor === null
    ) {

        return [];

    }


    if (!Array.isArray(valor)) {

        throw crearErrorReservacion(
            "ADICIONALES_INVALIDOS",
            "Los servicios adicionales no tienen un formato válido."
        );

    }


    const codigosUnicos =
        [
            ...new Set(
                valor.map(
                    (codigo) =>
                        String(
                            codigo ||
                            ""
                        )
                            .trim()
                            .toLowerCase()
                )
            )
        ]
            .filter(Boolean);


    if (
        codigosUnicos.length >
        10
    ) {

        throw crearErrorReservacion(
            "ADICIONALES_INVALIDOS",
            "Se recibieron demasiados servicios adicionales."
        );

    }


    return codigosUnicos.map(
        (codigo) => {

            const adicional =
                ADICIONALES_DISPONIBLES[
                    codigo
                ];


            if (!adicional) {

                throw crearErrorReservacion(
                    "ADICIONAL_NO_VALIDO",
                    `El servicio adicional ${codigo} no es válido.`
                );

            }


            return adicional;

        }
    );

}


/* =========================================================
   CÓDIGO PROMOCIONAL

   El navegador solo envía el código.
   El servidor decide si existe y cuánto descuenta.
========================================================= */

function normalizarPromocion(
    valor
) {

    const codigo =
        String(
            valor ||
            ""
        )
            .trim()
            .toUpperCase();


    if (!codigo) {

        return null;

    }


    const promocion =
        PROMOCIONES_DISPONIBLES[
            codigo
        ];


    if (!promocion) {

        throw crearErrorReservacion(
            "CODIGO_PROMOCIONAL_INVALIDO",
            "El código promocional indicado no es válido."
        );

    }


    return promocion;

}


/* =========================================================
   DÍAS FACTURABLES

   Se mantiene compatible con el flujo público actual,
   que trabaja por diferencia de fechas.

   Si en el futuro se permite una renta dentro del mismo
   día, se cobrará como mínimo 1 día.
========================================================= */

function calcularDiasFacturables(
    fechaRecogida,
    fechaEntrega
) {

    const inicio =
        new Date(
            `${fechaRecogida}T00:00:00Z`
        );


    const final =
        new Date(
            `${fechaEntrega}T00:00:00Z`
        );


    const diferencia =
        Math.ceil(
            (
                final.getTime() -
                inicio.getTime()
            ) /
            (
                1000 *
                60 *
                60 *
                24
            )
        );


    return Math.max(
        1,
        diferencia
    );

}


/* =========================================================
   REDONDEAR IMPORTES
========================================================= */

function redondearMoneda(
    valor
) {

    return (
        Math.round(
            (
                Number(
                    valor
                ) +
                Number.EPSILON
            ) *
            100
        ) /
        100
    );

}


/* =========================================================
   GENERAR CÓDIGO DE RESERVACIÓN
========================================================= */

function generarCodigoReservacion() {

    const ahora =
        new Date();


    const anio =
        ahora
            .getFullYear()
            .toString()
            .slice(-2);


    const mes =
        String(
            ahora.getMonth() +
            1
        ).padStart(
            2,
            "0"
        );


    const dia =
        String(
            ahora.getDate()
        ).padStart(
            2,
            "0"
        );


    const aleatorio =
        crypto
            .randomBytes(
                4
            )
            .toString(
                "hex"
            )
            .toUpperCase();


    return (
        `AR-${anio}${mes}${dia}-${aleatorio}`
    );

}


/* =========================================================
   VALIDAR AGENCIA Y SUSCRIPCIÓN
========================================================= */

async function obtenerAgenciaDisponible(
    conexion,
    slug
) {

    const slugNormalizado =
        String(
            slug ||
            ""
        )
            .trim()
            .toLowerCase();


    if (!slugNormalizado) {

        throw crearErrorReservacion(
            "AGENCIA_INVALIDA",
            "La agencia indicada no es válida."
        );

    }


    const agencias =
        await conexion.query(
            `
            SELECT

                id,
                nombre,
                slug,
                estado

            FROM agencias

            WHERE
                slug = ?

            LIMIT 1
            `,
            [
                slugNormalizado
            ]
        );


    if (
        agencias.length ===
        0
    ) {

        throw crearErrorReservacion(
            "AGENCIA_NO_ENCONTRADA",
            "Agencia no encontrada.",
            404
        );

    }


    const agencia =
        agencias[0];


    if (
        ![
            "prueba",
            "activa"
        ].includes(
            agencia.estado
        )
    ) {

        throw crearErrorReservacion(
            "AGENCIA_NO_DISPONIBLE",
            "Esta agencia no está disponible actualmente.",
            403
        );

    }


    const suscripciones =
        await conexion.query(
            `
            SELECT

                s.id,
                s.estado,
                s.fecha_inicio,
                s.fecha_fin,

                CASE

                    WHEN

                        s.fecha_inicio <=
                            CURDATE()

                        AND

                        (
                            s.fecha_fin IS NULL

                            OR

                            s.fecha_fin >=
                                CURDATE()
                        )

                    THEN 1

                    ELSE 0

                END AS fecha_vigente

            FROM suscripciones s

            WHERE
                s.agencia_id = ?

            ORDER BY
                s.id DESC

            LIMIT 1
            `,
            [
                agencia.id
            ]
        );


    if (
        suscripciones.length ===
        0
    ) {

        throw crearErrorReservacion(
            "SUSCRIPCION_NO_DISPONIBLE",
            "Esta agencia no tiene una suscripción disponible.",
            403
        );

    }


    const suscripcion =
        suscripciones[0];


    if (
        ![
            "prueba",
            "activa"
        ].includes(
            suscripcion.estado
        ) ||
        Number(
            suscripcion.fecha_vigente
        ) !== 1
    ) {

        throw crearErrorReservacion(
            "SUSCRIPCION_NO_DISPONIBLE",
            "Esta agencia no está disponible actualmente.",
            403
        );

    }


    return agencia;

}


/* =========================================================
   CREAR RESERVACIÓN WEB
========================================================= */

async function crearReservacionWeb({
    slug,
    datos
}) {

    let conexion;


    try {

        conexion =
            await pool.getConnection();


        /*
         * READ COMMITTED evita trabajar con una fotografía
         * antigua de las reservaciones después de esperar
         * por el bloqueo FOR UPDATE del modelo.
         */

        await conexion.query(
            `
            SET TRANSACTION
            ISOLATION LEVEL
            READ COMMITTED
            `
        );


        await conexion
            .beginTransaction();


        /* -------------------------------------------------
           AGENCIA
        ------------------------------------------------- */

        const agencia =
            await obtenerAgenciaDisponible(
                conexion,
                slug
            );


        /* -------------------------------------------------
           DATOS ENVIADOS POR EL CLIENTE
        ------------------------------------------------- */

        const cuerpo =
            datos &&
            typeof datos ===
                "object"
                ? datos
                : {};


        const modeloId =
            cuerpo.modeloId;


        const cantidad =
            cuerpo.cantidad;


        const lugarRecogida =
            normalizarTexto(
                cuerpo.lugarRecogida,
                "lugarRecogida",
                {
                    requerido:
                        true,

                    minimo:
                        3,

                    maximo:
                        255
                }
            );


        const lugarEntrega =
            normalizarTexto(
                cuerpo.lugarEntrega,
                "lugarEntrega",
                {
                    requerido:
                        true,

                    minimo:
                        3,

                    maximo:
                        255
                }
            );


        const cliente =
            cuerpo.cliente &&
            typeof cuerpo.cliente ===
                "object"
                ? cuerpo.cliente
                : {};


        const clienteNombre =
            normalizarTexto(
                cliente.nombre,
                "cliente.nombre",
                {
                    requerido:
                        true,

                    minimo:
                        3,

                    maximo:
                        180
                }
            );


        const clienteDocumento =
            normalizarTexto(
                cliente.documento,
                "cliente.documento",
                {
                    requerido:
                        true,

                    minimo:
                        6,

                    maximo:
                        60
                }
            );


        const clienteCorreo =
            normalizarCorreo(
                cliente.correo
            );


        const clienteTelefono =
            normalizarTelefono(
                cliente.telefono
            );


        const clienteEdad =
            normalizarEdad(
                cliente.edad
            );


        const clienteLicencia =
            normalizarTexto(
                cliente.licencia,
                "cliente.licencia",
                {
                    requerido:
                        true,

                    minimo:
                        5,

                    maximo:
                        80
                }
            );


        const comentarios =
            normalizarTexto(
                cuerpo.comentarios,
                "comentarios",
                {
                    requerido:
                        false,

                    maximo:
                        3000
                }
            );


        const adicionales =
            normalizarAdicionales(
                cuerpo.adicionales
            );


        const promocion =
            normalizarPromocion(
                cuerpo.codigoPromocional
            );


        /* -------------------------------------------------
           DISPONIBILIDAD REAL

           bloquearModelo = true
           hace SELECT ... FOR UPDATE sobre el modelo.

           Esto serializa las creaciones concurrentes
           del mismo modelo.
        ------------------------------------------------- */

        const disponibilidad =
            await validarCantidadDisponible({

                agenciaId:
                    agencia.id,

                modeloId,

                cantidad,

                fechaRecogida:
                    cuerpo.fechaRecogida,

                horaRecogida:
                    cuerpo.horaRecogida,

                fechaEntrega:
                    cuerpo.fechaEntrega,

                horaEntrega:
                    cuerpo.horaEntrega,

                conexion,

                bloquearModelo:
                    true

            });


        if (
            !disponibilidad.suficiente
        ) {

            const error =
                crearErrorReservacion(
                    "DISPONIBILIDAD_INSUFICIENTE",
                    "La cantidad solicitada ya no se encuentra disponible.",
                    409
                );


            error.cantidadDisponible =
                disponibilidad
                    .cantidadDisponible;


            throw error;

        }


        /* -------------------------------------------------
           CÁLCULO ECONÓMICO EN EL SERVIDOR
        ------------------------------------------------- */

        const cantidadNormalizada =
            disponibilidad
                .cantidadSolicitada;


        const precioDiario =
            redondearMoneda(
                disponibilidad
                    .modelo
                    .precioDiario
            );


        const dias =
            calcularDiasFacturables(
                disponibilidad
                    .periodo
                    .fechaRecogida,

                disponibilidad
                    .periodo
                    .fechaEntrega
            );


        const subtotal =
            redondearMoneda(
                precioDiario *
                dias *
                cantidadNormalizada
            );


        const adicionalesSnapshot =
            adicionales.map(
                (adicional) => {

                    const costoTotal =
                        redondearMoneda(
                            adicional
                                .precioDiario *
                            dias *
                            cantidadNormalizada
                        );


                    return {

                        codigo:
                            adicional.codigo,

                        nombre:
                            adicional.nombre,

                        precioDiario:
                            redondearMoneda(
                                adicional
                                    .precioDiario
                            ),

                        cantidadVehiculos:
                            cantidadNormalizada,

                        dias,

                        costoTotal

                    };

                }
            );


        const costoAdicionales =
            redondearMoneda(
                adicionalesSnapshot
                    .reduce(
                        (
                            acumulado,
                            adicional
                        ) =>
                            acumulado +
                            adicional
                                .costoTotal,
                        0
                    )
            );


        const descuento =
            promocion
                ? redondearMoneda(
                    subtotal *
                    promocion
                        .porcentaje
                )
                : 0;


        const total =
            redondearMoneda(
                Math.max(
                    0,
                    subtotal +
                    costoAdicionales -
                    descuento
                )
            );


        /* -------------------------------------------------
           INSERTAR RESERVACIÓN

           Se intenta varias veces únicamente por una
           improbable colisión del código amigable.
        ------------------------------------------------- */

        let reservacionId =
            null;


        let codigo =
            null;


        for (
            let intento = 1;
            intento <= 5;
            intento += 1
        ) {

            codigo =
                generarCodigoReservacion();


            try {

                const resultado =
                    await conexion.query(
                        `
                        INSERT INTO reservaciones (

                            agencia_id,
                            codigo,

                            modelo_id,
                            cantidad_vehiculos,

                            sucursal_recogida_id,
                            sucursal_entrega_id,

                            lugar_recogida,
                            lugar_entrega,

                            fecha_recogida,
                            hora_recogida,

                            fecha_entrega,
                            hora_entrega,

                            cliente_nombre,
                            cliente_documento,
                            cliente_correo,
                            cliente_telefono,
                            cliente_edad,
                            cliente_licencia,

                            precio_diario,
                            subtotal,
                            costo_adicionales,
                            descuento,
                            total,

                            codigo_promocional,
                            comentarios,

                            estado,
                            origen,
                            creado_por_usuario_id

                        )

                        VALUES (

                            ?,
                            ?,

                            ?,
                            ?,

                            NULL,
                            NULL,

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
                            ?,
                            ?,

                            ?,
                            ?,

                            'pendiente',
                            'web',
                            NULL

                        )
                        `,
                        [

                            agencia.id,
                            codigo,

                            disponibilidad
                                .modelo
                                .id,

                            cantidadNormalizada,

                            lugarRecogida,
                            lugarEntrega,

                            disponibilidad
                                .periodo
                                .fechaRecogida,

                            disponibilidad
                                .periodo
                                .horaRecogida,

                            disponibilidad
                                .periodo
                                .fechaEntrega,

                            disponibilidad
                                .periodo
                                .horaEntrega,

                            clienteNombre,
                            clienteDocumento,
                            clienteCorreo,
                            clienteTelefono,
                            clienteEdad,
                            clienteLicencia,

                            precioDiario,
                            subtotal,
                            costoAdicionales,
                            descuento,
                            total,

                            promocion
                                ?.codigo ||
                                null,

                            comentarios

                        ]
                    );


                reservacionId =
                    Number(
                        resultado.insertId
                    );


                break;

            } catch (error) {

                const esCodigoDuplicado =
                    error?.code ===
                        "ER_DUP_ENTRY" ||
                    Number(
                        error?.errno
                    ) === 1062;


                if (
                    !esCodigoDuplicado ||
                    intento === 5
                ) {

                    throw error;

                }

            }

        }


        if (!reservacionId) {

            throw crearErrorReservacion(
                "CODIGO_RESERVACION_ERROR",
                "No fue posible generar el código de la reservación.",
                500
            );

        }


        /* -------------------------------------------------
           SNAPSHOT DE ADICIONALES
        ------------------------------------------------- */

        for (
            const adicional
            of adicionalesSnapshot
        ) {

            await conexion.query(
                `
                INSERT INTO reservacion_adicionales (

                    reservacion_id,
                    codigo,
                    nombre,
                    precio_diario,
                    cantidad_vehiculos,
                    dias,
                    costo_total

                )

                VALUES (
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

                    reservacionId,

                    adicional.codigo,
                    adicional.nombre,
                    adicional.precioDiario,
                    adicional.cantidadVehiculos,
                    adicional.dias,
                    adicional.costoTotal

                ]
            );

        }


        /* -------------------------------------------------
           FINALIZAR TRANSACCIÓN
        ------------------------------------------------- */

        await conexion
            .commit();


        return {

            id:
                reservacionId,


            codigo,


            agencia: {

    id:
        Number(
            agencia.id
        ),

    nombre:
        agencia.nombre,

    slug:
        agencia.slug

},


            modelo: {

                id:
                    disponibilidad
                        .modelo
                        .id,

                nombre:
                    disponibilidad
                        .modelo
                        .nombre,

                marca:
                    disponibilidad
                        .modelo
                        .marca

            },


            cantidadVehiculos:
                cantidadNormalizada,


            periodo:
                disponibilidad
                    .periodo,


            lugarRecogida,

            lugarEntrega,


            cliente: {

                nombre:
                    clienteNombre,

                documento:
                    clienteDocumento,

                correo:
                    clienteCorreo,

                telefono:
                    clienteTelefono,

                edad:
                    clienteEdad,

                licencia:
                    clienteLicencia

            },


            adicionales:
                adicionalesSnapshot,


            codigoPromocional:
                promocion
                    ?.codigo ||
                    null,


            dias,

            precioDiario,

            subtotal,

            costoAdicionales,

            descuento,

            total,


            estado:
                "pendiente",


            origen:
                "web"

        };


    } catch (error) {

        if (conexion) {

            try {

                await conexion
                    .rollback();

            } catch (
                errorRollback
            ) {

                console.error(
                    "No fue posible ejecutar ROLLBACK de la reservación.",
                    errorRollback
                );

            }

        }


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

    ADICIONALES_DISPONIBLES,

    PROMOCIONES_DISPONIBLES,

    crearReservacionWeb

};