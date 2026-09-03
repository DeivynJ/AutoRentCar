/* =========================================================
   AUTORENTCAR - CATÁLOGO DEL PANEL DE AGENCIA
========================================================= */

const fs =
    require(
        "fs"
    );


const path =
    require(
        "path"
    );

const {
    pool
} = require(
    "../config/database"
);

/* =========================================================
   MOSTRAR CATÁLOGO DE LA AGENCIA AUTENTICADA
========================================================= */

async function mostrarCatalogoPanel(
    req,
    res
) {

    let conexion;


    try {

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


        /* =================================================
           MODELOS DE LA PROPIA AGENCIA
        ================================================= */

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

                    m.transmision,

                    m.combustible,

                    m.pasajeros,

                    m.puertas,

                    m.equipaje,

                    m.aire_acondicionado,

                    m.destacado,

                    m.etiqueta,

                    m.descripcion,

                    m.imagen,

                    m.estado,

                    COUNT(
                        v.id
                    )
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

                    ON v.modelo_id =
                        m.id

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

                    m.transmision,

                    m.combustible,

                    m.pasajeros,

                    m.puertas,

                    m.equipaje,

                    m.aire_acondicionado,

                    m.destacado,

                    m.etiqueta,

                    m.descripcion,

                    m.imagen,

                    m.estado

                ORDER BY

                    CASE
                        WHEN m.estado = 'activo'
                            THEN 0
                        ELSE 1
                    END,

                    m.destacado DESC,

                    m.marca ASC,

                    m.nombre ASC
                `,
                [
                    agenciaId
                ]
            );


        /* =================================================
           RESUMEN
        ================================================= */

        const resumen =
        {

            modelos:
                modelos.length,

            modelosActivos:
                modelos.filter(
                    (modelo) =>
                        modelo.estado ===
                        "activo"
                ).length,

            unidadesActivas:
                modelos.reduce(
                    (
                        total,
                        modelo
                    ) =>
                        total +
                        Number(
                            modelo.unidades_activas ||
                            0
                        ),
                    0
                ),

            disponibles:
                modelos.reduce(
                    (
                        total,
                        modelo
                    ) =>
                        total +
                        Number(
                            modelo.disponibles ||
                            0
                        ),
                    0
                )

        };


        return res.render(
            "panel/catalogo/index",
            {

                titulo:
                    "Catálogo",

                subtituloPagina:
                    "Gestión de vehículos",

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

                modelos,
                
            resumen,

mensajeExito:

    req.query.modeloCreado ===
        "1"

        ? "El modelo de vehículo fue creado correctamente."

        : req.query.modeloActualizado ===
            "1"

            ? "El modelo de vehículo fue actualizado correctamente."

            : null
    }
);


    } catch (error) {

        console.error(
            "Error mostrando catálogo de la agencia:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible cargar el catálogo de la agencia."
            );


    } finally {

        if (conexion) {

            conexion.release();

        }

    }

}

/* =========================================================
   DATOS INICIALES DEL FORMULARIO
========================================================= */

function obtenerDatosModeloIniciales() {

    return {

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

    };

}


/* =========================================================
   MOSTRAR NUEVO MODELO
========================================================= */

async function mostrarNuevoModeloPanel(
    req,
    res
) {

    return res.render(
        "panel/catalogo/nuevoModelo",
        {

            titulo:
                "Nuevo modelo",

            subtituloPagina:
                "Catálogo",

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

            error:
                null,

            datos:
                obtenerDatosModeloIniciales()

        }
    );

}


/* =========================================================
   CREAR MODELO
========================================================= */

async function crearModeloPanel(
    req,
    res
) {

    let conexion;


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
            req.body.aire_acondicionado ===
                "0"
                ? "0"
                : "1",

        destacado:
            req.body.destacado ===
                "1"
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
            req.body.estado ===
                "inactivo"
                ? "inactivo"
                : "activo"

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


        conexion =
            await pool.getConnection();


        /* =================================================
           RENDERIZAR ERROR
        ================================================= */

        function renderizarError(
            mensaje,
            estadoHttp = 400
        ) {

            return res
                .status(
                    estadoHttp
                )
                .render(
                    "panel/catalogo/nuevoModelo",
                    {

                        titulo:
                            "Nuevo modelo",

                        subtituloPagina:
                            "Catálogo",

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

                        error:
                            mensaje,

                        datos

                    }
                );

        }


        /* =================================================
           VALIDACIONES BÁSICAS
        ================================================= */

        if (!datos.marca) {

            return renderizarError(
                "La marca del vehículo es obligatoria."
            );

        }


        if (!datos.nombre) {

            return renderizarError(
                "El nombre del modelo es obligatorio."
            );

        }


        if (
            datos.marca.length >
            80
        ) {

            return renderizarError(
                "La marca no puede superar los 80 caracteres."
            );

        }


        if (
            datos.nombre.length >
            120
        ) {

            return renderizarError(
                "El nombre del modelo no puede superar los 120 caracteres."
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

            return renderizarError(
                "La categoría seleccionada no es válida."
            );

        }


        /* =================================================
           PRECIO
        ================================================= */

        const precioDiario =
            Number(
                datos.precio_diario
            );


        if (
            datos.precio_diario ===
                "" ||
            !Number.isFinite(
                precioDiario
            ) ||
            precioDiario < 0
        ) {

            return renderizarError(
                "Introduce un precio diario válido."
            );

        }


        /* =================================================
           AÑO
        ================================================= */

        let anio =
            null;


        if (
            datos.anio !==
            ""
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
                !Number.isInteger(
                    anio
                ) ||
                anio < 1900 ||
                anio > anioMaximo
            ) {

                return renderizarError(
                    `El año debe estar entre 1900 y ${anioMaximo}.`
                );

            }

        }


        /* =================================================
           CAMPOS NUMÉRICOS OPCIONALES
        ================================================= */

        function enteroOpcional(
            valor
        ) {

            if (
                valor ===
                ""
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
                numero < 0 ||
                numero > 255
            ) {

                return false;

            }


            return numero;

        }


        const pasajeros =
            enteroOpcional(
                datos.pasajeros
            );


        const puertas =
            enteroOpcional(
                datos.puertas
            );


        const equipaje =
            enteroOpcional(
                datos.equipaje
            );


        if (
            pasajeros === false ||
            puertas === false ||
            equipaje === false
        ) {

            return renderizarError(
                "Pasajeros, puertas y equipaje deben contener números enteros válidos."
            );

        }


        if (
            datos.transmision.length >
                50 ||
            datos.combustible.length >
                50
        ) {

            return renderizarError(
                "Transmisión y combustible no pueden superar los 50 caracteres."
            );

        }


        if (
            datos.etiqueta.length >
            80
        ) {

            return renderizarError(
                "La etiqueta no puede superar los 80 caracteres."
            );

        }


        if (
            datos.descripcion.length >
            500
        ) {

            return renderizarError(
                "La descripción no puede superar los 500 caracteres."
            );

        }


        /* =================================================
           EVITAR DUPLICADOS DENTRO DE LA MISMA AGENCIA
        ================================================= */

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
            duplicado.length >
            0
        ) {

            return renderizarError(
                "Ese modelo de vehículo ya está registrado para esta agencia.",
                409
            );

        }


        /* =================================================
           INSERTAR
        ================================================= */

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

                datos.aire_acondicionado ===
                    "1"
                    ? 1
                    : 0,

                datos.destacado ===
                    "1"
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
            "/panel/catalogo?modeloCreado=1"
        );


    } catch (error) {

        console.error(
            "Error creando modelo desde el panel de agencia:",
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
   GUARDAR IMAGEN PRINCIPAL DEL MODELO
========================================================= */

async function guardarImagenModeloPanel(
    archivo,
    agenciaId,
    modeloId
) {

    const extensiones =
    {

        "image/jpeg":
            ".jpg",

        "image/png":
            ".png",

        "image/webp":
            ".webp"

    };


    const extension =
        extensiones[
            archivo.mimetype
        ];


    if (!extension) {

        throw new Error(
            "Formato de imagen no permitido."
        );

    }


    const directorio =
        path.join(
            __dirname,
            "..",
            "img",
            "agencias",
            String(
                agenciaId
            ),
            "vehiculos",
            "modelos",
            String(
                modeloId
            )
        );


    await fs.promises.mkdir(
        directorio,
        {
            recursive:
                true
        }
    );


    const nombreArchivo =
        `principal-${Date.now()}${extension}`;


    const rutaFisica =
        path.join(
            directorio,
            nombreArchivo
        );


    await fs.promises.writeFile(
        rutaFisica,
        archivo.buffer
    );


    return {

        rutaFisica,

        rutaPublica:
            `/img/agencias/${agenciaId}/vehiculos/modelos/${modeloId}/${nombreArchivo}`

    };

}


/* =========================================================
   ELIMINAR IMAGEN ANTERIOR
========================================================= */

async function eliminarImagenModeloPanel(
    rutaPublica
) {

    if (
        !rutaPublica ||
        !rutaPublica.startsWith(
            "/img/agencias/"
        )
    ) {

        return;

    }


    const rutaRelativa =
        rutaPublica.replace(
            /^\/+/,
            ""
        );


    const rutaFisica =
        path.join(
            __dirname,
            "..",
            ...rutaRelativa.split(
                "/"
            )
        );


    try {

        await fs.promises.unlink(
            rutaFisica
        );


    } catch (error) {

        if (
            error.code !==
            "ENOENT"
        ) {

            console.error(
                "Error eliminando imagen anterior del modelo:",
                error
            );

        }

    }

}

/* =========================================================
   MOSTRAR EDITAR MODELO
========================================================= */

async function mostrarEditarModeloPanel(
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
           MODELO DE ESTA AGENCIA
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
           RESUMEN DE UNIDADES
        ================================================= */

        const resumenResultado =
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
                    ) AS activas,

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

                    AND modelo_id = ?
                `,
                [
                    agenciaId,
                    modeloId
                ]
            );


        return res.render(
            "panel/catalogo/editarModelo",
            {

                titulo:
                    "Editar modelo",

                subtituloPagina:
                    "Catálogo",

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

                modeloEditar:
                    modeloResultado[0],

                resumenUnidades:
                {

                    total:
                        Number(
                            resumenResultado[0]
                                .total ||
                            0
                        ),

                    activas:
                        Number(
                            resumenResultado[0]
                                .activas ||
                            0
                        ),

                    disponibles:
                        Number(
                            resumenResultado[0]
                                .disponibles ||
                            0
                        )

                },

                error:
                    null

            }
        );


    } catch (error) {

        console.error(
            "Error mostrando editar modelo desde el panel:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible cargar el modelo de vehículo."
            );


    } finally {

        if (conexion) {

            conexion.release();

        }

    }

}

