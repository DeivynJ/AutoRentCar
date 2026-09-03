/* =========================================================
   AUTORENTCAR - UNIDADES FÍSICAS DEL PANEL DE AGENCIA
========================================================= */

const {
    pool
} = require(
    "../config/database"
);


/* =========================================================
   MOSTRAR UNIDADES DE UN MODELO
========================================================= */

async function mostrarUnidadesModeloPanel(
    req,
    res
) {

    let conexion;


    try {

        const agenciaId =
            Number(
                req.agencia?.id
            );


        const modeloId =
            Number(
                req.params.modeloId
            );


        if (
            !Number.isInteger(
                agenciaId
            ) ||
            agenciaId <= 0
        ) {

            return res
                .status(403)
                .send(
                    "No fue posible identificar la agencia del usuario."
                );

        }


        if (
            !Number.isInteger(
                modeloId
            ) ||
            modeloId <= 0
        ) {

            return res
                .status(400)
                .send(
                    "ID de modelo inválido."
                );

        }


        conexion =
            await pool.getConnection();


        /* =================================================
           MODELO DE LA AGENCIA AUTENTICADA
        ================================================= */

        const modeloResultado =
            await conexion.query(
                `
                SELECT

                    id,
                    agencia_id,
                    nombre,
                    marca,
                    anio,
                    categoria,
                    precio_diario,
                    imagen,
                    estado

                FROM modelos_vehiculos

                WHERE
                    id = ?

                    AND agencia_id = ?

                LIMIT 1
                `,
                [
                    modeloId,
                    agenciaId
                ]
            );


        if (
            modeloResultado.length ===
            0
        ) {

            return res
                .status(404)
                .send(
                    "Modelo de vehículo no encontrado para esta agencia."
                );

        }


        const modelo =
            modeloResultado[0];


        /* =================================================
           UNIDADES
        ================================================= */

        const unidades =
            await conexion.query(
                `
                SELECT

                    v.id,

                    v.codigo_interno,

                    v.placa,

                    v.vin,

                    v.color,

                    v.kilometraje,

                    v.estado,

                    v.sucursal_id,

                    s.nombre
                        AS sucursal_nombre,

                    s.estado
                        AS sucursal_estado,

                    s.es_principal

                FROM vehiculos v

                INNER JOIN sucursales s

                    ON s.id =
                        v.sucursal_id

                    AND s.agencia_id =
                        v.agencia_id

                WHERE
                    v.agencia_id = ?

                    AND v.modelo_id = ?

                ORDER BY

                    CASE

                        WHEN v.estado = 'disponible'
                            THEN 1

                        WHEN v.estado = 'reservado'
                            THEN 2

                        WHEN v.estado = 'alquilado'
                            THEN 3

                        WHEN v.estado = 'mantenimiento'
                            THEN 4

                        ELSE 5

                    END,

                    v.codigo_interno ASC
                `,
                [
                    agenciaId,
                    modeloId
                ]
            );


        /* =================================================
           RESUMEN DEL MODELO
        ================================================= */

        const resumen =
        {

            total:
                unidades.length,

            activas:
                unidades.filter(
                    unidad =>
                        unidad.estado !==
                        "inactivo"
                ).length,

            disponibles:
                unidades.filter(
                    unidad =>
                        unidad.estado ===
                        "disponible"
                ).length,

            reservadas:
                unidades.filter(
                    unidad =>
                        unidad.estado ===
                        "reservado"
                ).length,

            alquiladas:
                unidades.filter(
                    unidad =>
                        unidad.estado ===
                        "alquilado"
                ).length,

            mantenimiento:
                unidades.filter(
                    unidad =>
                        unidad.estado ===
                        "mantenimiento"
                ).length,

            inactivas:
                unidades.filter(
                    unidad =>
                        unidad.estado ===
                        "inactivo"
                ).length

        };


        /* =================================================
           USO GLOBAL DEL PLAN
        ================================================= */

        const usoResultado =
            await conexion.query(
                `
                SELECT
                    COUNT(*) AS total

                FROM vehiculos

                WHERE
                    agencia_id = ?

                    AND estado <> 'inactivo'
                `,
                [
                    agenciaId
                ]
            );


        const vehiculosActivos =
            Number(
                usoResultado[0]
                    .total ||
                0
            );


        return res.render(
            "panel/vehiculos/unidades",
            {

                titulo:
                    "Unidades",

                subtituloPagina:
                    "Vehículos",

                paginaActual:
                    "catalogo",

                usuario:
                    req.usuarioAgencia,

                agencia:
                    req.agencia,

                suscripcion:
                    req.suscripcion,

                plan:
                    req.plan,

                modelo,

                unidades,

                resumen,

                vehiculosActivos,

                mensajeExito:

    req.query.unidadCreada ===
        "1"

        ? "La unidad del vehículo fue registrada correctamente."

        : req.query.actualizada ===
            "1"

            ? "La unidad del vehículo fue actualizada correctamente."

            : null

            }
        );


    } catch (error) {

        console.error(
            "Error mostrando unidades desde el panel:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible cargar las unidades del vehículo."
            );


    } finally {

        if (conexion) {

            conexion.release();

        }

    }

}


