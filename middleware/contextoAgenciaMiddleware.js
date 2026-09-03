/* =========================================================
   AUTORENTCAR - CONTEXTO SEGURO DE AGENCIA
========================================================= */

const {
    pool
} = require(
    "../config/database"
);


/* =========================================================
   CARGAR CONTEXTO DE LA AGENCIA
========================================================= */

async function cargarContextoAgencia(
    req,
    res,
    next
) {

    const usuarioSesion =
        req.session?.usuario;


    if (!usuarioSesion) {

        return res.redirect(
            "/login"
        );

    }


    let conexion;


    try {

        conexion =
            await pool.getConnection();


        /* =================================================
           1. VALIDAR USUARIO ACTUAL EN LA BASE DE DATOS
        ================================================= */

        const usuarios =
            await conexion.query(
                `
                SELECT
                    u.id,
                    u.agencia_id,
                    u.nombre,
                    u.apellido,
                    u.correo,
                    u.estado,

                    r.id AS rol_id,
                    r.nombre AS rol_nombre,
                    r.codigo AS rol_codigo,
                    r.nivel AS rol_nivel

                FROM usuarios u

                INNER JOIN roles r
                    ON r.id = u.rol_id

                WHERE u.id = ?

                LIMIT 1
                `,
                [
                    usuarioSesion.id
                ]
            );


        if (!usuarios.length) {

            return res
                .status(403)
                .send(
                    "El usuario de esta sesión ya no existe."
                );

        }


        const usuario =
            usuarios[0];


        if (
            usuario.estado !==
            "activo"
        ) {

            return res
                .status(403)
                .send(
                    "Tu cuenta ya no se encuentra activa."
                );

        }


        /*
         * El panel operativo no pertenece
         * al SuperAdministrador.
         */

        if (
            usuario.rol_codigo ===
            "superadmin"
        ) {

            return res.redirect(
                "/admin"
            );

        }


        if (
            !usuario.agencia_id ||
            Number(
                usuario.agencia_id
            ) <= 0
        ) {

            return res
                .status(403)
                .send(
                    "Tu usuario no está asociado a una agencia."
                );

        }


        /* =================================================
           2. VALIDAR LA AGENCIA REAL DEL USUARIO
        ================================================= */

        const agencias =
            await conexion.query(
                `
                SELECT
                    id,
                    nombre,
                    slug,
                    nombre_legal,
                    identificacion_fiscal,
                    correo,
                    telefono,
                    whatsapp,
                    direccion,
                    ciudad,
                    provincia,
                    pais,
                    logo,
                    color_primario,
                    color_secundario,
                    estado,
                    fecha_creacion,
                    fecha_actualizacion

                FROM agencias

                WHERE id = ?

                LIMIT 1
                `,
                [
                    usuario.agencia_id
                ]
            );


        if (!agencias.length) {

            return res
                .status(403)
                .send(
                    "La agencia asociada a tu usuario ya no existe."
                );

        }


        const agencia =
            agencias[0];


        const estadosAgenciaPermitidos =
            new Set(
                [
                    "prueba",
                    "activa"
                ]
            );


        if (
            !estadosAgenciaPermitidos.has(
                agencia.estado
            )
        ) {

            return res
                .status(403)
                .send(
                    "La agencia no tiene acceso operativo en este momento."
                );

        }


        /* =================================================
           3. OBTENER LA ÚLTIMA SUSCRIPCIÓN
        ================================================= */

        const suscripciones =
            await conexion.query(
                `
                SELECT
                    s.id AS suscripcion_id,
                    s.agencia_id,
                    s.plan_id,
                    s.fecha_inicio,
                    s.fecha_fin,
                    s.estado AS suscripcion_estado,
                    s.precio_acordado,
                    s.renovacion_automatica,

                    CASE
                        WHEN
                            s.fecha_inicio <= CURDATE()
                            AND
                            (
                                s.fecha_fin IS NULL
                                OR
                                s.fecha_fin >= CURDATE()
                            )
                        THEN 1
                        ELSE 0
                    END AS fecha_vigente,

                    p.nombre AS plan_nombre,
                    p.descripcion AS plan_descripcion,
                    p.precio_mensual,
                    p.limite_vehiculos,
                    p.limite_sucursales,
                    p.limite_empleados,
                    p.activo AS plan_activo

                FROM suscripciones s

                INNER JOIN planes p
                    ON p.id = s.plan_id

                WHERE s.agencia_id = ?

                ORDER BY
                    s.id DESC

                LIMIT 1
                `,
                [
                    agencia.id
                ]
            );


        if (!suscripciones.length) {

            return res
                .status(403)
                .send(
                    "La agencia no tiene una suscripción registrada."
                );

        }


        const datosSuscripcion =
            suscripciones[0];


        const estadosSuscripcionPermitidos =
            new Set(
                [
                    "prueba",
                    "activa"
                ]
            );


        if (
            !estadosSuscripcionPermitidos.has(
                datosSuscripcion
                    .suscripcion_estado
            )
        ) {

            return res
                .status(403)
                .send(
                    "La suscripción de la agencia no se encuentra activa."
                );

        }


        if (
            Number(
                datosSuscripcion
                    .fecha_vigente
            ) !== 1
        ) {

            return res
                .status(403)
                .send(
                    "La suscripción de la agencia se encuentra fuera de su período de vigencia."
                );

        }


        /* =================================================
           4. CONSTRUIR CONTEXTO SEGURO
        ================================================= */

        req.usuarioAgencia = {

            id:
                usuario.id,

            agenciaId:
                usuario.agencia_id,

            nombre:
                usuario.nombre,

            apellido:
                usuario.apellido,

            correo:
                usuario.correo,

            estado:
                usuario.estado,

            rolId:
                usuario.rol_id,

            rolNombre:
                usuario.rol_nombre,

            rolCodigo:
                usuario.rol_codigo,

            rolNivel:
                usuario.rol_nivel

        };


        req.agencia = {

            id:
                agencia.id,

            nombre:
                agencia.nombre,

            slug:
                agencia.slug,

            nombreLegal:
                agencia.nombre_legal,

            identificacionFiscal:
                agencia.identificacion_fiscal,

            correo:
                agencia.correo,

            telefono:
                agencia.telefono,

            whatsapp:
                agencia.whatsapp,

            direccion:
                agencia.direccion,

            ciudad:
                agencia.ciudad,

            provincia:
                agencia.provincia,

            pais:
                agencia.pais,

            logo:
                agencia.logo,

            colorPrimario:
                agencia.color_primario,

            colorSecundario:
                agencia.color_secundario,

            estado:
                agencia.estado

        };


        req.suscripcion = {

            id:
                datosSuscripcion
                    .suscripcion_id,

            agenciaId:
                datosSuscripcion
                    .agencia_id,

            planId:
                datosSuscripcion
                    .plan_id,

            fechaInicio:
                datosSuscripcion
                    .fecha_inicio,

            fechaFin:
                datosSuscripcion
                    .fecha_fin,

            estado:
                datosSuscripcion
                    .suscripcion_estado,

            precioAcordado:
                datosSuscripcion
                    .precio_acordado,

            renovacionAutomatica:
                Boolean(
                    datosSuscripcion
                        .renovacion_automatica
                )

        };


        req.plan = {

            id:
                datosSuscripcion
                    .plan_id,

            nombre:
                datosSuscripcion
                    .plan_nombre,

            descripcion:
                datosSuscripcion
                    .plan_descripcion,

            precioMensual:
                datosSuscripcion
                    .precio_mensual,

            limiteVehiculos:
                datosSuscripcion
                    .limite_vehiculos,

            limiteSucursales:
                datosSuscripcion
                    .limite_sucursales,

            limiteEmpleados:
                datosSuscripcion
                    .limite_empleados,

            activo:
                Boolean(
                    datosSuscripcion
                        .plan_activo
                )

        };


        next();

    } catch (error) {

        console.error(
            "Error cargando el contexto de la agencia:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible validar el acceso a la agencia."
            );

    } finally {

        if (conexion) {

            conexion.release();

        }

    }

}


module.exports = {
    cargarContextoAgencia
};