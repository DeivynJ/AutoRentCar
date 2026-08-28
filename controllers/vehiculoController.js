const {
    pool
} = require(
    "../config/database"
);


/* =========================================================
   MOSTRAR VEHÍCULOS DE UNA AGENCIA
========================================================= */

async function mostrarVehiculosAgencia(
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
           SUSCRIPCIÓN Y PLAN
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

                    p.limite_vehiculos

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
           MODELOS
        ------------------------------------------------- */

        const modelos =
            await conexion.query(
                `
                SELECT

                    m.id,

                    m.nombre,

                    m.marca,

                    m.anio,

                    m.categoria,

                    m.precio_diario,

                    m.imagen,

                    m.estado,

                    COUNT(v.id)
                        AS total_unidades,

                    SUM(
                        CASE
                            WHEN v.estado <> 'inactivo'
                                THEN 1
                            ELSE 0
                        END
                    )
                        AS unidades_activas,

                    SUM(
                        CASE
                            WHEN v.estado = 'disponible'
                                THEN 1
                            ELSE 0
                        END
                    )
                        AS disponibles

                FROM modelos_vehiculos m

                LEFT JOIN vehiculos v

                    ON v.modelo_id = m.id

                    AND v.agencia_id =
                        m.agencia_id

                WHERE
                    m.agencia_id = ?

                GROUP BY

                    m.id,

                    m.nombre,

                    m.marca,

                    m.anio,

                    m.categoria,

                    m.precio_diario,

                    m.imagen,

                    m.estado

                ORDER BY

                    CASE
                        WHEN m.estado = 'activo'
                            THEN 0
                        ELSE 1
                    END,

                    m.marca ASC,

                    m.nombre ASC
                `,
                [
                    agenciaId
                ]
            );


        /* -------------------------------------------------
           RESUMEN DE FLOTA
        ------------------------------------------------- */

        const resumenVehiculos =
            await conexion.query(
                `
                SELECT

                    COUNT(*) AS total,

                    SUM(
                        CASE
                            WHEN estado <> 'inactivo'
                                THEN 1
                            ELSE 0
                        END
                    ) AS activos,

                    SUM(
                        CASE
                            WHEN estado = 'disponible'
                                THEN 1
                            ELSE 0
                        END
                    ) AS disponibles

                FROM vehiculos

                WHERE
                    agencia_id = ?
                `,
                [
                    agenciaId
                ]
            );


        const resumenModelos =
            await conexion.query(
                `
                SELECT
                    COUNT(*) AS total

                FROM modelos_vehiculos

                WHERE
                    agencia_id = ?
                `,
                [
                    agenciaId
                ]
            );


        const totalModelos =
            Number(
                resumenModelos[0].total ||
                0
            );


        const totalUnidades =
            Number(
                resumenVehiculos[0].total ||
                0
            );


        const unidadesActivas =
            Number(
                resumenVehiculos[0].activos ||
                0
            );


        const disponibles =
            Number(
                resumenVehiculos[0].disponibles ||
                0
            );


        return res.render(
            "admin/vehiculos/index",
            {

                titulo:
                    "Vehículos",

                subtituloPagina:
                    agencia.nombre,

                paginaActual:
                    "agencias",

                usuario:
                    req.session.usuario,

                agencia,

                suscripcion,

                modelos,

                resumen:
{

    modelos:
        totalModelos,

    unidades:
        totalUnidades,

    activas:
        unidadesActivas,

    disponibles

},


mensajeExito:

    req.query.modeloCreado === "1"

        ? "El modelo de vehículo fue creado correctamente."

        : req.query.unidadCreada === "1"

            ? "La unidad del vehículo fue agregada correctamente."

            : null

            }
        );


    } catch (error) {

        console.error(
            "Error mostrando vehículos:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible cargar los vehículos."
            );


    } finally {

        if (conexion) {

            conexion.release();

        }

    }

}

/* =========================================================
   MOSTRAR NUEVO MODELO
========================================================= */