/* =========================================================
   MOSTRAR NUEVA UNIDAD
========================================================= */

async function mostrarNuevaUnidadPanel(
    req,
    res
) {

    let conexion;


    try {

        const agenciaId =
            Number(
                req.agencia?.id
            );


        const modeloId =
            Number(
                req.params.modeloId
            );


        if (
            !Number.isInteger(
                agenciaId
            ) ||
            agenciaId <= 0
        ) {

            return res
                .status(403)
                .send(
                    "No fue posible identificar la agencia del usuario."
                );

        }


        if (
            !Number.isInteger(
                modeloId
            ) ||
            modeloId <= 0
        ) {

            return res
                .status(400)
                .send(
                    "ID de modelo inválido."
                );

        }


        conexion =
            await pool.getConnection();


        /* =================================================
           MODELO
        ================================================= */

        const modeloResultado =
            await conexion.query(
                `
                SELECT

                    id,
                    agencia_id,
                    nombre,
                    marca,
                    anio,
                    categoria,
                    imagen,
                    estado

                FROM modelos_vehiculos

                WHERE
                    id = ?

                    AND agencia_id = ?

                LIMIT 1
                `,
                [
                    modeloId,
                    agenciaId
                ]
            );


        if (
            modeloResultado.length ===
            0
        ) {

            return res
                .status(404)
                .send(
                    "Modelo de vehículo no encontrado para esta agencia."
                );

        }


        const modelo =
            modeloResultado[0];


        if (
            modelo.estado !==
            "activo"
        ) {

            return res
                .status(409)
                .send(
                    "No se pueden agregar unidades a un modelo inactivo."
                );

        }


        /* =================================================
           SUCURSALES ACTIVAS
        ================================================= */

        const sucursales =
            await conexion.query(
                `
                SELECT

                    id,
                    nombre,
                    es_principal

                FROM sucursales

                WHERE
                    agencia_id = ?

                    AND estado = 'activa'

                ORDER BY

                    es_principal DESC,

                    nombre ASC
                `,
                [
                    agenciaId
                ]
            );


        /* =================================================
           USO DEL PLAN
        ================================================= */

        const usoResultado =
            await conexion.query(
                `
                SELECT
                    COUNT(*) AS total

                FROM vehiculos

                WHERE
                    agencia_id = ?

                    AND estado <> 'inactivo'
                `,
                [
                    agenciaId
                ]
            );


        const vehiculosActivos =
            Number(
                usoResultado[0]
                    .total ||
                0
            );


        return res.render(
            "panel/vehiculos/nuevaUnidad",
            {

                titulo:
                    "Nueva unidad",

                subtituloPagina:
                    "Vehículos",

                paginaActual:
                    "catalogo",

                usuario:
                    req.usuarioAgencia,

                agencia:
                    req.agencia,

                suscripcion:
                    req.suscripcion,

                plan:
                    req.plan,

                modelo,

                sucursales,

                vehiculosActivos,

                error:
                    null,

                datos:
                {

                    codigo_interno:
                        "",

                    placa:
                        "",

                    vin:
                        "",

                    color:
                        "",

                    kilometraje:
                        "0",

                    sucursal_id:
                        sucursales.length
                            ? String(
                                sucursales[0].id
                            )
                            : "",

                    estado:
                        "disponible"

                }

            }
        );


    } catch (error) {

        console.error(
            "Error mostrando nueva unidad desde el panel:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible cargar el formulario de la unidad."
            );


    } finally {

        if (conexion) {

            conexion.release();

        }

    }

}


/* =========================================================
   CREAR UNIDAD FÍSICA
========================================================= */

