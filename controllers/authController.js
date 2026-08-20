const bcrypt = require("bcrypt");

const {
    pool
} = require("../config/database");

async function mostrarLogin(req, res) {
    if (req.session?.usuario) {
        return res.redirect("/admin");
    }

    return res.render("auth/login", {
        titulo: "Iniciar sesión",
        error: null
    });
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
                    u.password_hash,
                    u.estado,
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

        const passwordCorrecta =
            await bcrypt.compare(
                password,
                usuario.password_hash
            );

        if (!passwordCorrecta) {
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

        req.session.usuario = {
            id: usuario.id,
            agenciaId:
                usuario.agencia_id,
            nombre:
                usuario.nombre,
            apellido:
                usuario.apellido,
            correo:
                usuario.correo,
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
                intentos_fallidos = 0
            WHERE id = ?
            `,
            [usuario.id]
        );

        return res.redirect("/admin");
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

function cerrarSesion(req, res) {
    req.session.destroy((error) => {
        if (error) {
            console.error(
                "No fue posible cerrar la sesión:",
                error
            );

            return res.redirect("/admin");
        }

        res.clearCookie(
            "autorentcar.sid"
        );

        return res.redirect("/login");
    });
}

module.exports = {
    mostrarLogin,
    procesarLogin,
    cerrarSesion
};