const {
    pool
} = require(
    "../config/database"
);


/* =========================================================
   MOSTRAR SUCURSALES DE UNA AGENCIA
========================================================= */

async function mostrarSucursalesAgencia(
    req,
    res
) {

    let conexion;


    try {

        conexion =
            await pool.getConnection();


        const agenciaId =
            Number(
                req.params.id
            );


        if (
            !Number.isInteger(
                agenciaId
            ) ||
            agenciaId <= 0
        ) {

            return res
                .status(400)
                .send(
                    "ID de agencia inválido."
                );

        }


        /* -------------------------------------------------
           AGENCIA
        ------------------------------------------------- */

        const agenciaResultado =
            await conexion.query(
                `
                SELECT

                    id,
                    nombre,
                    logo,
                    estado

                FROM agencias

                WHERE id = ?

                LIMIT 1
                `,
                [
                    agenciaId
                ]
            );


        if (
            agenciaResultado.length === 0
        ) {

            return res
                .status(404)
                .send(
                    "Agencia no encontrada."
                );

        }


        const agencia =
            agenciaResultado[0];


        /* -------------------------------------------------
           SUSCRIPCIÓN Y PLAN ACTUAL
        ------------------------------------------------- */

        const suscripcionResultado =
            await conexion.query(
                `
                SELECT

                    s.id
                        AS suscripcion_id,

                    s.estado
                        AS suscripcion_estado,

                    p.id
                        AS plan_id,

                    p.nombre
                        AS plan_nombre,

                    p.limite_sucursales

                FROM suscripciones s

                INNER JOIN planes p
                    ON p.id = s.plan_id

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


        const suscripcion =
            suscripcionResultado.length
                ? suscripcionResultado[0]
                : null;


        /* -------------------------------------------------
           SUCURSALES
        ------------------------------------------------- */

        const sucursales =
            await conexion.query(
                `
                SELECT

                    id,
                    nombre,
                    correo,
                    telefono,
                    whatsapp,
                    direccion,
                    ciudad,
                    provincia,
                    pais,
                    es_principal,
                    estado,
                    fecha_creacion

                FROM sucursales

                WHERE
                    agencia_id = ?

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
                    agenciaId
                ]
            );


        /* -------------------------------------------------
           ESTADÍSTICAS
        ------------------------------------------------- */

        const activas =
            sucursales.filter(
                (sucursal) =>
                    sucursal.estado ===
                    "activa"
            ).length;


        const inactivas =
            sucursales.filter(
                (sucursal) =>
                    sucursal.estado ===
                    "inactiva"
            ).length;


        return res.render(
            "admin/sucursales/index",
            {

                titulo:
                    "Sucursales",

                subtituloPagina:
                    agencia.nombre,

                paginaActual:
                    "agencias",

                usuario:
                    req.session.usuario,

                agencia,

                suscripcion,

                sucursales,

                resumen:
{

    total:
        sucursales.length,

    activas,

    inactivas

},


mensajeExito:
    req.query.creada === "1"
        ? "La sucursal fue creada correctamente."
        : null

            }
        );


    } catch (error) {

        console.error(
            "Error mostrando sucursales:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible cargar las sucursales."
            );


    } finally {

        if (conexion) {

            conexion.release();

        }

    }

}

/* =========================================================
   MOSTRAR NUEVA SUCURSAL
========================================================= */