async function crearUnidadPanel(
    req,
    res
) {

    let conexion;


    const agenciaId =
        Number(
            req.agencia?.id
        );


    const modeloId =
        Number(
            req.params.modeloId
        );


    const datos =
    {

        codigo_interno:
            String(
                req.body.codigo_interno ||
                ""
            ).trim(),

        placa:
            String(
                req.body.placa ||
                ""
            ).trim(),

        vin:
            String(
                req.body.vin ||
                ""
            ).trim(),

        color:
            String(
                req.body.color ||
                ""
            ).trim(),

        kilometraje:
            String(
                req.body.kilometraje ??
                "0"
            ).trim(),

        sucursal_id:
            String(
                req.body.sucursal_id ||
                ""
            ).trim(),

        estado:
            String(
                req.body.estado ||
                ""
            ).trim()

    };


    try {

        if (
            !Number.isInteger(
                agenciaId
            ) ||
            agenciaId <= 0
        ) {

            return res
                .status(403)
                .send(
                    "No fue posible identificar la agencia del usuario."
                );

        }


        if (
            !Number.isInteger(
                modeloId
            ) ||
            modeloId <= 0
        ) {

            return res
                .status(400)
                .send(
                    "ID de modelo inválido."
                );

        }


        conexion =
            await pool.getConnection();


        /* =================================================
           MOSTRAR ERROR EN FORMULARIO
        ================================================= */

        async function renderizarError(
            mensaje,
            estadoHttp = 400
        ) {

            const modeloResultado =
                await conexion.query(
                    `
                    SELECT

                        id,
                        agencia_id,
                        nombre,
                        marca,
                        anio,
                        categoria,
                        imagen,
                        estado

                    FROM modelos_vehiculos

                    WHERE
                        id = ?

                        AND agencia_id = ?

                    LIMIT 1
                    `,
                    [
                        modeloId,
                        agenciaId
                    ]
                );


            if (
                modeloResultado.length ===
                0
            ) {

                return res
                    .status(404)
                    .send(
                        "Modelo de vehículo no encontrado para esta agencia."
                    );

            }


            const sucursales =
                await conexion.query(
                    `
                    SELECT

                        id,
                        nombre,
                        es_principal

                    FROM sucursales

                    WHERE
                        agencia_id = ?

                        AND estado = 'activa'

                    ORDER BY

                        es_principal DESC,

                        nombre ASC
                    `,
                    [
                        agenciaId
                    ]
                );


            const usoResultado =
                await conexion.query(
                    `
                    SELECT
                        COUNT(*) AS total

                    FROM vehiculos

                    WHERE
                        agencia_id = ?

                        AND estado <> 'inactivo'
                    `,
                    [
                        agenciaId
                    ]
                );


            return res
                .status(
                    estadoHttp
                )
                .render(
                    "panel/vehiculos/nuevaUnidad",
                    {

                        titulo:
                            "Nueva unidad",

                        subtituloPagina:
                            "Vehículos",

                        paginaActual:
                            "catalogo",

                        usuario:
                            req.usuarioAgencia,

                        agencia:
                            req.agencia,

                        suscripcion:
                            req.suscripcion,

                        plan:
                            req.plan,

                        modelo:
                            modeloResultado[0],

                        sucursales,

                        vehiculosActivos:
                            Number(
                                usoResultado[0]
                                    .total ||
                                0
                            ),

                        error:
                            mensaje,

                        datos

                    }
                );

        }


        /* =================================================
           VALIDACIONES
        ================================================= */

        if (
            !datos.codigo_interno
        ) {

            return await renderizarError(
                "El código interno del vehículo es obligatorio."
            );

        }


        if (
            datos.codigo_interno.length >
            50
        ) {

            return await renderizarError(
                "El código interno no puede superar los 50 caracteres."
            );

        }


        if (
            datos.placa.length >
            30
        ) {

            return await renderizarError(
                "La placa no puede superar los 30 caracteres."
            );

        }


        if (
            datos.vin.length >
            50
        ) {

            return await renderizarError(
                "El VIN no puede superar los 50 caracteres."
            );

        }


        if (
            datos.color.length >
            50
        ) {

            return await renderizarError(
                "El color no puede superar los 50 caracteres."
            );

        }


        const kilometraje =
            Number(
                datos.kilometraje
            );


        if (
            !Number.isInteger(
                kilometraje
            ) ||
            kilometraje < 0
        ) {

            return await renderizarError(
                "Introduce un kilometraje válido."
            );

        }


        const sucursalId =
            Number(
                datos.sucursal_id
            );


        if (
            !Number.isInteger(
                sucursalId
            ) ||
            sucursalId <= 0
        ) {

            return await renderizarError(
                "Selecciona una sucursal válida."
            );

        }


        const estadosValidos =
        [
            "disponible",
            "reservado",
            "alquilado",
            "mantenimiento",
            "inactivo"
        ];


        if (
            !estadosValidos.includes(
                datos.estado
            )
        ) {

            return await renderizarError(
                "El estado seleccionado no es válido."
            );

        }


        /* =================================================
           TRANSACCIÓN
        ================================================= */

        await conexion.beginTransaction();


        /* =================================================
           BLOQUEAR AGENCIA
        ================================================= */

        const agenciaResultado =
            await conexion.query(
                `
                SELECT
                    id

                FROM agencias

                WHERE
                    id = ?

                LIMIT 1

                FOR UPDATE
                `,
                [
                    agenciaId
                ]
            );


        if (
            agenciaResultado.length ===
            0
        ) {

            await conexion.rollback();


            return res
                .status(404)
                .send(
                    "Agencia no encontrada."
                );

        }


        /* =================================================
           VALIDAR MODELO
        ================================================= */

        const modeloResultado =
            await conexion.query(
                `
                SELECT

                    id,
                    estado

                FROM modelos_vehiculos

                WHERE
                    id = ?

                    AND agencia_id = ?

                LIMIT 1
                `,
                [
                    modeloId,
                    agenciaId
                ]
            );


        if (
            modeloResultado.length ===
            0
        ) {

            await conexion.rollback();


            return res
                .status(404)
                .send(
                    "Modelo de vehículo no encontrado para esta agencia."
                );

        }


        if (
            modeloResultado[0]
                .estado !==
            "activo"
        ) {

            await conexion.rollback();


            return await renderizarError(
                "No se pueden agregar unidades a un modelo inactivo.",
                409
            );

        }


        /* =================================================
           VALIDAR SUCURSAL
        ================================================= */

        const sucursalResultado =
            await conexion.query(
                `
                SELECT

                    id,
                    estado

                FROM sucursales

                WHERE
                    id = ?

                    AND agencia_id = ?

                LIMIT 1
                `,
                [
                    sucursalId,
                    agenciaId
                ]
            );


        if (
            sucursalResultado.length ===
                0 ||
            sucursalResultado[0]
                .estado !==
                "activa"
        ) {

            await conexion.rollback();


            return await renderizarError(
                "La sucursal seleccionada no está disponible.",
                409
            );

        }


        /* =================================================
           CÓDIGO INTERNO DUPLICADO
        ================================================= */

        const codigoDuplicado =
            await conexion.query(
                `
                SELECT
                    id

                FROM vehiculos

                WHERE
                    agencia_id = ?

                    AND LOWER(
                        codigo_interno
                    ) = LOWER(?)

                LIMIT 1
                `,
                [
                    agenciaId,
                    datos.codigo_interno
                ]
            );


        if (
            codigoDuplicado.length >
            0
        ) {

            await conexion.rollback();


            return await renderizarError(
                "Ya existe un vehículo con ese código interno dentro de esta agencia.",
                409
            );

        }


        /* =================================================
           PLACA DUPLICADA
        ================================================= */

        if (
            datos.placa
        ) {

            const placaDuplicada =
                await conexion.query(
                    `
                    SELECT
                        id

                    FROM vehiculos

                    WHERE
                        agencia_id = ?

                        AND LOWER(
                            placa
                        ) = LOWER(?)

                    LIMIT 1
                    `,
                    [
                        agenciaId,
                        datos.placa
                    ]
                );


            if (
                placaDuplicada.length >
                0
            ) {

                await conexion.rollback();


                return await renderizarError(
                    "Ya existe un vehículo con esa placa dentro de esta agencia.",
                    409
                );

            }

        }


        /* =================================================
           VIN DUPLICADO
        ================================================= */

        if (
            datos.vin
        ) {

            const vinDuplicado =
                await conexion.query(
                    `
                    SELECT
                        id

                    FROM vehiculos

                    WHERE
                        LOWER(
                            vin
                        ) = LOWER(?)

                    LIMIT 1
                    `,
                    [
                        datos.vin
                    ]
                );


            if (
                vinDuplicado.length >
                0
            ) {

                await conexion.rollback();


                return await renderizarError(
                    "Ya existe un vehículo registrado con ese VIN.",
                    409
                );

            }

        }


        /* =================================================
           VALIDAR PLAN SI CONSUME CUPO
        ================================================= */

        if (
            datos.estado !==
            "inactivo"
        ) {

            const suscripcionResultado =
                await conexion.query(
                    `
                    SELECT

                        s.estado
                            AS suscripcion_estado,

                        CASE

                            WHEN
                                s.fecha_inicio <=
                                    CURDATE()

                                AND (

                                    s.fecha_fin IS NULL

                                    OR s.fecha_fin >=
                                        CURDATE()

                                )

                            THEN 1

                            ELSE 0

                        END
                            AS fecha_vigente,

                        p.nombre
                            AS plan_nombre,

                        p.limite_vehiculos

                    FROM suscripciones s

                    INNER JOIN planes p

                        ON p.id =
                            s.plan_id

                    WHERE
                        s.agencia_id = ?

                    ORDER BY
                        s.id DESC

                    LIMIT 1
                    `,
                    [
                        agenciaId
                    ]
                );


            if (
                suscripcionResultado.length ===
                0
            ) {

                await conexion.rollback();


                return await renderizarError(
                    "La agencia no tiene una suscripción asociada.",
                    409
                );

            }


            const suscripcion =
                suscripcionResultado[0];


            const estadosConAcceso =
            [
                "prueba",
                "activa"
            ];


            if (
                !estadosConAcceso.includes(
                    suscripcion
                        .suscripcion_estado
                ) ||
                Number(
                    suscripcion
                        .fecha_vigente
                ) !== 1
            ) {

                await conexion.rollback();


                return await renderizarError(
                    "No se puede agregar un vehículo activo porque la suscripción de la agencia no está vigente.",
                    409
                );

            }


            if (
                suscripcion
                    .limite_vehiculos !==
                null
            ) {

                const usoResultado =
                    await conexion.query(
                        `
                        SELECT
                            COUNT(*) AS total

                        FROM vehiculos

                        WHERE
                            agencia_id = ?

                            AND estado <>
                                'inactivo'
                        `,
                        [
                            agenciaId
                        ]
                    );


                const totalActivos =
                    Number(
                        usoResultado[0]
                            .total ||
                        0
                    );


                const limiteVehiculos =
                    Number(
                        suscripcion
                            .limite_vehiculos
                    );


                if (
                    totalActivos >=
                    limiteVehiculos
                ) {

                    await conexion.rollback();


                    return await renderizarError(
                        `La agencia alcanzó el límite de ${limiteVehiculos} vehículos activos permitido por el plan ${suscripcion.plan_nombre}.`,
                        409
                    );

                }

            }

        }


        /* =================================================
           INSERTAR UNIDAD
        ================================================= */

        await conexion.query(
            `
            INSERT INTO vehiculos (

                agencia_id,
                modelo_id,
                sucursal_id,
                codigo_interno,
                placa,
                vin,
                color,
                kilometraje,
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
                ?
            )
            `,
            [
                agenciaId,

                modeloId,

                sucursalId,

                datos.codigo_interno,

                datos.placa ||
                    null,

                datos.vin ||
                    null,

                datos.color ||
                    null,

                kilometraje,

                datos.estado
            ]
        );


        await conexion.commit();


        return res.redirect(
            `/panel/vehiculos/modelos/${modeloId}/unidades?unidadCreada=1`
        );


    } catch (error) {

        if (conexion) {

            try {

                await conexion.rollback();

            } catch (_) {

                // Sin acción.
            }

        }


        console.error(
            "Error creando unidad desde el panel:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible registrar la unidad del vehículo."
            );


    } finally {

        if (conexion) {

            conexion.release();

        }

    }

}
/* =========================================================
   MOSTRAR EDITAR UNIDAD
========================================================= */

