const bcrypt = require("bcrypt");

const {
    pool
} = require("../config/database");

/* =========================================================
   RUTA DE INICIO SEGÚN EL USUARIO
========================================================= */

function obtenerRutaInicioUsuario(
    usuario
) {

    if (!usuario) {
        return "/login";
    }

    if (
        usuario.rolCodigo ===
        "superadmin"
    ) {
        return "/admin";
    }

    if (
        Number(usuario.agenciaId) > 0
    ) {
        return "/panel";
    }

    return "/login";
}

async function mostrarLogin(
    req,
    res
) {

    if (
        req.session?.usuario
    ) {

        return res.redirect(
            obtenerRutaInicioUsuario(
                req.session.usuario
            )
        );

    }

    const aviso =
    String(
        req.query.aviso ||
        ""
    ).trim();


let mensajeLogin =
    null;


if (
    aviso ===
    "suscripcion_vencida"
) {

    mensajeLogin =
        "La suscripción de tu agencia ha vencido. Comunícate con el administrador de la plataforma para renovar el servicio.";

}


return res.render(
    "auth/login",
    {
        titulo:
            "Iniciar sesión",

        error:
            mensajeLogin
    }
  );
}

async function procesarLogin(req, res) {
    const correo = String(
        req.body.correo || ""
    )
        .trim()
        .toLowerCase();

    const password = String(
        req.body.password || ""
    );

    if (!correo || !password) {
        return res.status(400).render(
            "auth/login",
            {
                titulo: "Iniciar sesión",
                error:
                    "Completa el correo y la contraseña."
            }
        );
    }

    let conexion;

    try {
        conexion = await pool.getConnection();

        const usuarios =
            await conexion.query(
                `
                SELECT
                    u.id,
                    u.agencia_id,
                    u.nombre,
                    u.apellido,
                    u.correo,
                    u.foto_perfil,
                    u.password_hash,
u.estado,
u.intentos_fallidos,
u.bloqueado_hasta,
CASE
    WHEN
        u.bloqueado_hasta IS NOT NULL
        AND u.bloqueado_hasta > NOW()
    THEN 1
    ELSE 0
END AS bloqueo_temporal_activo,
r.id AS rol_id,
                    r.nombre AS rol_nombre,
                    r.codigo AS rol_codigo,
                    r.nivel AS rol_nivel
                FROM usuarios u
                INNER JOIN roles r
                    ON r.id = u.rol_id
                WHERE u.correo = ?
                LIMIT 1
                `,
                [correo]
            );

        if (!usuarios.length) {
            return res.status(401).render(
                "auth/login",
                {
                    titulo:
                        "Iniciar sesión",
                    error:
                        "Correo o contraseña incorrectos."
                }
            );
        }

        const usuario = usuarios[0];

        if (usuario.estado !== "activo") {
            return res.status(403).render(
                "auth/login",
                {
                    titulo:
                        "Iniciar sesión",
                    error:
                        "Tu cuenta no está activa."
                }
            );
        }

        if (
    Number(
        usuario.bloqueo_temporal_activo
    ) === 1
) {

    return res.status(429).render(
        "auth/login",
        {
            titulo:
                "Iniciar sesión",

            error:
                "Demasiados intentos fallidos. El acceso está bloqueado temporalmente. Intenta nuevamente más tarde."
        }
    );

}

        /*
 * Todo usuario que no sea SuperAdministrador
 * debe pertenecer a una agencia.
 */

if (
    usuario.rol_codigo !==
        "superadmin" &&
    !usuario.agencia_id
) {

    return res.status(403).render(
        "auth/login",
        {
            titulo:
                "Iniciar sesión",

            error:
                "Tu cuenta no está asociada a una agencia."
        }
    );

}

        const passwordCorrecta =
            await bcrypt.compare(
                password,
                usuario.password_hash
            );

        if (!passwordCorrecta) {

    const alcanzaBloqueoTemporal =
        Number(
            usuario.intentos_fallidos ||
            0
        ) >= 4;


    await conexion.query(
        `
        UPDATE usuarios
        SET
            bloqueado_hasta =
                CASE
                    WHEN intentos_fallidos >= 4
                    THEN DATE_ADD(
                        NOW(),
                        INTERVAL 15 MINUTE
                    )
                    ELSE NULL
                END,

            intentos_fallidos =
                CASE
                    WHEN intentos_fallidos >= 4
                    THEN 0
                    ELSE LEAST(
                        intentos_fallidos + 1,
                        65535
                    )
                END

        WHERE id = ?
        `,
        [usuario.id]
    );


    if (
        alcanzaBloqueoTemporal
    ) {

        return res.status(429).render(
            "auth/login",
            {
                titulo:
                    "Iniciar sesión",

                error:
                    "Demasiados intentos fallidos. El acceso ha sido bloqueado temporalmente durante 15 minutos."
            }
        );

    }

    return res.status(401).render(
        "auth/login",
        {
            titulo:
                "Iniciar sesión",

            error:
                "Correo o contraseña incorrectos."
        }
    );

}

                await new Promise((resolve, reject) => {

            req.session.regenerate((error) => {

                if (error) {
                    return reject(error);
                }

                resolve();

            });

        });



        req.session.usuario = {

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

    foto_perfil:
        usuario.foto_perfil ||
        null,

    rolId:
        usuario.rol_id,

    rolNombre:
        usuario.rol_nombre,

    rolCodigo:
        usuario.rol_codigo,

    rolNivel:
        usuario.rol_nivel

};

        await conexion.query(
            `
            UPDATE usuarios
SET
    ultimo_acceso = NOW(),
    intentos_fallidos = 0,
    bloqueado_hasta = NULL
WHERE id = ?
            `,
            [usuario.id]
        );

        return res.redirect(
    obtenerRutaInicioUsuario(
        req.session.usuario
    )
);

    } catch (error) {
        console.error(
            "Error durante el inicio de sesión:",
            error
        );

        return res.status(500).render(
            "auth/login",
            {
                titulo: "Iniciar sesión",
                error:
                    "Ocurrió un error al iniciar sesión."
            }
        );
    } finally {
        if (conexion) {
            conexion.release();
        }
    }
}

function cerrarSesion(
    req,
    res
) {

    const rutaActual =
        obtenerRutaInicioUsuario(
            req.session?.usuario
        );


    req.session.destroy(
        (error) => {

            if (error) {

                console.error(
                    "No fue posible cerrar la sesión:",
                    error
                );


                return res.redirect(
                    rutaActual
                );

            }


            res.clearCookie(
                "autorentcar.sid"
            );


            return res.redirect(
                "/login"
            );

        }
    );
}

module.exports = {
    mostrarLogin,
    procesarLogin,
    cerrarSesion
};