async function mostrarNuevoModelo(
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


        return res.render(
            "admin/vehiculos/nuevoModelo",
            {

                titulo:
                    "Nuevo modelo",

                subtituloPagina:
                    "Registrar modelo",

                paginaActual:
                    "agencias",

                usuario:
                    req.session.usuario,

                agencia:
                    agenciaResultado[0],

                error:
                    null,

                datos:
                {

                    nombre:
                        "",

                    marca:
                        "",

                    anio:
                        "",

                    categoria:
                        "economico",

                    precio_diario:
                        "",

                    transmision:
                        "",

                    combustible:
                        "",

                    pasajeros:
                        "",

                    puertas:
                        "",

                    equipaje:
                        "",

                    aire_acondicionado:
                        "1",

                    destacado:
                        "0",

                    etiqueta:
                        "",

                    descripcion:
                        "",

                    estado:
                        "activo"

                }

            }
        );


    } catch (error) {

        console.error(
            "Error mostrando nuevo modelo:",
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
   CREAR MODELO DE VEHÍCULO
========================================================= */

async function crearModelo(
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

        marca:
            String(
                req.body.marca ||
                ""
            ).trim(),

        anio:
            String(
                req.body.anio ??
                ""
            ).trim(),

        categoria:
            String(
                req.body.categoria ||
                ""
            ).trim(),

        precio_diario:
            String(
                req.body.precio_diario ??
                ""
            ).trim(),

        transmision:
            String(
                req.body.transmision ||
                ""
            ).trim(),

        combustible:
            String(
                req.body.combustible ||
                ""
            ).trim(),

        pasajeros:
            String(
                req.body.pasajeros ??
                ""
            ).trim(),

        puertas:
            String(
                req.body.puertas ??
                ""
            ).trim(),

        equipaje:
            String(
                req.body.equipaje ??
                ""
            ).trim(),

        aire_acondicionado:
            req.body.aire_acondicionado === "0"
                ? "0"
                : "1",

        destacado:
            req.body.destacado === "1"
                ? "1"
                : "0",

        etiqueta:
            String(
                req.body.etiqueta ||
                ""
            ).trim(),

        descripcion:
            String(
                req.body.descripcion ||
                ""
            ).trim(),

        estado:
            req.body.estado === "inactivo"
                ? "inactivo"
                : "activo"

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
           FUNCIÓN DE ERROR
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


            if (
                agenciaResultado.length === 0
            ) {

                return res
                    .status(404)
                    .send(
                        "Agencia no encontrada."
                    );

            }


            return res
                .status(
                    estadoHttp
                )
                .render(
                    "admin/vehiculos/nuevoModelo",
                    {

                        titulo:
                            "Nuevo modelo",

                        subtituloPagina:
                            "Registrar modelo",

                        paginaActual:
                            "agencias",

                        usuario:
                            req.session.usuario,

                        agencia:
                            agenciaResultado[0],

                        error:
                            mensaje,

                        datos

                    }
                );

        }


        /* -------------------------------------------------
           VALIDACIONES
        ------------------------------------------------- */

        if (!datos.nombre) {

            return await renderizarError(
                "El nombre del modelo es obligatorio."
            );

        }


        if (!datos.marca) {

            return await renderizarError(
                "La marca del vehículo es obligatoria."
            );

        }


        if (
            datos.nombre.length > 120
        ) {

            return await renderizarError(
                "El nombre del modelo no puede superar los 120 caracteres."
            );

        }


        if (
            datos.marca.length > 80
        ) {

            return await renderizarError(
                "La marca no puede superar los 80 caracteres."
            );

        }


        const categoriasValidas =
        [
            "economico",
            "gama_media",
            "lujo"
        ];


        if (
            !categoriasValidas.includes(
                datos.categoria
            )
        ) {

            return await renderizarError(
                "La categoría seleccionada no es válida."
            );

        }


        const precioDiario =
            Number(
                datos.precio_diario
            );


        if (
            datos.precio_diario === "" ||
            !Number.isFinite(
                precioDiario
            ) ||
            precioDiario < 0
        ) {

            return await renderizarError(
                "Introduce un precio diario válido."
            );

        }


        /* -------------------------------------------------
           AÑO
        ------------------------------------------------- */

        let anio =
            null;


        if (
            datos.anio !== ""
        ) {

            anio =
                Number(
                    datos.anio
                );


            const anioMaximo =
                new Date()
                    .getFullYear() +
                1;


            if (
                !Number.isInteger(anio) ||
                anio < 1900 ||
                anio > anioMaximo
            ) {

                return await renderizarError(
                    `El año debe estar entre 1900 y ${anioMaximo}.`
                );

            }

        }


        /* -------------------------------------------------
           CAMPOS NUMÉRICOS OPCIONALES
        ------------------------------------------------- */

        function convertirEnteroOpcional(
            valor
        ) {

            if (
                valor === ""
            ) {

                return null;

            }


            const numero =
                Number(
                    valor
                );


            if (
                !Number.isInteger(
                    numero
                ) ||
                numero < 0
            ) {

                return false;

            }


            return numero;

        }


        const pasajeros =
            convertirEnteroOpcional(
                datos.pasajeros
            );


        const puertas =
            convertirEnteroOpcional(
                datos.puertas
            );


        const equipaje =
            convertirEnteroOpcional(
                datos.equipaje
            );


        if (
            pasajeros === false ||
            puertas === false ||
            equipaje === false
        ) {

            return await renderizarError(
                "Pasajeros, puertas y equipaje deben contener números enteros válidos."
            );

        }


        if (
            pasajeros !== null &&
            pasajeros > 255
        ) {

            return await renderizarError(
                "La cantidad de pasajeros no es válida."
            );

        }


        if (
            puertas !== null &&
            puertas > 255
        ) {

            return await renderizarError(
                "La cantidad de puertas no es válida."
            );

        }


        if (
            equipaje !== null &&
            equipaje > 255
        ) {

            return await renderizarError(
                "La cantidad de equipaje no es válida."
            );

        }


        if (
            datos.transmision.length > 50 ||
            datos.combustible.length > 50
        ) {

            return await renderizarError(
                "Transmisión y combustible no pueden superar los 50 caracteres."
            );

        }


        if (
            datos.etiqueta.length > 80
        ) {

            return await renderizarError(
                "La etiqueta no puede superar los 80 caracteres."
            );

        }


        if (
            datos.descripcion.length > 500
        ) {

            return await renderizarError(
                "La descripción no puede superar los 500 caracteres."
            );

        }


        /* -------------------------------------------------
           VALIDAR AGENCIA
        ------------------------------------------------- */

        const agenciaResultado =
            await conexion.query(
                `
                SELECT
                    id

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


        /* -------------------------------------------------
           EVITAR MODELO DUPLICADO
        ------------------------------------------------- */

        const duplicado =
            await conexion.query(
                `
                SELECT
                    id

                FROM modelos_vehiculos

                WHERE

                    agencia_id = ?

                    AND LOWER(marca) =
                        LOWER(?)

                    AND LOWER(nombre) =
                        LOWER(?)

                    AND COALESCE(anio, 0) =
                        COALESCE(?, 0)

                LIMIT 1
                `,
                [

                    agenciaId,

                    datos.marca,

                    datos.nombre,

                    anio

                ]
            );


        if (
            duplicado.length > 0
        ) {

            return await renderizarError(
                "Ese modelo de vehículo ya está registrado para esta agencia.",
                409
            );

        }


        /* -------------------------------------------------
           INSERTAR MODELO
        ------------------------------------------------- */

        await conexion.query(
            `
            INSERT INTO modelos_vehiculos (

                agencia_id,

                nombre,

                marca,

                anio,

                categoria,

                precio_diario,

                transmision,

                combustible,

                pasajeros,

                puertas,

                equipaje,

                aire_acondicionado,

                destacado,

                etiqueta,

                descripcion,

                imagen,

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
                NULL,
                ?
            )
            `,
            [

                agenciaId,

                datos.nombre,

                datos.marca,

                anio,

                datos.categoria,

                precioDiario,

                datos.transmision ||
                    null,

                datos.combustible ||
                    null,

                pasajeros,

                puertas,

                equipaje,

                datos.aire_acondicionado === "1"
                    ? 1
                    : 0,

                datos.destacado === "1"
                    ? 1
                    : 0,

                datos.etiqueta ||
                    null,

                datos.descripcion ||
                    null,

                datos.estado

            ]
        );


        return res.redirect(
            `/admin/agencias/${agenciaId}/vehiculos?modeloCreado=1`
        );


    } catch (error) {

        console.error(
            "Error creando modelo de vehículo:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible crear el modelo de vehículo."
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

async function mostrarNuevaUnidad(
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


        const modeloId =
            Number(
                req.params.modeloId
            );


        if (
            !Number.isInteger(agenciaId) ||
            agenciaId <= 0 ||
            !Number.isInteger(modeloId) ||
            modeloId <= 0
        ) {

            return res
                .status(400)
                .send(
                    "Datos de vehículo inválidos."
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


        /* -------------------------------------------------
           MODELO
        ------------------------------------------------- */

        const modeloResultado =
            await conexion.query(
                `
                SELECT

                    id,
                    agencia_id,
                    marca,
                    nombre,
                    anio,
                    categoria,
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
            modeloResultado.length === 0
        ) {

            return res
                .status(404)
                .send(
                    "Modelo de vehículo no encontrado."
                );

        }


        if (
            modeloResultado[0].estado !==
            "activo"
        ) {

            return res
                .status(409)
                .send(
                    "No se pueden agregar unidades a un modelo inactivo."
                );

        }


        /* -------------------------------------------------
           SUCURSALES ACTIVAS
        ------------------------------------------------- */

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


        /* -------------------------------------------------
           SUSCRIPCIÓN
        ------------------------------------------------- */

        const suscripcionResultado =
            await conexion.query(
                `
                SELECT

                    s.estado
                        AS suscripcion_estado,

                    p.nombre
                        AS plan_nombre,

                    p.limite_vehiculos

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
           USO ACTUAL DEL PLAN
        ------------------------------------------------- */

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
                usoResultado[0].total ||
                0
            );


        return res.render(
            "admin/vehiculos/nuevaUnidad",
            {

                titulo:
                    "Nueva unidad",

                subtituloPagina:
                    "Agregar vehículo",

                paginaActual:
                    "agencias",

                usuario:
                    req.session.usuario,

                agencia:
                    agenciaResultado[0],

                modelo:
                    modeloResultado[0],

                sucursales,

                suscripcion,

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
            "Error mostrando nueva unidad:",
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
   CREAR UNIDAD FÍSICA
========================================================= */

async function crearUnidad(
    req,
    res
) {

    let conexion;


    const agenciaId =
        Number(
            req.params.id
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

        conexion =
            await pool.getConnection();


        if (
            !Number.isInteger(agenciaId) ||
            agenciaId <= 0 ||
            !Number.isInteger(modeloId) ||
            modeloId <= 0
        ) {

            return res
                .status(400)
                .send(
                    "Datos de vehículo inválidos."
                );

        }


        /* -------------------------------------------------
           RENDERIZAR ERRORES DENTRO DEL FORMULARIO
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


            const modeloResultado =
                await conexion.query(
                    `
                    SELECT

                        id,
                        agencia_id,
                        marca,
                        nombre,
                        anio,
                        categoria,
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


            const suscripcionResultado =
                await conexion.query(
                    `
                    SELECT

                        s.estado
                            AS suscripcion_estado,

                        p.nombre
                            AS plan_nombre,

                        p.limite_vehiculos

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
                    "admin/vehiculos/nuevaUnidad",
                    {

                        titulo:
                            "Nueva unidad",

                        subtituloPagina:
                            "Agregar vehículo",

                        paginaActual:
                            "agencias",

                        usuario:
                            req.session.usuario,

                        agencia:
                            agenciaResultado[0],

                        modelo:
                            modeloResultado[0],

                        sucursales,

                        suscripcion:
                            suscripcionResultado.length
                                ? suscripcionResultado[0]
                                : null,

                        vehiculosActivos:
                            Number(
                                usoResultado[0].total ||
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

        if (
            !datos.codigo_interno
        ) {

            return await renderizarError(
                "El código interno del vehículo es obligatorio."
            );

        }


        if (
            datos.codigo_interno.length > 50
        ) {

            return await renderizarError(
                "El código interno no puede superar los 50 caracteres."
            );

        }


        if (
            datos.placa.length > 30
        ) {

            return await renderizarError(
                "La placa no puede superar los 30 caracteres."
            );

        }


        if (
            datos.vin.length > 50
        ) {

            return await renderizarError(
                "El VIN no puede superar los 50 caracteres."
            );

        }


        if (
            datos.color.length > 50
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


        /* -------------------------------------------------
           TRANSACCIÓN
        ------------------------------------------------- */

        await conexion.beginTransaction();


        /* -------------------------------------------------
           BLOQUEAR AGENCIA
        ------------------------------------------------- */

        const agenciaResultado =
            await conexion.query(
                `
                SELECT
                    id

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
           VALIDAR MODELO
        ------------------------------------------------- */

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
            modeloResultado.length === 0
        ) {

            await conexion.rollback();


            return res
                .status(404)
                .send(
                    "Modelo de vehículo no encontrado."
                );

        }


        if (
            modeloResultado[0].estado !==
            "activo"
        ) {

            await conexion.rollback();


            return await renderizarError(
                "No se pueden agregar unidades a un modelo inactivo.",
                409
            );

        }


        /* -------------------------------------------------
           VALIDAR SUCURSAL
        ------------------------------------------------- */

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
            sucursalResultado.length === 0 ||
            sucursalResultado[0].estado !==
                "activa"
        ) {

            await conexion.rollback();


            return await renderizarError(
                "La sucursal seleccionada no está disponible.",
                409
            );

        }


        /* -------------------------------------------------
           CÓDIGO INTERNO DUPLICADO
        ------------------------------------------------- */

        const codigoDuplicado =
            await conexion.query(
                `
                SELECT
                    id

                FROM vehiculos

                WHERE
                    agencia_id = ?

                    AND LOWER(codigo_interno) =
                        LOWER(?)

                LIMIT 1
                `,
                [
                    agenciaId,
                    datos.codigo_interno
                ]
            );


        if (
            codigoDuplicado.length > 0
        ) {

            await conexion.rollback();


            return await renderizarError(
                "Ya existe un vehículo con ese código interno dentro de esta agencia.",
                409
            );

        }


        /* -------------------------------------------------
           PLACA DUPLICADA
        ------------------------------------------------- */

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

                        AND LOWER(placa) =
                            LOWER(?)

                    LIMIT 1
                    `,
                    [
                        agenciaId,
                        datos.placa
                    ]
                );


            if (
                placaDuplicada.length > 0
            ) {

                await conexion.rollback();


                return await renderizarError(
                    "Ya existe un vehículo con esa placa dentro de esta agencia.",
                    409
                );

            }

        }


        /* -------------------------------------------------
           VIN DUPLICADO
        ------------------------------------------------- */

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
                        LOWER(vin) =
                            LOWER(?)

                    LIMIT 1
                    `,
                    [
                        datos.vin
                    ]
                );


            if (
                vinDuplicado.length > 0
            ) {

                await conexion.rollback();


                return await renderizarError(
                    "Ya existe un vehículo registrado con ese VIN.",
                    409
                );

            }

        }


        /* -------------------------------------------------
           VALIDAR PLAN SI CONSUME CUPO
        ------------------------------------------------- */

        if (
            datos.estado !== "inactivo"
        ) {

            const suscripcionResultado =
                await conexion.query(
                    `
                    SELECT

                        s.estado
                            AS suscripcion_estado,

                        p.nombre
                            AS plan_nombre,

                        p.limite_vehiculos

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
                    "No se puede agregar un vehículo activo porque la suscripción de la agencia no está activa.",
                    409
                );

            }


            if (
                suscripcion.limite_vehiculos !==
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

                            AND estado <> 'inactivo'
                        `,
                        [
                            agenciaId
                        ]
                    );


                const totalActivos =
                    Number(
                        usoResultado[0].total ||
                        0
                    );


                const limiteVehiculos =
                    Number(
                        suscripcion.limite_vehiculos
                    );


                if (
                    totalActivos >=
                    limiteVehiculos
                ) {

                    await conexion.rollback();


                    const textoLimite =
                        limiteVehiculos === 1
                            ? "1 vehículo activo"
                            : `${limiteVehiculos} vehículos activos`;


                    return await renderizarError(
                        `La agencia alcanzó el límite de ${textoLimite} permitido por el plan ${suscripcion.plan_nombre}.`,
                        409
                    );

                }

            }

        }


        /* -------------------------------------------------
           INSERTAR UNIDAD
        ------------------------------------------------- */

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
            `/admin/agencias/${agenciaId}/vehiculos?unidadCreada=1`
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
            "Error creando unidad física:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible crear la unidad del vehículo."
            );


    } finally {

        if (conexion) {

            conexion.release();

        }

    }

}