async function mostrarEditarUnidadPanel(
    req,
    res
) {

    let conexion;


    try {

        const agenciaId =
            Number(
                req.agencia?.id
            );


        const modeloId =
            Number(
                req.params.modeloId
            );


        const unidadId =
            Number(
                req.params.unidadId
            );


        if (
            !Number.isInteger(
                agenciaId
            ) ||
            agenciaId <= 0
        ) {

            return res
                .status(403)
                .send(
                    "No fue posible identificar la agencia del usuario."
                );

        }


        if (
            !Number.isInteger(
                modeloId
            ) ||
            modeloId <= 0 ||
            !Number.isInteger(
                unidadId
            ) ||
            unidadId <= 0
        ) {

            return res
                .status(400)
                .send(
                    "Datos del vehículo inválidos."
                );

        }


        conexion =
            await pool.getConnection();


        /* =================================================
           MODELO DE ESTA AGENCIA
        ================================================= */

        const modeloResultado =
            await conexion.query(
                `
                SELECT

                    id,
                    agencia_id,
                    marca,
                    nombre,
                    anio,
                    imagen,
                    estado

                FROM modelos_vehiculos

                WHERE
                    id = ?

                    AND agencia_id = ?

                LIMIT 1
                `,
                [
                    modeloId,
                    agenciaId
                ]
            );


        if (
            modeloResultado.length ===
            0
        ) {

            return res
                .status(404)
                .send(
                    "Modelo de vehículo no encontrado para esta agencia."
                );

        }


        /* =================================================
           UNIDAD DE ESTA AGENCIA Y MODELO
        ================================================= */

        const unidadResultado =
            await conexion.query(
                `
                SELECT

                    id,
                    agencia_id,
                    modelo_id,
                    sucursal_id,
                    codigo_interno,
                    placa,
                    vin,
                    color,
                    kilometraje,
                    estado

                FROM vehiculos

                WHERE
                    id = ?

                    AND agencia_id = ?

                    AND modelo_id = ?

                LIMIT 1
                `,
                [
                    unidadId,
                    agenciaId,
                    modeloId
                ]
            );


        if (
            unidadResultado.length ===
            0
        ) {

            return res
                .status(404)
                .send(
                    "Unidad de vehículo no encontrada para esta agencia."
                );

        }


        const unidad =
            unidadResultado[0];


        /* =================================================
           SUCURSALES

           Se muestran:
           - todas las activas
           - la sucursal actual aunque haya sido inactivada
        ================================================= */

        const sucursales =
            await conexion.query(
                `
                SELECT

                    id,
                    nombre,
                    es_principal,
                    estado

                FROM sucursales

                WHERE
                    agencia_id = ?

                    AND (

                        estado = 'activa'

                        OR id = ?

                    )

                ORDER BY

                    es_principal DESC,

                    CASE
                        WHEN estado = 'activa'
                            THEN 0
                        ELSE 1
                    END,

                    nombre ASC
                `,
                [
                    agenciaId,
                    unidad.sucursal_id
                ]
            );


        /* =================================================
           USO ACTUAL DEL PLAN
        ================================================= */

        const usoResultado =
            await conexion.query(
                `
                SELECT
                    COUNT(*) AS total

                FROM vehiculos

                WHERE
                    agencia_id = ?

                    AND estado <> 'inactivo'
                `,
                [
                    agenciaId
                ]
            );


        const vehiculosActivos =
            Number(
                usoResultado[0]
                    .total ||
                0
            );


        return res.render(
            "panel/vehiculos/editarUnidad",
            {

                titulo:
                    "Editar unidad",

                subtituloPagina:
                    "Vehículos",

                paginaActual:
                    "catalogo",

                usuario:
                    req.usuarioAgencia,

                agencia:
                    req.agencia,

                suscripcion:
                    req.suscripcion,

                plan:
                    req.plan,

                modelo:
                    modeloResultado[0],

                unidadEditar:
                    unidad,

                sucursales,

                vehiculosActivos,

                error:
                    null

            }
        );


    } catch (error) {

        console.error(
            "Error mostrando editar unidad desde el panel:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible cargar la unidad del vehículo."
            );


    } finally {

        if (conexion) {

            conexion.release();

        }

    }

}


