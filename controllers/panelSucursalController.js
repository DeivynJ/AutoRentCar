/* =========================================================
   AUTORENTCAR
   SUCURSALES DEL PANEL DE AGENCIA
========================================================= */

const {
    pool
} = require(
    "../config/database"
);


/* =========================================================
   MOSTRAR SUCURSALES DE LA AGENCIA AUTENTICADA
========================================================= */

async function mostrarSucursalesPanel(
    req,
    res
) {

    let conexion;


    try {

        /*
         * SEGURIDAD MULTIAGENCIA
         *
         * La agencia se obtiene exclusivamente
         * del contexto autenticado.
         *
         * Nunca debe recibirse agencia_id desde:
         *
         * - req.params
         * - req.query
         * - req.body
         */

        const agenciaId =
            Number(
                req.agencia?.id
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


        conexion =
            await pool.getConnection();


        /* -------------------------------------------------
           SUCURSALES DE LA PROPIA AGENCIA
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
           RESUMEN
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


        const resumen =
        {

            total:
                sucursales.length,

            activas,

            inactivas

        };


        return res.render(
            "panel/sucursales/index",
            {

                titulo:
                    "Sucursales",

                subtituloPagina:
                    "Gestión de sucursales",

                paginaActual:
                    "sucursales",

                usuario:
                    req.usuarioAgencia,

                agencia:
                    req.agencia,

                suscripcion:
                    req.suscripcion,

                plan:
                    req.plan,

                sucursales,

                resumen,

                resultado:
                    String(
                        req.query?.resultado ||
                        ""
                    ),

                mensaje:
                    String(
                        req.query?.mensaje ||
                        ""
                    )

            }
        );


    } catch (error) {

        console.error(
            "Error mostrando sucursales del panel:",
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

async function mostrarNuevaSucursalPanel(
    req,
    res
) {

    let conexion;


    try {

        /* -------------------------------------------------
           AGENCIA SEGURA DEL CONTEXTO AUTENTICADO
        ------------------------------------------------- */

        const agenciaId =
            Number(
                req.agencia?.id
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


        conexion =
            await pool.getConnection();


        /* -------------------------------------------------
           USO ACTUAL DE SUCURSALES
        ------------------------------------------------- */

        const usoResultado =
            await conexion.query(
                `
                SELECT

                    COUNT(*) AS total,

                    SUM(
                        CASE
                            WHEN estado = 'activa'
                                THEN 1
                            ELSE 0
                        END
                    ) AS activas

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
                usoResultado[0]?.total ||
                0
            );


        const sucursalesActivas =
            Number(
                usoResultado[0]?.activas ||
                0
            );


        /* -------------------------------------------------
           LÍMITE DEL PLAN
        ------------------------------------------------- */

        const limiteConfigurado =
            req.plan?.limiteSucursales;


        const limiteSucursales =
            limiteConfigurado === null ||
            limiteConfigurado === undefined
                ? null
                : Number(
                    limiteConfigurado
                );


        const limiteAlcanzado =
            limiteSucursales !== null &&
            sucursalesActivas >=
                limiteSucursales;


        /*
         * Si ya alcanzó el límite:
         *
         * - puede registrar la información de una
         *   sucursal como INACTIVA;
         *
         * - NO puede crearla activa;
         *
         * - tampoco podrá activarla posteriormente
         *   hasta disponer de cupo.
         *
         * El POST volverá a validar todo esto.
         */

        const puedeCrearActiva =
            !limiteAlcanzado;


        return res.render(
            "panel/sucursales/nueva",
            {

                titulo:
                    "Nueva sucursal",

                subtituloPagina:
                    "Crear sucursal",

                paginaActual:
                    "sucursales",

                usuario:
                    req.usuarioAgencia,

                agencia:
                    req.agencia,

                suscripcion:
                    req.suscripcion,

                plan:
                    req.plan,

                totalSucursales,

                sucursalesActivas,

                limiteSucursales,

                limiteAlcanzado,

                puedeCrearActiva,

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
                        totalSucursales === 0
                            ? "1"
                            : "0",

                    estado:
                        puedeCrearActiva
                            ? "activa"
                            : "inactiva"

                }

            }
        );


    } catch (error) {

        console.error(
            "Error mostrando nueva sucursal del panel:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible cargar el formulario de nueva sucursal."
            );


    } finally {

        if (conexion) {

            conexion.release();

        }

    }

}

/* =========================================================
   CREAR SUCURSAL DESDE EL PANEL
========================================================= */

async function crearSucursalPanel(
    req,
    res
) {

    let conexion;

    let transaccionActiva =
        false;


    const agenciaId =
        Number(
            req.agencia?.id
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
                ""
            ).trim(),

        es_principal:
            req.body.es_principal ===
            "1"
                ? "1"
                : "0",

        estado:
            String(
                req.body.estado ||
                ""
            )
                .trim()
                .toLowerCase()

    };


    try {

        /* -------------------------------------------------
           CONTEXTO SEGURO DE AGENCIA
        ------------------------------------------------- */

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


        conexion =
            await pool.getConnection();


        /* -------------------------------------------------
           FUNCIÓN PARA MOSTRAR ERROR EN EL FORMULARIO
        ------------------------------------------------- */

        async function renderizarError(
            mensaje,
            estadoHttp = 400
        ) {

            const usoResultado =
                await conexion.query(
                    `
                    SELECT

                        COUNT(*) AS total,

                        SUM(
                            CASE
                                WHEN estado = 'activa'
                                    THEN 1
                                ELSE 0
                            END
                        ) AS activas

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
                    usoResultado[0]?.total ||
                    0
                );


            const sucursalesActivas =
                Number(
                    usoResultado[0]?.activas ||
                    0
                );


            const limiteConfigurado =
                req.plan?.limiteSucursales;


            const limiteSucursales =
                limiteConfigurado === null ||
                limiteConfigurado === undefined
                    ? null
                    : Number(
                        limiteConfigurado
                    );


            const limiteAlcanzado =
                limiteSucursales !== null &&
                sucursalesActivas >=
                    limiteSucursales;


            return res
                .status(
                    estadoHttp
                )
                .render(
                    "panel/sucursales/nueva",
                    {

                        titulo:
                            "Nueva sucursal",

                        subtituloPagina:
                            "Crear sucursal",

                        paginaActual:
                            "sucursales",

                        usuario:
                            req.usuarioAgencia,

                        agencia:
                            req.agencia,

                        suscripcion:
                            req.suscripcion,

                        plan:
                            req.plan,

                        totalSucursales,

                        sucursalesActivas,

                        limiteSucursales,

                        limiteAlcanzado,

                        puedeCrearActiva:
                            !limiteAlcanzado,

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
            datos.nombre.length >
            120
        ) {

            return await renderizarError(
                "El nombre de la sucursal no puede superar los 120 caracteres."
            );

        }


        if (
            datos.correo.length >
            150
        ) {

            return await renderizarError(
                "El correo no puede superar los 150 caracteres."
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


        if (
            datos.telefono.length >
            30
        ) {

            return await renderizarError(
                "El teléfono no puede superar los 30 caracteres."
            );

        }


        if (
            datos.whatsapp.length >
            30
        ) {

            return await renderizarError(
                "El número de WhatsApp no puede superar los 30 caracteres."
            );

        }


        if (
            datos.direccion.length >
            255
        ) {

            return await renderizarError(
                "La dirección no puede superar los 255 caracteres."
            );

        }


        if (
            datos.ciudad.length >
            100
        ) {

            return await renderizarError(
                "La ciudad no puede superar los 100 caracteres."
            );

        }


        if (
            datos.provincia.length >
            100
        ) {

            return await renderizarError(
                "La provincia no puede superar los 100 caracteres."
            );

        }


        if (!datos.pais) {

            return await renderizarError(
                "El país es obligatorio."
            );

        }


        if (
            datos.pais.length >
            100
        ) {

            return await renderizarError(
                "El país no puede superar los 100 caracteres."
            );

        }


        if (
            ![
                "activa",
                "inactiva"
            ].includes(
                datos.estado
            )
        ) {

            return await renderizarError(
                "Selecciona un estado válido para la sucursal."
            );

        }


        /* -------------------------------------------------
           INICIAR TRANSACCIÓN
        ------------------------------------------------- */

        await conexion.beginTransaction();

        transaccionActiva =
            true;


        /* -------------------------------------------------
           SUSCRIPCIÓN Y PLAN ACTUALES
           
           FOR UPDATE evita que dos operaciones simultáneas
           puedan consumir el mismo último cupo.
        ------------------------------------------------- */

        const suscripcionResultado =
            await conexion.query(
                `
                SELECT

                    s.id,
                    s.estado
                        AS suscripcion_estado,
                    s.fecha_inicio,
                    s.fecha_fin,

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

                FOR UPDATE
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

            transaccionActiva =
                false;


            return await renderizarError(
                "La agencia no tiene una suscripción válida para administrar sucursales.",
                403
            );

        }


        const suscripcion =
            suscripcionResultado[0];


        if (
            ![
                "activa",
                "prueba"
            ].includes(
                suscripcion.suscripcion_estado
            )
        ) {

            await conexion.rollback();

            transaccionActiva =
                false;


            return await renderizarError(
                "La suscripción actual no permite crear sucursales.",
                403
            );

        }


        /* -------------------------------------------------
           BLOQUEAR Y CONTAR SUCURSALES DE ESTA AGENCIA
        ------------------------------------------------- */

        const sucursalesActuales =
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

                FOR UPDATE
                `,
                [
                    agenciaId
                ]
            );


        const totalSucursales =
            sucursalesActuales.length;


        const sucursalesActivas =
            sucursalesActuales.filter(
                (sucursal) =>
                    sucursal.estado ===
                    "activa"
            ).length;


        const limiteSucursales =
            suscripcion.limite_sucursales ===
                null
                ? null
                : Number(
                    suscripcion.limite_sucursales
                );


        /* -------------------------------------------------
           POLÍTICA DEL PLAN
           
           SOLO LAS ACTIVAS CONSUMEN CUPO.
        ------------------------------------------------- */

        if (
            datos.estado ===
                "activa" &&
            limiteSucursales !==
                null &&
            sucursalesActivas >=
                limiteSucursales
        ) {

            await conexion.rollback();

            transaccionActiva =
                false;


            return await renderizarError(
                `Tu plan permite un máximo de ${limiteSucursales} ${
                    limiteSucursales === 1
                        ? "sucursal activa"
                        : "sucursales activas"
                }. Actualmente ya utilizas todo el cupo disponible.`,
                409
            );

        }


        /* -------------------------------------------------
           NOMBRE DUPLICADO DENTRO DE LA MISMA AGENCIA
        ------------------------------------------------- */

        const nombreDuplicado =
            sucursalesActuales.some(
                (sucursal) =>

                    String(
                        sucursal.nombre ||
                        ""
                    )
                        .trim()
                        .toLowerCase() ===

                    datos.nombre
                        .toLowerCase()
            );


        if (nombreDuplicado) {

            await conexion.rollback();

            transaccionActiva =
                false;


            return await renderizarError(
                "Ya existe una sucursal registrada con ese nombre.",
                409
            );

        }


        /* -------------------------------------------------
           SUCURSAL PRINCIPAL
        ------------------------------------------------- */

        const existePrincipal =
            sucursalesActuales.some(
                (sucursal) =>
                    Number(
                        sucursal.es_principal
                    ) === 1
            );


        let esPrincipal =
            datos.es_principal ===
            "1";


        /*
         * La primera sucursal debe convertirse
         * automáticamente en principal.
         */

        if (
            totalSucursales ===
            0
        ) {

            esPrincipal =
                true;

        }


        /*
         * Si por datos antiguos no existe principal,
         * la próxima sucursal activa se convierte
         * automáticamente en principal.
         */

        if (
            !existePrincipal &&
            datos.estado ===
                "activa"
        ) {

            esPrincipal =
                true;

        }


        /*
         * Una sucursal inactiva no debe desplazar
         * a una sucursal principal activa.
         */

        if (
            esPrincipal &&
            datos.estado !==
                "activa"
        ) {

            await conexion.rollback();

            transaccionActiva =
                false;


            return await renderizarError(
                "Una sucursal principal debe registrarse con estado Activa.",
                400
            );

        }


        /*
         * Si la nueva será principal, quitamos
         * la condición de principal solamente
         * dentro de ESTA agencia.
         */

        if (esPrincipal) {

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
           CREAR SUCURSAL
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

                esPrincipal
                    ? 1
                    : 0,

                datos.estado

            ]
        );


        /* -------------------------------------------------
           CONFIRMAR
        ------------------------------------------------- */

        await conexion.commit();

        transaccionActiva =
            false;


        return res.redirect(
            "/panel/sucursales" +
            "?resultado=exito" +
            "&mensaje=" +
            encodeURIComponent(
                "La sucursal fue registrada correctamente."
            )
        );


    } catch (error) {

        if (
            conexion &&
            transaccionActiva
        ) {

            try {

                await conexion.rollback();

            } catch (
                errorRollback
            ) {

                console.error(
                    "Error revirtiendo creación de sucursal:",
                    errorRollback
                );

            }

        }


        console.error(
            "Error creando sucursal desde el panel:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible registrar la sucursal."
            );


    } finally {

        if (conexion) {

            conexion.release();

        }

    }

}

/* =========================================================
   MOSTRAR EDITAR SUCURSAL
========================================================= */

async function mostrarEditarSucursalPanel(
    req,
    res
) {

    let conexion;


    try {

        /* -------------------------------------------------
           IDENTIFICADORES SEGUROS
        ------------------------------------------------- */

        const agenciaId =
            Number(
                req.agencia?.id
            );


        const sucursalId =
            Number(
                req.params.sucursalId
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
                sucursalId
            ) ||
            sucursalId <= 0
        ) {

            return res
                .status(400)
                .send(
                    "ID de sucursal inválido."
                );

        }


        conexion =
            await pool.getConnection();


        /* -------------------------------------------------
           SUCURSAL DE ESTA AGENCIA
        ------------------------------------------------- */

        const sucursalResultado =
            await conexion.query(
                `
                SELECT

                    id,
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

            return res
                .status(404)
                .send(
                    "Sucursal no encontrada."
                );

        }


        const sucursal =
            sucursalResultado[0];


        /* -------------------------------------------------
           USO ACTUAL DEL PLAN
        ------------------------------------------------- */

        const usoResultado =
            await conexion.query(
                `
                SELECT

                    COUNT(*) AS total,

                    SUM(
                        CASE
                            WHEN estado = 'activa'
                                THEN 1
                            ELSE 0
                        END
                    ) AS activas

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
                usoResultado[0]?.total ||
                0
            );


        const sucursalesActivas =
            Number(
                usoResultado[0]?.activas ||
                0
            );


        /* -------------------------------------------------
           LÍMITE DEL PLAN
        ------------------------------------------------- */

        const limiteConfigurado =
            req.plan?.limiteSucursales;


        const limiteSucursales =
            limiteConfigurado === null ||
            limiteConfigurado === undefined
                ? null
                : Number(
                    limiteConfigurado
                );


        /*
         * Esta variable solamente informa a la vista.
         *
         * La protección definitiva de reactivación
         * estará en el POST.
         */

        const puedeActivar =
            sucursal.estado ===
                "activa" ||
            limiteSucursales ===
                null ||
            sucursalesActivas <
                limiteSucursales;


        return res.render(
            "panel/sucursales/editar",
            {

                titulo:
                    "Editar sucursal",

                subtituloPagina:
                    "Modificar sucursal",

                paginaActual:
                    "sucursales",

                usuario:
                    req.usuarioAgencia,

                agencia:
                    req.agencia,

                suscripcion:
                    req.suscripcion,

                plan:
                    req.plan,

                sucursalEditar:
                    sucursal,

                totalSucursales,

                sucursalesActivas,

                limiteSucursales,

                puedeActivar,

                error:
                    null

            }
        );


    } catch (error) {

        console.error(
            "Error mostrando editar sucursal del panel:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible cargar la sucursal."
            );


    } finally {

        if (conexion) {

            conexion.release();

        }

    }

}

/* =========================================================
   ACTUALIZAR SUCURSAL DESDE EL PANEL
========================================================= */

async function actualizarSucursalPanel(
    req,
    res
) {

    let conexion;

    let transaccionActiva =
        false;


    const agenciaId =
        Number(
            req.agencia?.id
        );


    const sucursalId =
        Number(
            req.params.sucursalId
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
                ""
            ).trim(),

        es_principal:
            req.body.es_principal ===
            "1"
                ? "1"
                : "0",

        estado:
            String(
                req.body.estado ||
                ""
            )
                .trim()
                .toLowerCase()

    };


    try {

        /* -------------------------------------------------
           CONTEXTO SEGURO
        ------------------------------------------------- */

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
                sucursalId
            ) ||
            sucursalId <= 0
        ) {

            return res
                .status(400)
                .send(
                    "ID de sucursal inválido."
                );

        }


        conexion =
            await pool.getConnection();


        /* -------------------------------------------------
           MOSTRAR ERROR EN EL FORMULARIO
        ------------------------------------------------- */

        async function renderizarError(
            mensaje,
            estadoHttp = 400
        ) {

            const usoResultado =
                await conexion.query(
                    `
                    SELECT

                        COUNT(*) AS total,

                        SUM(
                            CASE
                                WHEN estado = 'activa'
                                    THEN 1
                                ELSE 0
                            END
                        ) AS activas

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
                    usoResultado[0]?.total ||
                    0
                );


            const sucursalesActivas =
                Number(
                    usoResultado[0]?.activas ||
                    0
                );


            const limiteConfigurado =
                req.plan?.limiteSucursales;


            const limiteSucursales =
                limiteConfigurado === null ||
                limiteConfigurado === undefined
                    ? null
                    : Number(
                        limiteConfigurado
                    );


            const puedeActivar =
                datos.estado ===
                    "activa" ||
                limiteSucursales ===
                    null ||
                sucursalesActivas <
                    limiteSucursales;


            return res
                .status(
                    estadoHttp
                )
                .render(
                    "panel/sucursales/editar",
                    {

                        titulo:
                            "Editar sucursal",

                        subtituloPagina:
                            "Modificar sucursal",

                        paginaActual:
                            "sucursales",

                        usuario:
                            req.usuarioAgencia,

                        agencia:
                            req.agencia,

                        suscripcion:
                            req.suscripcion,

                        plan:
                            req.plan,

                        sucursalEditar:
                        {

                            id:
                                sucursalId,

                            agencia_id:
                                agenciaId,

                            ...datos

                        },

                        totalSucursales,

                        sucursalesActivas,

                        limiteSucursales,

                        puedeActivar,

                        error:
                            mensaje

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
            datos.nombre.length >
            120
        ) {

            return await renderizarError(
                "El nombre de la sucursal no puede superar los 120 caracteres."
            );

        }


        if (
            datos.correo.length >
            150
        ) {

            return await renderizarError(
                "El correo no puede superar los 150 caracteres."
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


        if (
            datos.telefono.length >
            30
        ) {

            return await renderizarError(
                "El teléfono no puede superar los 30 caracteres."
            );

        }


        if (
            datos.whatsapp.length >
            30
        ) {

            return await renderizarError(
                "El número de WhatsApp no puede superar los 30 caracteres."
            );

        }


        if (
            datos.direccion.length >
            255
        ) {

            return await renderizarError(
                "La dirección no puede superar los 255 caracteres."
            );

        }


        if (
            datos.ciudad.length >
            100
        ) {

            return await renderizarError(
                "La ciudad no puede superar los 100 caracteres."
            );

        }


        if (
            datos.provincia.length >
            100
        ) {

            return await renderizarError(
                "La provincia no puede superar los 100 caracteres."
            );

        }


        if (!datos.pais) {

            return await renderizarError(
                "El país es obligatorio."
            );

        }


        if (
            datos.pais.length >
            100
        ) {

            return await renderizarError(
                "El país no puede superar los 100 caracteres."
            );

        }


        if (
            ![
                "activa",
                "inactiva"
            ].includes(
                datos.estado
            )
        ) {

            return await renderizarError(
                "Selecciona un estado válido para la sucursal."
            );

        }


        /* -------------------------------------------------
           INICIAR TRANSACCIÓN
        ------------------------------------------------- */

        await conexion.beginTransaction();

        transaccionActiva =
            true;


        /* -------------------------------------------------
           SUSCRIPCIÓN ACTUAL
           
           Se bloquea primero para mantener el mismo orden
           de bloqueo utilizado al crear sucursales.
        ------------------------------------------------- */

        const suscripcionResultado =
            await conexion.query(
                `
                SELECT

                    s.id,
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

                FOR UPDATE
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

            transaccionActiva =
                false;


            return await renderizarError(
                "La agencia no tiene una suscripción válida para administrar sucursales.",
                403
            );

        }


        const suscripcion =
            suscripcionResultado[0];


        if (
            ![
                "prueba",
                "activa"
            ].includes(
                suscripcion.suscripcion_estado
            )
        ) {

            await conexion.rollback();

            transaccionActiva =
                false;


            return await renderizarError(
                "La suscripción actual no permite modificar sucursales.",
                403
            );

        }


        /* -------------------------------------------------
           BLOQUEAR SUCURSALES DE ESTA AGENCIA
        ------------------------------------------------- */

        const sucursalesActuales =
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

                FOR UPDATE
                `,
                [
                    agenciaId
                ]
            );


        /* -------------------------------------------------
           LOCALIZAR SUCURSAL
           
           Nunca basta con sucursalId:
           debe pertenecer a req.agencia.id.
        ------------------------------------------------- */

        const sucursalActual =
            sucursalesActuales.find(
                (sucursal) =>
                    Number(
                        sucursal.id
                    ) ===
                    sucursalId
            );


        if (!sucursalActual) {

            await conexion.rollback();

            transaccionActiva =
                false;


            return res
                .status(404)
                .send(
                    "Sucursal no encontrada."
                );

        }


        /* -------------------------------------------------
           NOMBRE DUPLICADO
        ------------------------------------------------- */

        const nombreDuplicado =
            sucursalesActuales.some(
                (sucursal) =>

                    Number(
                        sucursal.id
                    ) !==
                        sucursalId &&

                    String(
                        sucursal.nombre ||
                        ""
                    )
                        .trim()
                        .toLowerCase() ===

                    datos.nombre
                        .toLowerCase()
            );


        if (nombreDuplicado) {

            await conexion.rollback();

            transaccionActiva =
                false;


            return await renderizarError(
                "Ya existe otra sucursal con ese nombre dentro de esta agencia.",
                409
            );

        }


        /* -------------------------------------------------
           PROTEGER PRINCIPAL ACTUAL
        ------------------------------------------------- */

        const actualmentePrincipal =
            Number(
                sucursalActual.es_principal
            ) === 1;


        if (
            actualmentePrincipal &&
            datos.es_principal !==
                "1"
        ) {

            await conexion.rollback();

            transaccionActiva =
                false;


            return await renderizarError(
                "Para cambiar la sucursal principal, edita otra sucursal y márcala como Principal. La sucursal principal actual cambiará automáticamente a Secundaria.",
                409
            );

        }


        /* -------------------------------------------------
           UNA PRINCIPAL DEBE PERMANECER ACTIVA
        ------------------------------------------------- */

        if (
            datos.es_principal ===
                "1" &&
            datos.estado !==
                "activa"
        ) {

            await conexion.rollback();

            transaccionActiva =
                false;


            return await renderizarError(
                "Una sucursal principal debe permanecer activa. Para inactivarla, primero establece otra sucursal como Principal.",
                409
            );

        }


        /* -------------------------------------------------
           VALIDAR REACTIVACIÓN
        ------------------------------------------------- */

        const seEstaActivando =
            sucursalActual.estado !==
                "activa" &&
            datos.estado ===
                "activa";


        if (seEstaActivando) {

            const limiteSucursales =
                suscripcion.limite_sucursales ===
                    null
                    ? null
                    : Number(
                        suscripcion.limite_sucursales
                    );


            if (
                limiteSucursales !==
                null
            ) {

                const totalActivas =
                    sucursalesActuales.filter(
                        (sucursal) =>

                            sucursal.estado ===
                                "activa" &&

                            Number(
                                sucursal.id
                            ) !==
                                sucursalId
                    ).length;


                if (
                    totalActivas >=
                    limiteSucursales
                ) {

                    await conexion.rollback();

                    transaccionActiva =
                        false;


                    const textoLimite =
                        limiteSucursales ===
                            1
                            ? "1 sucursal activa"
                            : `${limiteSucursales} sucursales activas`;


                    return await renderizarError(
                        `No es posible activar esta sucursal. El plan ${suscripcion.plan_nombre} permite un máximo de ${textoLimite}.`,
                        409
                    );

                }

            }

        }


        /* -------------------------------------------------
           CAMBIAR PRINCIPAL
        ------------------------------------------------- */

        if (
            datos.es_principal ===
                "1" &&
            !actualmentePrincipal
        ) {

            await conexion.query(
                `
                UPDATE sucursales

                SET
                    es_principal = 0

                WHERE
                    agencia_id = ?

                    AND id <> ?
                `,
                [
                    agenciaId,
                    sucursalId
                ]
            );

        }


        /* -------------------------------------------------
           ACTUALIZAR SUCURSAL
        ------------------------------------------------- */

        const actualizacionResultado =
            await conexion.query(
                `
                UPDATE sucursales

                SET

                    nombre = ?,

                    correo = ?,

                    telefono = ?,

                    whatsapp = ?,

                    direccion = ?,

                    ciudad = ?,

                    provincia = ?,

                    pais = ?,

                    es_principal = ?,

                    estado = ?

                WHERE
                    id = ?

                    AND agencia_id = ?
                `,
                [

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

                    datos.es_principal ===
                        "1"
                        ? 1
                        : 0,

                    datos.estado,

                    sucursalId,

                    agenciaId

                ]
            );


        if (
            Number(
                actualizacionResultado.affectedRows
            ) !== 1
        ) {

            await conexion.rollback();

            transaccionActiva =
                false;


            return res
                .status(404)
                .send(
                    "No fue posible localizar la sucursal para actualizarla."
                );

        }


        /* -------------------------------------------------
           CONFIRMAR
        ------------------------------------------------- */

        await conexion.commit();

        transaccionActiva =
            false;


        return res.redirect(
            "/panel/sucursales" +
            "?resultado=exito" +
            "&mensaje=" +
            encodeURIComponent(
                "La sucursal fue actualizada correctamente."
            )
        );


    } catch (error) {

        if (
            conexion &&
            transaccionActiva
        ) {

            try {

                await conexion.rollback();

            } catch (
                errorRollback
            ) {

                console.error(
                    "Error revirtiendo actualización de sucursal:",
                    errorRollback
                );

            }

        }


        console.error(
            "Error actualizando sucursal desde el panel:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible actualizar la sucursal."
            );


    } finally {

        if (conexion) {

            conexion.release();

        }

    }

}

module.exports = {

    mostrarSucursalesPanel,

    mostrarNuevaSucursalPanel,

    crearSucursalPanel,

    mostrarEditarSucursalPanel,

    actualizarSucursalPanel

};