async function mostrarNuevaSucursal(
    req,
    res
) {

    let conexion;


    try {

        conexion =
            await pool.getConnection();


        const agenciaId =
            Number(
                req.params.id
            );


        if (
            !Number.isInteger(
                agenciaId
            ) ||
            agenciaId <= 0
        ) {

            return res
                .status(400)
                .send(
                    "ID de agencia inválido."
                );

        }


        const agenciaResultado =
            await conexion.query(
                `
                SELECT

                    id,
                    nombre,
                    logo,
                    estado

                FROM agencias

                WHERE id = ?

                LIMIT 1
                `,
                [
                    agenciaId
                ]
            );


        if (
            agenciaResultado.length === 0
        ) {

            return res
                .status(404)
                .send(
                    "Agencia no encontrada."
                );

        }


        const suscripcionResultado =
            await conexion.query(
                `
                SELECT

                    s.estado
                        AS suscripcion_estado,

                    p.nombre
                        AS plan_nombre,

                    p.limite_sucursales

                FROM suscripciones s

                INNER JOIN planes p
                    ON p.id = s.plan_id

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


        const totalResultado =
            await conexion.query(
                `
                SELECT

                    COUNT(*) AS total

                FROM sucursales

                WHERE
                    agencia_id = ?
                `,
                [
                    agenciaId
                ]
            );


        return res.render(
            "admin/sucursales/nueva",
            {

                titulo:
                    "Nueva sucursal",

                subtituloPagina:
                    "Crear sucursal",

                paginaActual:
                    "agencias",

                usuario:
                    req.session.usuario,

                agencia:
                    agenciaResultado[0],

                suscripcion:
                    suscripcionResultado.length
                        ? suscripcionResultado[0]
                        : null,

                totalSucursales:
                    Number(
                        totalResultado[0].total ||
                        0
                    ),

                error:
                    null,

                datos:
                {

                    nombre:
                        "",

                    correo:
                        "",

                    telefono:
                        "",

                    whatsapp:
                        "",

                    direccion:
                        "",

                    ciudad:
                        "",

                    provincia:
                        "",

                    pais:
                        "República Dominicana",

                    es_principal:
                        "0",

                    estado:
                        "activa"

                }

            }
        );


    } catch (error) {

        console.error(
            "Error mostrando nueva sucursal:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible cargar el formulario."
            );


    } finally {

        if (conexion) {

            conexion.release();

        }

    }

}


/* =========================================================
   CREAR SUCURSAL
========================================================= */

async function crearSucursal(
    req,
    res
) {

    let conexion;


    const agenciaId =
        Number(
            req.params.id
        );


    const datos =
    {

        nombre:
            String(
                req.body.nombre ||
                ""
            ).trim(),

        correo:
            String(
                req.body.correo ||
                ""
            ).trim(),

        telefono:
            String(
                req.body.telefono ||
                ""
            ).trim(),

        whatsapp:
            String(
                req.body.whatsapp ||
                ""
            ).trim(),

        direccion:
            String(
                req.body.direccion ||
                ""
            ).trim(),

        ciudad:
            String(
                req.body.ciudad ||
                ""
            ).trim(),

        provincia:
            String(
                req.body.provincia ||
                ""
            ).trim(),

        pais:
            String(
                req.body.pais ||
                "República Dominicana"
            ).trim(),

        es_principal:
            req.body.es_principal === "1"
                ? "1"
                : "0",

        estado:
            req.body.estado === "inactiva"
                ? "inactiva"
                : "activa"

    };


    try {

        conexion =
            await pool.getConnection();


        if (
            !Number.isInteger(
                agenciaId
            ) ||
            agenciaId <= 0
        ) {

            return res
                .status(400)
                .send(
                    "ID de agencia inválido."
                );

        }


        /* -------------------------------------------------
           CARGAR DATOS PARA MOSTRAR ERRORES
        ------------------------------------------------- */

        async function renderizarError(
            mensaje,
            estadoHttp = 400
        ) {

            const agenciaResultado =
                await conexion.query(
                    `
                    SELECT

                        id,
                        nombre,
                        logo,
                        estado

                    FROM agencias

                    WHERE id = ?

                    LIMIT 1
                    `,
                    [
                        agenciaId
                    ]
                );


            const suscripcionResultado =
                await conexion.query(
                    `
                    SELECT

                        s.estado
                            AS suscripcion_estado,

                        p.nombre
                            AS plan_nombre,

                        p.limite_sucursales

                    FROM suscripciones s

                    INNER JOIN planes p
                        ON p.id = s.plan_id

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


            const totalResultado =
                await conexion.query(
                    `
                    SELECT
                        COUNT(*) AS total

                    FROM sucursales

                    WHERE
                        agencia_id = ?
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
                    "admin/sucursales/nueva",
                    {

                        titulo:
                            "Nueva sucursal",

                        subtituloPagina:
                            "Crear sucursal",

                        paginaActual:
                            "agencias",

                        usuario:
                            req.session.usuario,

                        agencia:
                            agenciaResultado[0],

                        suscripcion:
                            suscripcionResultado.length
                                ? suscripcionResultado[0]
                                : null,

                        totalSucursales:
                            Number(
                                totalResultado[0].total ||
                                0
                            ),

                        error:
                            mensaje,

                        datos

                    }
                );

        }


        /* -------------------------------------------------
           VALIDACIONES BÁSICAS
        ------------------------------------------------- */

        if (!datos.nombre) {

            return await renderizarError(
                "El nombre de la sucursal es obligatorio."
            );

        }


        if (
            datos.nombre.length > 120
        ) {

            return await renderizarError(
                "El nombre de la sucursal no puede superar los 120 caracteres."
            );

        }


        if (
            datos.correo.length > 150
        ) {

            return await renderizarError(
                "El correo no puede superar los 150 caracteres."
            );

        }


        if (
            datos.telefono.length > 30 ||
            datos.whatsapp.length > 30
        ) {

            return await renderizarError(
                "El teléfono y WhatsApp no pueden superar los 30 caracteres."
            );

        }


        if (
            datos.direccion.length > 255
        ) {

            return await renderizarError(
                "La dirección no puede superar los 255 caracteres."
            );

        }


        if (
            datos.ciudad.length > 100 ||
            datos.provincia.length > 100 ||
            datos.pais.length > 100
        ) {

            return await renderizarError(
                "La ciudad, provincia y país no pueden superar los 100 caracteres."
            );

        }


        if (
            datos.correo &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                datos.correo
            )
        ) {

            return await renderizarError(
                "Introduce un correo electrónico válido."
            );

        }


        /* -------------------------------------------------
           INICIAR TRANSACCIÓN
        ------------------------------------------------- */

        await conexion.beginTransaction();


        /* -------------------------------------------------
           BLOQUEAR AGENCIA
        ------------------------------------------------- */

        const agenciaResultado =
            await conexion.query(
                `
                SELECT

                    id,
                    nombre

                FROM agencias

                WHERE id = ?

                LIMIT 1

                FOR UPDATE
                `,
                [
                    agenciaId
                ]
            );


        if (
            agenciaResultado.length === 0
        ) {

            await conexion.rollback();


            return res
                .status(404)
                .send(
                    "Agencia no encontrada."
                );

        }


        /* -------------------------------------------------
           EVITAR NOMBRE DUPLICADO
        ------------------------------------------------- */

        const duplicada =
            await conexion.query(
                `
                SELECT
                    id

                FROM sucursales

                WHERE
                    agencia_id = ?

                    AND LOWER(nombre) =
                        LOWER(?)

                LIMIT 1
                `,
                [
                    agenciaId,
                    datos.nombre
                ]
            );


        if (
            duplicada.length > 0
        ) {

            await conexion.rollback();


            return await renderizarError(
                "Ya existe una sucursal con ese nombre dentro de esta agencia.",
                409
            );

        }


        /* -------------------------------------------------
           TOTAL DE SUCURSALES
        ------------------------------------------------- */

        const totalResultado =
            await conexion.query(
                `
                SELECT
                    COUNT(*) AS total

                FROM sucursales

                WHERE
                    agencia_id = ?
                `,
                [
                    agenciaId
                ]
            );


        const totalSucursales =
            Number(
                totalResultado[0].total ||
                0
            );


        /* -------------------------------------------------
           VALIDAR PLAN SOLO SI SERÁ ACTIVA
        ------------------------------------------------- */

        if (
            datos.estado === "activa"
        ) {

            const suscripcionResultado =
                await conexion.query(
                    `
                    SELECT

                        s.id
                            AS suscripcion_id,

                        s.estado
                            AS suscripcion_estado,

                        p.nombre
                            AS plan_nombre,

                        p.limite_sucursales

                    FROM suscripciones s

                    INNER JOIN planes p
                        ON p.id = s.plan_id

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
                suscripcionResultado.length === 0
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
                    suscripcion.suscripcion_estado
                )
            ) {

                await conexion.rollback();


                return await renderizarError(
                    "No se puede crear una sucursal activa porque la suscripción de la agencia no está activa.",
                    409
                );

            }


            if (
                suscripcion.limite_sucursales !== null
            ) {

                const activasResultado =
                    await conexion.query(
                        `
                        SELECT
                            COUNT(*) AS total

                        FROM sucursales

                        WHERE
                            agencia_id = ?

                            AND estado = 'activa'
                        `,
                        [
                            agenciaId
                        ]
                    );


                const totalActivas =
                    Number(
                        activasResultado[0].total ||
                        0
                    );


                const limiteSucursales =
                    Number(
                        suscripcion.limite_sucursales
                    );


                if (
                    totalActivas >=
                    limiteSucursales
                ) {

                    await conexion.rollback();


                    const textoLimite =
                        limiteSucursales === 1
                            ? "1 sucursal activa"
                            : `${limiteSucursales} sucursales activas`;


                    return await renderizarError(
                        `La agencia alcanzó el límite de ${textoLimite} permitido por el plan ${suscripcion.plan_nombre}.`,
                        409
                    );

                }

            }

        }


        /* -------------------------------------------------
           PRIMERA SUCURSAL = PRINCIPAL
        ------------------------------------------------- */

        let esPrincipal =
            datos.es_principal === "1"
                ? 1
                : 0;


        if (
            totalSucursales === 0
        ) {

            esPrincipal =
                1;

        }


        /* -------------------------------------------------
           SI SERÁ PRINCIPAL, RETIRAR PRINCIPAL ANTERIOR
        ------------------------------------------------- */

        if (
            esPrincipal === 1 &&
            totalSucursales > 0
        ) {

            await conexion.query(
                `
                UPDATE sucursales

                SET
                    es_principal = 0

                WHERE
                    agencia_id = ?
                `,
                [
                    agenciaId
                ]
            );

        }


        /* -------------------------------------------------
           INSERTAR
        ------------------------------------------------- */

        await conexion.query(
            `
            INSERT INTO sucursales (

                agencia_id,

                nombre,

                correo,

                telefono,

                whatsapp,

                direccion,

                ciudad,

                provincia,

                pais,

                es_principal,

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
                ?
            )
            `,
            [

                agenciaId,

                datos.nombre,

                datos.correo ||
                    null,

                datos.telefono ||
                    null,

                datos.whatsapp ||
                    null,

                datos.direccion ||
                    null,

                datos.ciudad ||
                    null,

                datos.provincia ||
                    null,

                datos.pais,

                esPrincipal,

                datos.estado

            ]
        );


        await conexion.commit();


        return res.redirect(
            `/admin/agencias/${agenciaId}/sucursales?creada=1`
        );


    } catch (error) {

        if (conexion) {

            try {

                await conexion.rollback();

            } catch (_) {

                // No hacer nada.

            }

        }


        console.error(
            "Error creando sucursal:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible crear la sucursal."
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

module.exports = {

    mostrarSucursalesAgencia,

    mostrarNuevaSucursal,

    crearSucursal

};