/* =========================================================
   MOSTRAR UNIDADES DE UN MODELO
========================================================= */

async function mostrarUnidadesModelo(
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


        const modeloId =
            Number(
                req.params.modeloId
            );


        if (
            !Number.isInteger(agenciaId) ||
            agenciaId <= 0 ||
            !Number.isInteger(modeloId) ||
            modeloId <= 0
        ) {

            return res
                .status(400)
                .send(
                    "Datos de vehículo inválidos."
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


        /* -------------------------------------------------
           MODELO
        ------------------------------------------------- */

        const modeloResultado =
            await conexion.query(
                `
                SELECT

                    id,
                    agencia_id,
                    marca,
                    nombre,
                    anio,
                    categoria,
                    precio_diario,
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
            modeloResultado.length === 0
        ) {

            return res
                .status(404)
                .send(
                    "Modelo de vehículo no encontrado."
                );

        }


        /* -------------------------------------------------
           SUSCRIPCIÓN
        ------------------------------------------------- */

        const suscripcionResultado =
            await conexion.query(
                `
                SELECT

                    s.estado
                        AS suscripcion_estado,

                    p.nombre
                        AS plan_nombre,

                    p.limite_vehiculos

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
           UNIDADES DEL MODELO
        ------------------------------------------------- */

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
                    ON s.id = v.sucursal_id

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


        /* -------------------------------------------------
           RESUMEN DEL MODELO
        ------------------------------------------------- */

        const total =
            unidades.length;


        const activas =
            unidades.filter(
                unidad =>
                    unidad.estado !==
                    "inactivo"
            ).length;


        const disponibles =
            unidades.filter(
                unidad =>
                    unidad.estado ===
                    "disponible"
            ).length;


        const inactivas =
            unidades.filter(
                unidad =>
                    unidad.estado ===
                    "inactivo"
            ).length;


        /* -------------------------------------------------
           USO GLOBAL DEL PLAN
        ------------------------------------------------- */

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
                usoResultado[0].total ||
                0
            );


        return res.render(
            "admin/vehiculos/unidades",
            {

                titulo:
                    "Unidades del modelo",

                subtituloPagina:
                    agenciaResultado[0].nombre,

                paginaActual:
                    "agencias",

                usuario:
                    req.session.usuario,

                agencia:
                    agenciaResultado[0],

                modelo:
                    modeloResultado[0],

                suscripcion,

                unidades,

                vehiculosActivos,

                resumen:
                {

                    total,

                    activas,

                    disponibles,

                    inactivas

                },

                mensajeExito:
                    req.query.actualizada === "1"
                        ? "La unidad del vehículo fue actualizada correctamente."
                        : null

            }
        );


    } catch (error) {

        console.error(
            "Error mostrando unidades del modelo:",
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
   MOSTRAR EDITAR UNIDAD
========================================================= */

async function mostrarEditarUnidad(
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


        const modeloId =
            Number(
                req.params.modeloId
            );


        const unidadId =
            Number(
                req.params.unidadId
            );


        if (
            !Number.isInteger(agenciaId) ||
            agenciaId <= 0 ||
            !Number.isInteger(modeloId) ||
            modeloId <= 0 ||
            !Number.isInteger(unidadId) ||
            unidadId <= 0
        ) {

            return res
                .status(400)
                .send(
                    "Datos del vehículo inválidos."
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


        const modeloResultado =
            await conexion.query(
                `
                SELECT

                    id,
                    marca,
                    nombre,
                    anio,
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
            modeloResultado.length === 0
        ) {

            return res
                .status(404)
                .send(
                    "Modelo de vehículo no encontrado."
                );

        }


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
            unidadResultado.length === 0
        ) {

            return res
                .status(404)
                .send(
                    "Unidad de vehículo no encontrada."
                );

        }


        const unidad =
            unidadResultado[0];


        /*
         * Se muestran todas las sucursales activas.
         *
         * Si la sucursal actual fue posteriormente
         * inactivada, también se muestra para no
         * romper el registro existente.
         */

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


        const suscripcionResultado =
            await conexion.query(
                `
                SELECT

                    s.estado
                        AS suscripcion_estado,

                    p.nombre
                        AS plan_nombre,

                    p.limite_vehiculos

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


        return res.render(
            "admin/vehiculos/editarUnidad",
            {

                titulo:
                    "Editar unidad",

                subtituloPagina:
                    "Modificar vehículo",

                paginaActual:
                    "agencias",

                usuario:
                    req.session.usuario,

                agencia:
                    agenciaResultado[0],

                modelo:
                    modeloResultado[0],

                unidadEditar:
                    unidad,

                sucursales,

                suscripcion:
                    suscripcionResultado.length
                        ? suscripcionResultado[0]
                        : null,

                vehiculosActivos:
                    Number(
                        usoResultado[0].total ||
                        0
                    ),

                error:
                    null

            }
        );


    } catch (error) {

        console.error(
            "Error mostrando editar unidad:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible cargar el vehículo."
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

async function actualizarUnidad(
    req,
    res
) {

    let conexion;


    const agenciaId =
        Number(
            req.params.id
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

        conexion =
            await pool.getConnection();


        if (
            !Number.isInteger(agenciaId) ||
            agenciaId <= 0 ||
            !Number.isInteger(modeloId) ||
            modeloId <= 0 ||
            !Number.isInteger(unidadId) ||
            unidadId <= 0
        ) {

            return res
                .status(400)
                .send(
                    "Datos del vehículo inválidos."
                );

        }


        /* -------------------------------------------------
           ERROR DENTRO DEL FORMULARIO
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


            const modeloResultado =
                await conexion.query(
                    `
                    SELECT

                        id,
                        marca,
                        nombre,
                        anio,
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


            const suscripcionResultado =
                await conexion.query(
                    `
                    SELECT

                        s.estado
                            AS suscripcion_estado,

                        p.nombre
                            AS plan_nombre,

                        p.limite_vehiculos

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
                    "admin/vehiculos/editarUnidad",
                    {

                        titulo:
                            "Editar unidad",

                        subtituloPagina:
                            "Modificar vehículo",

                        paginaActual:
                            "agencias",

                        usuario:
                            req.session.usuario,

                        agencia:
                            agenciaResultado[0],

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

                        suscripcion:
                            suscripcionResultado.length
                                ? suscripcionResultado[0]
                                : null,

                        vehiculosActivos:
                            Number(
                                usoResultado[0].total ||
                                0
                            ),

                        error:
                            mensaje

                    }
                );

        }


        /* -------------------------------------------------
           VALIDACIONES
        ------------------------------------------------- */

        if (
            !datos.codigo_interno
        ) {

            return await renderizarError(
                "El código interno del vehículo es obligatorio."
            );

        }


        if (
            datos.codigo_interno.length > 50
        ) {

            return await renderizarError(
                "El código interno no puede superar los 50 caracteres."
            );

        }


        if (
            datos.placa.length > 30
        ) {

            return await renderizarError(
                "La placa no puede superar los 30 caracteres."
            );

        }


        if (
            datos.vin.length > 50
        ) {

            return await renderizarError(
                "El VIN no puede superar los 50 caracteres."
            );

        }


        if (
            datos.color.length > 50
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


        /* -------------------------------------------------
           TRANSACCIÓN
        ------------------------------------------------- */

        await conexion.beginTransaction();


        /*
         * Bloqueamos la agencia para serializar
         * operaciones que consuman límite del plan.
         */

        const agenciaResultado =
            await conexion.query(
                `
                SELECT
                    id

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
           UNIDAD ACTUAL
        ------------------------------------------------- */

        const unidadActualResultado =
            await conexion.query(
                `
                SELECT

                    id,
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
            unidadActualResultado.length === 0
        ) {

            await conexion.rollback();


            return res
                .status(404)
                .send(
                    "Unidad de vehículo no encontrada."
                );

        }


        const unidadActual =
            unidadActualResultado[0];


        /* -------------------------------------------------
           MODELO
        ------------------------------------------------- */

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
            modeloResultado.length === 0
        ) {

            await conexion.rollback();


            return res
                .status(404)
                .send(
                    "Modelo de vehículo no encontrado."
                );

        }


        /* -------------------------------------------------
           SUCURSAL
        ------------------------------------------------- */

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
            sucursalResultado.length === 0
        ) {

            await conexion.rollback();


            return await renderizarError(
                "La sucursal seleccionada no existe.",
                409
            );

        }


        /*
         * Una unidad activa debe encontrarse en una
         * sucursal activa.
         *
         * Una unidad inactiva puede conservar una
         * sucursal que posteriormente fue inactivada.
         */

        if (
            datos.estado !== "inactivo" &&
            sucursalResultado[0].estado !==
                "activa"
        ) {

            await conexion.rollback();


            return await renderizarError(
                "Un vehículo activo debe pertenecer a una sucursal activa.",
                409
            );

        }


        /* -------------------------------------------------
           CÓDIGO DUPLICADO
        ------------------------------------------------- */

        const codigoDuplicado =
            await conexion.query(
                `
                SELECT
                    id

                FROM vehiculos

                WHERE
                    agencia_id = ?

                    AND LOWER(codigo_interno) =
                        LOWER(?)

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
            codigoDuplicado.length > 0
        ) {

            await conexion.rollback();


            return await renderizarError(
                "Ya existe otro vehículo con ese código interno dentro de esta agencia.",
                409
            );

        }


        /* -------------------------------------------------
           PLACA DUPLICADA
        ------------------------------------------------- */

        if (datos.placa) {

            const placaDuplicada =
                await conexion.query(
                    `
                    SELECT
                        id

                    FROM vehiculos

                    WHERE
                        agencia_id = ?

                        AND LOWER(placa) =
                            LOWER(?)

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
                placaDuplicada.length > 0
            ) {

                await conexion.rollback();


                return await renderizarError(
                    "Ya existe otro vehículo con esa placa dentro de esta agencia.",
                    409
                );

            }

        }


        /* -------------------------------------------------
           VIN DUPLICADO
        ------------------------------------------------- */

        if (datos.vin) {

            const vinDuplicado =
                await conexion.query(
                    `
                    SELECT
                        id

                    FROM vehiculos

                    WHERE
                        LOWER(vin) =
                            LOWER(?)

                        AND id <> ?

                    LIMIT 1
                    `,
                    [
                        datos.vin,
                        unidadId
                    ]
                );


            if (
                vinDuplicado.length > 0
            ) {

                await conexion.rollback();


                return await renderizarError(
                    "Ya existe otro vehículo registrado con ese VIN.",
                    409
                );

            }

        }


        /* -------------------------------------------------
           REACTIVACIÓN
        ------------------------------------------------- */

        const seEstaActivando =
            unidadActual.estado ===
                "inactivo" &&
            datos.estado !==
                "inactivo";


        if (seEstaActivando) {

            /*
             * No reactivamos unidades de modelos
             * inactivos.
             */

            if (
                modeloResultado[0].estado !==
                "activo"
            ) {

                await conexion.rollback();


                return await renderizarError(
                    "No se puede activar esta unidad porque el modelo del vehículo está inactivo.",
                    409
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

                        p.limite_vehiculos

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
                    "No se puede activar este vehículo porque la suscripción de la agencia no está activa.",
                    409
                );

            }


            if (
                suscripcion.limite_vehiculos !==
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

                            AND estado <> 'inactivo'

                            AND id <> ?
                        `,
                        [
                            agenciaId,
                            unidadId
                        ]
                    );


                const totalActivos =
                    Number(
                        usoResultado[0].total ||
                        0
                    );


                const limiteVehiculos =
                    Number(
                        suscripcion.limite_vehiculos
                    );


                if (
                    totalActivos >=
                    limiteVehiculos
                ) {

                    await conexion.rollback();


                    const textoLimite =
                        limiteVehiculos === 1
                            ? "1 vehículo activo"
                            : `${limiteVehiculos} vehículos activos`;


                    return await renderizarError(
                        `No es posible activar este vehículo. El plan ${suscripcion.plan_nombre} permite un máximo de ${textoLimite}.`,
                        409
                    );

                }

            }

        }


        /* -------------------------------------------------
           ACTUALIZAR UNIDAD
        ------------------------------------------------- */

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
            `/admin/agencias/${agenciaId}/vehiculos/modelos/${modeloId}/unidades?actualizada=1`
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
            "Error actualizando unidad física:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible actualizar el vehículo."
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

    mostrarVehiculosAgencia,

    mostrarNuevoModelo,

    crearModelo,

    mostrarNuevaUnidad,

    crearUnidad,

    mostrarUnidadesModelo,

    mostrarEditarUnidad,

    actualizarUnidad

};