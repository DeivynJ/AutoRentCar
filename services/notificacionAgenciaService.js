/* =========================================================
   AUTORENTCAR - SERVICIO DE NOTIFICACIONES DE AGENCIA
========================================================= */

const {
    pool
} = require(
    "../config/database"
);


/* =========================================================
   ERROR CONTROLADO
========================================================= */

function crearError(
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

        throw crearError(
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
    valor,
    maximo,
    obligatorio = true
) {

    const texto =
        String(
            valor ??
            ""
        )
            .trim();


    if (
        obligatorio &&
        !texto
    ) {

        throw crearError(
            "CAMPO_REQUERIDO",
            "Falta información requerida para crear la notificación."
        );

    }


    if (
        texto.length >
        maximo
    ) {

        throw crearError(
            "CAMPO_INVALIDO",
            "Uno de los textos de la notificación supera el tamaño permitido."
        );

    }


    return texto ||
        null;

}


/* =========================================================
   AUDIENCIAS PERMITIDAS
========================================================= */

const AUDIENCIAS_PERMITIDAS =
    new Set([
        "todos",
        "administradores"
    ]);


/* =========================================================
   NORMALIZAR AUDIENCIA
========================================================= */

function normalizarAudiencia(
    valor
) {

    const audiencia =
        String(
            valor ||
            "todos"
        )
            .trim()
            .toLowerCase();


    if (
        !AUDIENCIAS_PERMITIDAS.has(
            audiencia
        )
    ) {

        throw crearError(
            "AUDIENCIA_NOTIFICACION_INVALIDA",
            "La audiencia de la notificación no es válida."
        );

    }


    return audiencia;

}


/* =========================================================
   VALIDAR USUARIO DE LA AGENCIA Y OBTENER ROL
========================================================= */

async function obtenerUsuarioAgencia(
    conexion,
    agenciaId,
    usuarioId
) {

    const usuarios =
        await conexion.query(
            `
            SELECT

                u.id,

                u.agencia_id,

                r.codigo
                    AS rol_codigo

            FROM usuarios u

            INNER JOIN roles r
                ON r.id = u.rol_id

            WHERE
                u.id = ?
                AND u.agencia_id = ?
                AND u.estado = 'activo'
                AND r.activo = 1

            LIMIT 1
            `,
            [
                usuarioId,
                agenciaId
            ]
        );


    if (
        !usuarios.length
    ) {

        throw crearError(
            "USUARIO_NO_AUTORIZADO",
            "El usuario no pertenece a la agencia o no tiene acceso.",
            403
        );

    }


    return {

        id:
            Number(
                usuarios[0].id
            ),

        agenciaId:
            Number(
                usuarios[0].agencia_id
            ),

        rolCodigo:
            usuarios[0].rol_codigo

    };

}

/* =========================================================
   CREAR NOTIFICACIÓN PARA UNA AGENCIA
========================================================= */

async function crearNotificacionAgencia({

    agenciaId,

    categoria,

    tipo,

    claveEvento = null,

    titulo,

    mensaje,

    destinoUrl = null,

    entidadTipo = null,

    entidadId = null,

    nivel = "info",

    audiencia = "todos",

    conexion = null

}) {

    const agenciaIdSeguro =
        validarId(
            agenciaId,
            "La agencia"
        );


    const categoriaSegura =
        normalizarTexto(
            categoria,
            50
        );


    const tipoSeguro =
        normalizarTexto(
            tipo,
            80
        );

    const claveEventoSegura =
    normalizarTexto(
        claveEvento,
        190,
        false
    );


    const tituloSeguro =
        normalizarTexto(
            titulo,
            180
        );


    const mensajeSeguro =
        normalizarTexto(
            mensaje,
            500
        );


    const destinoSeguro =
        normalizarTexto(
            destinoUrl,
            255,
            false
        );


    const entidadTipoSeguro =
        normalizarTexto(
            entidadTipo,
            80,
            false
        );


    let entidadIdSeguro =
        null;


    if (
        entidadId !== null &&
        entidadId !== undefined &&
        entidadId !== ""
    ) {

        entidadIdSeguro =
            validarId(
                entidadId,
                "La entidad"
            );

    }


    const nivelesPermitidos =
        [
            "info",
            "exito",
            "advertencia",
            "critica"
        ];


    const nivelSeguro =
        String(
            nivel ||
            "info"
        )
            .trim()
            .toLowerCase();


    if (
        !nivelesPermitidos.includes(
            nivelSeguro
        )
    ) {

        throw crearError(
            "NIVEL_NOTIFICACION_INVALIDO",
            "El nivel de la notificación no es válido."
        );

    }

    const audienciaSegura =
    normalizarAudiencia(
        audiencia
    );


    const conexionPropia =
        !conexion;


    const db =
        conexion ||
        await pool.getConnection();


    try {

        /* -------------------------------------------------
           VALIDAR QUE LA AGENCIA EXISTA
        ------------------------------------------------- */

        const agencias =
            await db.query(
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

            throw crearError(
                "AGENCIA_NO_ENCONTRADA",
                "La agencia no existe.",
                404
            );

        }


        /* -------------------------------------------------
           INSERTAR NOTIFICACIÓN
        ------------------------------------------------- */

               let resultado;


        try {

            resultado =
                await db.query(
                    `
                    INSERT INTO notificaciones_agencia (

                        agencia_id,

                        categoria,
                        tipo,
                        clave_evento,

                        titulo,
                        mensaje,

                        destino_url,

                        entidad_tipo,
                        entidad_id,

                        nivel,
                        audiencia

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

                        agenciaIdSeguro,

                        categoriaSegura,
                        tipoSeguro,
                        claveEventoSegura,

                        tituloSeguro,
                        mensajeSeguro,

                        destinoSeguro,

                        entidadTipoSeguro,
                        entidadIdSeguro,

                        nivelSeguro,
                        audienciaSegura

                    ]
                );


        } catch (error) {

            /*
             * Si la misma clave de evento ya existe
             * para esta agencia, significa que esa
             * notificación ya fue generada.
             */

            if (
                error?.code ===
                    "ER_DUP_ENTRY" &&
                claveEventoSegura
            ) {

                return {

                    id:
                        null,

                    creada:
                        false,

                    duplicada:
                        true,

                    agenciaId:
                        agenciaIdSeguro,

                    categoria:
                        categoriaSegura,

                    tipo:
                        tipoSeguro,

                    claveEvento:
                        claveEventoSegura,

                    titulo:
                        tituloSeguro,

                    mensaje:
                        mensajeSeguro,

                    destinoUrl:
                        destinoSeguro,

                    entidadTipo:
                        entidadTipoSeguro,

                    entidadId:
                        entidadIdSeguro,

                    nivel:
                        nivelSeguro,

                    audiencia:
                        audienciaSegura

                };

            }


            throw error;

        }


        return {

            id:
                Number(
                    resultado.insertId
                ),

            creada:
                true,

            duplicada:
                false,

            agenciaId:
                agenciaIdSeguro,

            categoria:
                categoriaSegura,

            tipo:
                tipoSeguro,

            claveEvento:
                claveEventoSegura,

            titulo:
                tituloSeguro,

            mensaje:
                mensajeSeguro,

            destinoUrl:
                destinoSeguro,

            entidadTipo:
                entidadTipoSeguro,

            entidadId:
                entidadIdSeguro,

            nivel:
                nivelSeguro,

            audiencia:
                audienciaSegura

        };


    } finally {

        if (
            conexionPropia
        ) {

            db.release();

        }

    }

}


/* =========================================================
   LISTAR NOTIFICACIONES PARA UN USUARIO DE UNA AGENCIA
========================================================= */

async function listarNotificacionesAgenciaUsuario({

    agenciaId,

    usuarioId,

    categoria = null,

    limite = 20

}) {

    const agenciaIdSeguro =
        validarId(
            agenciaId,
            "La agencia"
        );


    const usuarioIdSeguro =
        validarId(
            usuarioId,
            "El usuario"
        );


    let limiteSeguro =
        Number(
            limite
        );


    if (
        !Number.isInteger(
            limiteSeguro
        ) ||
        limiteSeguro <= 0
    ) {

        limiteSeguro =
            20;

    }


    limiteSeguro =
        Math.min(
            limiteSeguro,
            50
        );


    const categoriaSegura =
        normalizarTexto(
            categoria,
            50,
            false
        );


    let conexion;


    try {

        conexion =
            await pool.getConnection();


        /*
         * Además de validar que el usuario pertenezca
         * a la agencia, obtenemos su rol.
         */

        const usuario =
            await obtenerUsuarioAgencia(
                conexion,
                agenciaIdSeguro,
                usuarioIdSeguro
            );


        const parametros =
            [
                usuarioIdSeguro,
                agenciaIdSeguro,
                usuario.rolCodigo
            ];


        let filtroCategoria =
            "";


        if (
            categoriaSegura
        ) {

            filtroCategoria =
                `
                AND n.categoria = ?
                `;


            parametros.push(
                categoriaSegura
            );

        }


        parametros.push(
            limiteSeguro
        );


        const filas =
            await conexion.query(
                `
                SELECT

                    n.id,

                    n.categoria,

                    n.tipo,

                    n.clave_evento,

                    n.titulo,

                    n.mensaje,

                    n.destino_url,

                    n.entidad_tipo,

                    n.entidad_id,

                    n.nivel,

                    n.audiencia,

                    n.fecha_creacion,

                    CASE

                        WHEN l.id IS NULL
                            THEN 0

                        ELSE 1

                    END AS leida,

                    l.fecha_lectura

                FROM notificaciones_agencia n

                LEFT JOIN notificacion_lecturas_agencia l

                    ON l.notificacion_id =
                        n.id

                    AND l.usuario_id = ?

                WHERE
                    n.agencia_id = ?

                    AND
                    (
                        n.audiencia = 'todos'

                        OR
                        (
                            n.audiencia =
                                'administradores'

                            AND ? =
                                'admin_agencia'
                        )
                    )

                    ${filtroCategoria}

                ORDER BY
                    n.fecha_creacion DESC,
                    n.id DESC

                LIMIT ?
                `,
                parametros
            );


        return filas.map(
            fila => ({

                id:
                    Number(
                        fila.id
                    ),

                categoria:
                    fila.categoria,

                tipo:
                    fila.tipo,

                claveEvento:
                    fila.clave_evento,

                titulo:
                    fila.titulo,

                mensaje:
                    fila.mensaje,

                destinoUrl:
                    fila.destino_url,

                entidadTipo:
                    fila.entidad_tipo,

                entidadId:
                    fila.entidad_id
                        ? Number(
                            fila.entidad_id
                        )
                        : null,

                nivel:
                    fila.nivel,

                audiencia:
                    fila.audiencia,

                leida:
                    Boolean(
                        Number(
                            fila.leida
                        )
                    ),

                fechaCreacion:
                    fila.fecha_creacion,

                fechaLectura:
                    fila.fecha_lectura

            })
        );


    } finally {

        if (
            conexion
        ) {

            conexion.release();

        }

    }

}


/* =========================================================
   CONTAR NOTIFICACIONES NO LEÍDAS
========================================================= */

async function contarNotificacionesNoLeidas({

    agenciaId,

    usuarioId

}) {

    const agenciaIdSeguro =
        validarId(
            agenciaId,
            "La agencia"
        );


    const usuarioIdSeguro =
        validarId(
            usuarioId,
            "El usuario"
        );


    let conexion;


    try {

        conexion =
            await pool.getConnection();


        /*
         * Validamos que el usuario pertenezca
         * a la agencia y obtenemos su rol.
         */

        const usuario =
            await obtenerUsuarioAgencia(
                conexion,
                agenciaIdSeguro,
                usuarioIdSeguro
            );


        const filas =
            await conexion.query(
                `
                SELECT

                    COUNT(*) AS total

                FROM notificaciones_agencia n

                LEFT JOIN notificacion_lecturas_agencia l

                    ON l.notificacion_id =
                        n.id

                    AND l.usuario_id = ?

                WHERE
                    n.agencia_id = ?

                    AND
                    (
                        n.audiencia = 'todos'

                        OR
                        (
                            n.audiencia =
                                'administradores'

                            AND ? =
                                'admin_agencia'
                        )
                    )

                    AND l.id IS NULL
                `,
                [
                    usuarioIdSeguro,
                    agenciaIdSeguro,
                    usuario.rolCodigo
                ]
            );


        return Number(
            filas[0]?.total ||
            0
        );


    } finally {

        if (
            conexion
        ) {

            conexion.release();

        }

    }

}


/* =========================================================
   MARCAR UNA NOTIFICACIÓN COMO LEÍDA
========================================================= */

async function marcarNotificacionComoLeida({

    agenciaId,

    usuarioId,

    notificacionId

}) {

    const agenciaIdSeguro =
        validarId(
            agenciaId,
            "La agencia"
        );


    const usuarioIdSeguro =
        validarId(
            usuarioId,
            "El usuario"
        );


    const notificacionIdSeguro =
        validarId(
            notificacionId,
            "La notificación"
        );


    let conexion;


    try {

        conexion =
            await pool.getConnection();


        /*
         * Validamos que el usuario pertenezca
         * realmente a la agencia y obtenemos su rol.
         */

        const usuario =
            await obtenerUsuarioAgencia(
                conexion,
                agenciaIdSeguro,
                usuarioIdSeguro
            );


        /* -------------------------------------------------
           CONFIRMAR QUE LA NOTIFICACIÓN SEA ACCESIBLE
           PARA ESTE USUARIO
        ------------------------------------------------- */

        const notificaciones =
            await conexion.query(
                `
                SELECT

                    id,
                    audiencia

                FROM notificaciones_agencia

                WHERE
                    id = ?

                    AND agencia_id = ?

                    AND
                    (
                        audiencia = 'todos'

                        OR
                        (
                            audiencia =
                                'administradores'

                            AND ? =
                                'admin_agencia'
                        )
                    )

                LIMIT 1
                `,
                [
                    notificacionIdSeguro,
                    agenciaIdSeguro,
                    usuario.rolCodigo
                ]
            );


        if (
            !notificaciones.length
        ) {

            throw crearError(
                "NOTIFICACION_NO_ENCONTRADA",
                "La notificación no existe o no está disponible para este usuario.",
                404
            );

        }


        await conexion.query(
            `
            INSERT INTO notificacion_lecturas_agencia (

                notificacion_id,
                usuario_id

            )

            VALUES (
                ?,
                ?
            )

            ON DUPLICATE KEY UPDATE

                fecha_lectura =
                    fecha_lectura
            `,
            [
                notificacionIdSeguro,
                usuarioIdSeguro
            ]
        );


        return {

            ok:
                true

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
   NORMALIZAR DESTINO INTERNO DEL PANEL
========================================================= */

function normalizarDestinoPanel(
    destinoUrl
) {

    const destino =
        String(
            destinoUrl ||
            ""
        )
            .trim();


    /*
     * Por seguridad solamente permitimos destinos
     * internos del panel de agencia.
     *
     * Ejemplos válidos:
     *
     * /panel
     * /panel/reservaciones
     * /panel/reservaciones/13
     */

    if (
        !destino ||
        !destino.startsWith(
            "/panel"
        ) ||
        destino.startsWith(
            "//"
        )
    ) {

        return "/panel";

    }


    return destino;

}


/* =========================================================
   ABRIR NOTIFICACIÓN
========================================================= */

async function abrirNotificacionAgencia({

    agenciaId,

    usuarioId,

    notificacionId

}) {

    const agenciaIdSeguro =
        validarId(
            agenciaId,
            "La agencia"
        );


    const usuarioIdSeguro =
        validarId(
            usuarioId,
            "El usuario"
        );


    const notificacionIdSeguro =
        validarId(
            notificacionId,
            "La notificación"
        );


    let conexion;

    let transaccionIniciada =
        false;


    try {

        conexion =
            await pool.getConnection();


        await conexion.beginTransaction();


        transaccionIniciada =
            true;


        /* =================================================
           VALIDAR USUARIO Y OBTENER SU ROL
        ================================================= */

        const usuario =
            await obtenerUsuarioAgencia(
                conexion,
                agenciaIdSeguro,
                usuarioIdSeguro
            );


        /* =================================================
           BUSCAR NOTIFICACIÓN ACCESIBLE PARA ESTE USUARIO

           Seguridad:
           - misma agencia
           - audiencia todos
           - o audiencia administradores si es admin_agencia
        ================================================= */

        const notificaciones =
            await conexion.query(
                `
                SELECT

                    id,
                    destino_url,
                    audiencia

                FROM notificaciones_agencia

                WHERE
                    id = ?

                    AND agencia_id = ?

                    AND
                    (
                        audiencia = 'todos'

                        OR
                        (
                            audiencia =
                                'administradores'

                            AND ? =
                                'admin_agencia'
                        )
                    )

                LIMIT 1
                `,
                [
                    notificacionIdSeguro,
                    agenciaIdSeguro,
                    usuario.rolCodigo
                ]
            );


        if (
            !notificaciones.length
        ) {

            throw crearError(
                "NOTIFICACION_NO_ENCONTRADA",
                "La notificación no existe o no está disponible para este usuario.",
                404
            );

        }


        const notificacion =
            notificaciones[0];


        /* =================================================
           MARCAR COMO LEÍDA PARA ESTE USUARIO
        ================================================= */

        await conexion.query(
            `
            INSERT INTO notificacion_lecturas_agencia (

                notificacion_id,
                usuario_id

            )

            VALUES (
                ?,
                ?
            )

            ON DUPLICATE KEY UPDATE

                fecha_lectura =
                    fecha_lectura
            `,
            [
                notificacionIdSeguro,
                usuarioIdSeguro
            ]
        );


        await conexion.commit();


        transaccionIniciada =
            false;


        return {

            ok:
                true,

            notificacionId:
                notificacionIdSeguro,

            destinoUrl:
                normalizarDestinoPanel(
                    notificacion.destino_url
                )

        };


    } catch (error) {

        if (
            conexion &&
            transaccionIniciada
        ) {

            try {

                await conexion.rollback();

            } catch (errorRollback) {

                console.error(
                    "Error haciendo rollback al abrir notificación:",
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

    crearNotificacionAgencia,

    listarNotificacionesAgenciaUsuario,

    contarNotificacionesNoLeidas,

    marcarNotificacionComoLeida,

    abrirNotificacionAgencia

};