/* =========================================================
   ACTUALIZAR MODELO DESDE EL PANEL DE AGENCIA
========================================================= */

async function actualizarModeloPanel(
    req,
    res
) {

    let conexion;

    let nuevaImagenGuardada =
        null;


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
            req.body.aire_acondicionado ===
                "0"
                ? "0"
                : "1",

        destacado:
            req.body.destacado ===
                "1"
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
            req.body.estado ===
                "inactivo"
                ? "inactivo"
                : "activo"

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
           MODELO ACTUAL
        ================================================= */

        const modeloActualResultado =
            await conexion.query(
                `
                SELECT

                    id,
                    agencia_id,
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
            modeloActualResultado.length ===
            0
        ) {

            return res
                .status(404)
                .send(
                    "Modelo de vehículo no encontrado para esta agencia."
                );

        }


        const modeloActual =
            modeloActualResultado[0];


        /* =================================================
           FUNCIÓN PARA MOSTRAR ERRORES
        ================================================= */

        async function renderizarError(
            mensaje,
            estadoHttp = 400
        ) {

            const resumenResultado =
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
                        ) AS activas,

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

                        AND modelo_id = ?
                    `,
                    [
                        agenciaId,
                        modeloId
                    ]
                );


            return res
                .status(
                    estadoHttp
                )
                .render(
                    "panel/catalogo/editarModelo",
                    {

                        titulo:
                            "Editar modelo",

                        subtituloPagina:
                            "Catálogo",

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

                        modeloEditar:
                        {

                            id:
                                modeloId,

                            agencia_id:
                                agenciaId,

                            imagen:
                                modeloActual.imagen,

                            ...datos

                        },

                        resumenUnidades:
                        {

                            total:
                                Number(
                                    resumenResultado[0]
                                        .total ||
                                    0
                                ),

                            activas:
                                Number(
                                    resumenResultado[0]
                                        .activas ||
                                    0
                                ),

                            disponibles:
                                Number(
                                    resumenResultado[0]
                                        .disponibles ||
                                    0
                                )

                        },

                        error:
                            mensaje

                    }
                );

        }


        /* =================================================
           ERROR DEL MIDDLEWARE DE IMAGEN
        ================================================= */

        if (
            req.errorSubidaImagen
        ) {

            return await renderizarError(
                req.errorSubidaImagen
            );

        }


        /* =================================================
           VALIDACIONES
        ================================================= */

        if (!datos.marca) {

            return await renderizarError(
                "La marca del vehículo es obligatoria."
            );

        }


        if (!datos.nombre) {

            return await renderizarError(
                "El nombre del modelo es obligatorio."
            );

        }


        if (
            datos.marca.length >
            80
        ) {

            return await renderizarError(
                "La marca no puede superar los 80 caracteres."
            );

        }


        if (
            datos.nombre.length >
            120
        ) {

            return await renderizarError(
                "El nombre del modelo no puede superar los 120 caracteres."
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
            datos.precio_diario ===
                "" ||
            !Number.isFinite(
                precioDiario
            ) ||
            precioDiario < 0
        ) {

            return await renderizarError(
                "Introduce un precio diario válido."
            );

        }


        /* =================================================
           AÑO
        ================================================= */

        let anio =
            null;


        if (
            datos.anio !==
            ""
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
                !Number.isInteger(
                    anio
                ) ||
                anio < 1900 ||
                anio > anioMaximo
            ) {

                return await renderizarError(
                    `El año debe estar entre 1900 y ${anioMaximo}.`
                );

            }

        }


        /* =================================================
           ENTEROS OPCIONALES
        ================================================= */

        function enteroOpcional(
            valor
        ) {

            if (
                valor ===
                ""
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
                numero < 0 ||
                numero > 255
            ) {

                return false;

            }


            return numero;

        }


        const pasajeros =
            enteroOpcional(
                datos.pasajeros
            );


        const puertas =
            enteroOpcional(
                datos.puertas
            );


        const equipaje =
            enteroOpcional(
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
            datos.transmision.length >
                50 ||
            datos.combustible.length >
                50
        ) {

            return await renderizarError(
                "Transmisión y combustible no pueden superar los 50 caracteres."
            );

        }


        if (
            datos.etiqueta.length >
            80
        ) {

            return await renderizarError(
                "La etiqueta no puede superar los 80 caracteres."
            );

        }


        if (
            datos.descripcion.length >
            500
        ) {

            return await renderizarError(
                "La descripción no puede superar los 500 caracteres."
            );

        }


        /* =================================================
           MODELO DUPLICADO EN ESTA AGENCIA
        ================================================= */

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

                    AND id <> ?

                LIMIT 1
                `,
                [
                    agenciaId,
                    datos.marca,
                    datos.nombre,
                    anio,
                    modeloId
                ]
            );


        if (
            duplicado.length >
            0
        ) {

            return await renderizarError(
                "Ya existe otro modelo con la misma marca, nombre y año dentro de esta agencia.",
                409
            );

        }


        /* =================================================
           GUARDAR NUEVA IMAGEN
        ================================================= */

        let imagenFinal =
            modeloActual.imagen;


        if (
            req.file
        ) {

            try {

                nuevaImagenGuardada =
                    await guardarImagenModeloPanel(
                        req.file,
                        agenciaId,
                        modeloId
                    );


                imagenFinal =
                    nuevaImagenGuardada
                        .rutaPublica;


            } catch (errorImagen) {

                console.error(
                    "Error guardando fotografía del modelo:",
                    errorImagen
                );


                return await renderizarError(
                    "No fue posible guardar la imagen seleccionada.",
                    500
                );

            }

        }


        /* =================================================
           ACTUALIZAR MODELO
        ================================================= */

        await conexion.query(
            `
            UPDATE modelos_vehiculos

            SET

                nombre = ?,
                marca = ?,
                anio = ?,
                categoria = ?,
                precio_diario = ?,
                transmision = ?,
                combustible = ?,
                pasajeros = ?,
                puertas = ?,
                equipaje = ?,
                aire_acondicionado = ?,
                destacado = ?,
                etiqueta = ?,
                descripcion = ?,
                imagen = ?,
                estado = ?

            WHERE
                id = ?

                AND agencia_id = ?
            `,
            [
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

                datos.aire_acondicionado ===
                    "1"
                    ? 1
                    : 0,

                datos.destacado ===
                    "1"
                    ? 1
                    : 0,

                datos.etiqueta ||
                    null,

                datos.descripcion ||
                    null,

                imagenFinal,

                datos.estado,

                modeloId,

                agenciaId
            ]
        );


        /* =================================================
           ELIMINAR FOTO ANTERIOR DESPUÉS DEL UPDATE
        ================================================= */

        if (
            nuevaImagenGuardada &&
            modeloActual.imagen &&
            modeloActual.imagen !==
                nuevaImagenGuardada
                    .rutaPublica
        ) {

            await eliminarImagenModeloPanel(
                modeloActual.imagen
            );

        }


        return res.redirect(
            "/panel/catalogo?modeloActualizado=1"
        );


    } catch (error) {

        /*
         * Si la imagen nueva llegó a guardarse
         * pero ocurrió un error posteriormente,
         * eliminamos ese archivo nuevo.
         */

        if (
            nuevaImagenGuardada?.rutaFisica
        ) {

            try {

                await fs.promises.unlink(
                    nuevaImagenGuardada
                        .rutaFisica
                );


            } catch (
                errorEliminando
            ) {

                if (
                    errorEliminando.code !==
                    "ENOENT"
                ) {

                    console.error(
                        "Error limpiando fotografía nueva:",
                        errorEliminando
                    );

                }

            }

        }


        console.error(
            "Error actualizando modelo desde panel de agencia:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible actualizar el modelo de vehículo."
            );


    } finally {

        if (conexion) {

            conexion.release();

        }

    }

}

module.exports = {

    mostrarCatalogoPanel,

    mostrarNuevoModeloPanel,

    crearModeloPanel,

    mostrarEditarModeloPanel,

    actualizarModeloPanel

};