/* =========================================================
   ACTUALIZAR UNIDAD FÍSICA
========================================================= */

async function actualizarUnidadPanel(
    req,
    res
) {

    let conexion;


    const agenciaId =
        Number(
            req.agencia?.id
        );


    const modeloId =
        Number(
            req.params.modeloId
        );


    const unidadId =
        Number(
            req.params.unidadId
        );


    const datos =
    {

        codigo_interno:
            String(
                req.body.codigo_interno ||
                ""
            ).trim(),

        placa:
            String(
                req.body.placa ||
                ""
            ).trim(),

        vin:
            String(
                req.body.vin ||
                ""
            ).trim(),

        color:
            String(
                req.body.color ||
                ""
            ).trim(),

        kilometraje:
            String(
                req.body.kilometraje ??
                "0"
            ).trim(),

        sucursal_id:
            String(
                req.body.sucursal_id ||
                ""
            ).trim(),

        estado:
            String(
                req.body.estado ||
                ""
            ).trim()

    };


    try {

        if (
            !Number.isInteger(
                agenciaId
            ) ||
            agenciaId <= 0
        ) {

            return res
                .status(403)
                .send(
                    "No fue posible identificar la agencia del usuario."
                );

        }


        if (
            !Number.isInteger(
                modeloId
            ) ||
            modeloId <= 0 ||
            !Number.isInteger(
                unidadId
            ) ||
            unidadId <= 0
        ) {

            return res
                .status(400)
                .send(
                    "Datos del vehículo inválidos."
                );

        }


        conexion =
            await pool.getConnection();


        /* =================================================
           ERROR DENTRO DEL FORMULARIO
        ================================================= */

        async function renderizarError(
            mensaje,
            estadoHttp = 400
        ) {

            const modeloResultado =
                await conexion.query(
                    `
                    SELECT

                        id,
                        agencia_id,
                        marca,
                        nombre,
                        anio,
                        imagen,
                        estado

                    FROM modelos_vehiculos

                    WHERE
                        id = ?

                        AND agencia_id = ?

                    LIMIT 1
                    `,
                    [
                        modeloId,
                        agenciaId
                    ]
                );


            if (
                modeloResultado.length ===
                0
            ) {

                return res
                    .status(404)
                    .send(
                        "Modelo de vehículo no encontrado para esta agencia."
                    );

            }


            const sucursalSeleccionada =
                Number(
                    datos.sucursal_id
                );


            const sucursales =
                await conexion.query(
                    `
                    SELECT

                        id,
                        nombre,
                        es_principal,
                        estado

                    FROM sucursales

                    WHERE
                        agencia_id = ?

                        AND (

                            estado = 'activa'

                            OR id = ?

                        )

                    ORDER BY

                        es_principal DESC,

                        CASE
                            WHEN estado = 'activa'
                                THEN 0
                            ELSE 1
                        END,

                        nombre ASC
                    `,
                    [
                        agenciaId,

                        Number.isInteger(
                            sucursalSeleccionada
                        )
                            ? sucursalSeleccionada
                            : 0
                    ]
                );


            const usoResultado =
                await conexion.query(
                    `
                    SELECT
                        COUNT(*) AS total

                    FROM vehiculos

                    WHERE
                        agencia_id = ?

                        AND estado <> 'inactivo'
                    `,
                    [
                        agenciaId
                    ]
                );


            return res
                .status(
                    estadoHttp
                )
                .render(
                    "panel/vehiculos/editarUnidad",
                    {

                        titulo:
                            "Editar unidad",

                        subtituloPagina:
                            "Vehículos",

                        paginaActual:
                            "catalogo",

                        usuario:
                            req.usuarioAgencia,

                        agencia:
                            req.agencia,

                        suscripcion:
                            req.suscripcion,

                        plan:
                            req.plan,

                        modelo:
                            modeloResultado[0],

                        unidadEditar:
                        {

                            id:
                                unidadId,

                            agencia_id:
                                agenciaId,

                            modelo_id:
                                modeloId,

                            codigo_interno:
                                datos.codigo_interno,

                            placa:
                                datos.placa,

                            vin:
                                datos.vin,

                            color:
                                datos.color,

                            kilometraje:
                                datos.kilometraje,

                            sucursal_id:
                                datos.sucursal_id,

                            estado:
                                datos.estado

                        },

                        sucursales,

                        vehiculosActivos:
                            Number(
                                usoResultado[0]
                                    .total ||
                                0
                            ),

                        error:
                            mensaje

                    }
                );

        }


        /* =================================================
           VALIDACIONES
        ================================================= */

        if (
            !datos.codigo_interno
        ) {

            return await renderizarError(
                "El código interno del vehículo es obligatorio."
            );

        }


        if (
            datos.codigo_interno.length >
            50
        ) {

            return await renderizarError(
                "El código interno no puede superar los 50 caracteres."
            );

        }


        if (
            datos.placa.length >
            30
        ) {

            return await renderizarError(
                "La placa no puede superar los 30 caracteres."
            );

        }


        if (
            datos.vin.length >
            50
        ) {

            return await renderizarError(
                "El VIN no puede superar los 50 caracteres."
            );

        }


        if (
            datos.color.length >
            50
        ) {

            return await renderizarError(
                "El color no puede superar los 50 caracteres."
            );

        }


        const kilometraje =
            Number(
                datos.kilometraje
            );


        if (
            !Number.isInteger(
                kilometraje
            ) ||
            kilometraje < 0
        ) {

            return await renderizarError(
                "Introduce un kilometraje válido."
            );

        }


        const sucursalId =
            Number(
                datos.sucursal_id
            );


        if (
            !Number.isInteger(
                sucursalId
            ) ||
            sucursalId <= 0
        ) {

            return await renderizarError(
                "Selecciona una sucursal válida."
            );

        }


        const estadosValidos =
        [
            "disponible",
            "reservado",
            "alquilado",
            "mantenimiento",
            "inactivo"
        ];


        if (
            !estadosValidos.includes(
                datos.estado
            )
        ) {

            return await renderizarError(
                "El estado seleccionado no es válido."
            );

        }


        /* =================================================
           TRANSACCIÓN
        ================================================= */

        await conexion.beginTransaction();


        /* =================================================
           BLOQUEAR AGENCIA
        ================================================= */

        const agenciaResultado =
            await conexion.query(
                `
                SELECT
                    id

                FROM agencias

                WHERE
                    id = ?

                LIMIT 1

                FOR UPDATE
                `,
                [
                    agenciaId
                ]
            );


        if (
            agenciaResultado.length ===
            0
        ) {

            await conexion.rollback();


            return res
                .status(404)
                .send(
                    "Agencia no encontrada."
                );

        }


        /* =================================================
           UNIDAD ACTUAL
        ================================================= */

        const unidadActualResultado =
            await conexion.query(
                `
                SELECT

                    id,
                    agencia_id,
                    modelo_id,
                    sucursal_id,
                    estado

                FROM vehiculos

                WHERE
                    id = ?

                    AND agencia_id = ?

                    AND modelo_id = ?

                LIMIT 1

                FOR UPDATE
                `,
                [
                    unidadId,
                    agenciaId,
                    modeloId
                ]
            );


        if (
            unidadActualResultado.length ===
            0
        ) {

            await conexion.rollback();


            return res
                .status(404)
                .send(
                    "Unidad de vehículo no encontrada para esta agencia."
                );

        }


        const unidadActual =
            unidadActualResultado[0];


        /* =================================================
           MODELO
        ================================================= */

        const modeloResultado =
            await conexion.query(
                `
                SELECT

                    id,
                    estado

                FROM modelos_vehiculos

                WHERE
                    id = ?

                    AND agencia_id = ?

                LIMIT 1
                `,
                [
                    modeloId,
                    agenciaId
                ]
            );


        if (
            modeloResultado.length ===
            0
        ) {

            await conexion.rollback();


            return res
                .status(404)
                .send(
                    "Modelo de vehículo no encontrado para esta agencia."
                );

        }


        /* =================================================
           SUCURSAL
        ================================================= */

        const sucursalResultado =
            await conexion.query(
                `
                SELECT

                    id,
                    estado

                FROM sucursales

                WHERE
                    id = ?

                    AND agencia_id = ?

                LIMIT 1
                `,
                [
                    sucursalId,
                    agenciaId
                ]
            );


        if (
            sucursalResultado.length ===
            0
        ) {

            await conexion.rollback();


            return await renderizarError(
                "La sucursal seleccionada no existe.",
                409
            );

        }


        /*
         * Toda unidad que esté operativa debe
         * pertenecer a una sucursal activa.
         */

        if (
            datos.estado !==
                "inactivo" &&
            sucursalResultado[0]
                .estado !==
                "activa"
        ) {

            await conexion.rollback();


            return await renderizarError(
                "Un vehículo activo debe pertenecer a una sucursal activa.",
                409
            );

        }


        /* =================================================
           CÓDIGO INTERNO DUPLICADO
        ================================================= */

        const codigoDuplicado =
            await conexion.query(
                `
                SELECT
                    id

                FROM vehiculos

                WHERE
                    agencia_id = ?

                    AND LOWER(
                        codigo_interno
                    ) = LOWER(?)

                    AND id <> ?

                LIMIT 1
                `,
                [
                    agenciaId,
                    datos.codigo_interno,
                    unidadId
                ]
            );


        if (
            codigoDuplicado.length >
            0
        ) {

            await conexion.rollback();


            return await renderizarError(
                "Ya existe otro vehículo con ese código interno dentro de esta agencia.",
                409
            );

        }


        /* =================================================
           PLACA DUPLICADA
        ================================================= */

        if (
            datos.placa
        ) {

            const placaDuplicada =
                await conexion.query(
                    `
                    SELECT
                        id

                    FROM vehiculos

                    WHERE
                        agencia_id = ?

                        AND LOWER(
                            placa
                        ) = LOWER(?)

                        AND id <> ?

                    LIMIT 1
                    `,
                    [
                        agenciaId,
                        datos.placa,
                        unidadId
                    ]
                );


            if (
                placaDuplicada.length >
                0
            ) {

                await conexion.rollback();


                return await renderizarError(
                    "Ya existe otro vehículo con esa placa dentro de esta agencia.",
                    409
                );

            }

        }


        /* =================================================
           VIN DUPLICADO

           El VIN es único globalmente.
        ================================================= */

        if (
            datos.vin
        ) {

            const vinDuplicado =
                await conexion.query(
                    `
                    SELECT
                        id

                    FROM vehiculos

                    WHERE
                        LOWER(
                            vin
                        ) = LOWER(?)

                        AND id <> ?

                    LIMIT 1
                    `,
                    [
                        datos.vin,
                        unidadId
                    ]
                );


            if (
                vinDuplicado.length >
                0
            ) {

                await conexion.rollback();


                return await renderizarError(
                    "Ya existe otro vehículo registrado con ese VIN.",
                    409
                );

            }

        }


        /* =================================================
           REACTIVACIÓN
        ================================================= */

        const seEstaActivando =
            unidadActual.estado ===
                "inactivo" &&
            datos.estado !==
                "inactivo";


        if (
            seEstaActivando
        ) {

            /* ---------------------------------------------
               EL MODELO DEBE ESTAR ACTIVO
            --------------------------------------------- */

            if (
                modeloResultado[0]
                    .estado !==
                "activo"
            ) {

                await conexion.rollback();


                return await renderizarError(
                    "No se puede activar esta unidad porque el modelo del vehículo está inactivo.",
                    409
                );

            }


            /* ---------------------------------------------
               SUSCRIPCIÓN ACTUAL
            --------------------------------------------- */

            const suscripcionResultado =
                await conexion.query(
                    `
                    SELECT

                        s.estado
                            AS suscripcion_estado,

                        CASE

                            WHEN
                                s.fecha_inicio <=
                                    CURDATE()

                                AND (

                                    s.fecha_fin IS NULL

                                    OR s.fecha_fin >=
                                        CURDATE()

                                )

                            THEN 1

                            ELSE 0

                        END
                            AS fecha_vigente,

                        p.nombre
                            AS plan_nombre,

                        p.limite_vehiculos

                    FROM suscripciones s

                    INNER JOIN planes p

                        ON p.id =
                            s.plan_id

                    WHERE
                        s.agencia_id = ?

                    ORDER BY
                        s.id DESC

                    LIMIT 1
                    `,
                    [
                        agenciaId
                    ]
                );


            if (
                suscripcionResultado.length ===
                0
            ) {

                await conexion.rollback();


                return await renderizarError(
                    "La agencia no tiene una suscripción asociada.",
                    409
                );

            }


            const suscripcion =
                suscripcionResultado[0];


            const estadosConAcceso =
            [
                "prueba",
                "activa"
            ];


            if (
                !estadosConAcceso.includes(
                    suscripcion
                        .suscripcion_estado
                ) ||
                Number(
                    suscripcion
                        .fecha_vigente
                ) !== 1
            ) {

                await conexion.rollback();


                return await renderizarError(
                    "No se puede activar este vehículo porque la suscripción de la agencia no está vigente.",
                    409
                );

            }


            /* ---------------------------------------------
               LÍMITE DEL PLAN
            --------------------------------------------- */

            if (
                suscripcion
                    .limite_vehiculos !==
                null
            ) {

                const usoResultado =
                    await conexion.query(
                        `
                        SELECT
                            COUNT(*) AS total

                        FROM vehiculos

                        WHERE
                            agencia_id = ?

                            AND estado <>
                                'inactivo'

                            AND id <> ?
                        `,
                        [
                            agenciaId,
                            unidadId
                        ]
                    );


                const totalActivos =
                    Number(
                        usoResultado[0]
                            .total ||
                        0
                    );


                const limiteVehiculos =
                    Number(
                        suscripcion
                            .limite_vehiculos
                    );


                if (
                    totalActivos >=
                    limiteVehiculos
                ) {

                    await conexion.rollback();


                    return await renderizarError(
                        `No es posible activar este vehículo. El plan ${suscripcion.plan_nombre} permite un máximo de ${limiteVehiculos} vehículos activos.`,
                        409
                    );

                }

            }

        }


        /* =================================================
           ACTUALIZAR
        ================================================= */

        await conexion.query(
            `
            UPDATE vehiculos

            SET

                sucursal_id = ?,

                codigo_interno = ?,

                placa = ?,

                vin = ?,

                color = ?,

                kilometraje = ?,

                estado = ?

            WHERE
                id = ?

                AND agencia_id = ?

                AND modelo_id = ?
            `,
            [
                sucursalId,

                datos.codigo_interno,

                datos.placa ||
                    null,

                datos.vin ||
                    null,

                datos.color ||
                    null,

                kilometraje,

                datos.estado,

                unidadId,

                agenciaId,

                modeloId
            ]
        );


        await conexion.commit();


        return res.redirect(
            `/panel/vehiculos/modelos/${modeloId}/unidades?actualizada=1`
        );


    } catch (error) {

        if (conexion) {

            try {

                await conexion.rollback();

            } catch (_) {

                // Sin acción.
            }

        }


        console.error(
            "Error actualizando unidad desde el panel:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible actualizar la unidad del vehículo."
            );


    } finally {

        if (conexion) {

            conexion.release();

        }

    }

}

/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports =
{

    mostrarUnidadesModeloPanel,

    mostrarNuevaUnidadPanel,

    crearUnidadPanel,

    mostrarEditarUnidadPanel,

    actualizarUnidadPanel

};