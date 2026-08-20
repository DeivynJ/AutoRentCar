/* =========================================================
   AUTORENTCAR
   CREAR SUPERADMINISTRADOR
========================================================= */

const readline = require("readline");
const bcrypt = require("bcrypt");

require("dotenv").config();

const {
    pool
} = require("../config/database");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function preguntar(texto) {
    return new Promise((resolve) => {
        rl.question(texto, (respuesta) => {
            resolve(respuesta.trim());
        });
    });
}

async function crearSuperadministrador() {
    let conexion;

    try {
        console.log("");
        console.log(
            "========================================"
        );
        console.log(
            "   AUTORENTCAR - CREAR SUPERADMIN"
        );
        console.log(
            "========================================"
        );
        console.log("");

        const nombre = await preguntar(
            "Nombre: "
        );

        const apellido = await preguntar(
            "Apellido: "
        );

        const correo = (
            await preguntar(
                "Correo electrónico: "
            )
        ).toLowerCase();

        const password = await preguntar(
            "Contraseña: "
        );

        const confirmarPassword =
            await preguntar(
                "Confirmar contraseña: "
            );

        /* =====================================================
           VALIDACIONES BÁSICAS
        ===================================================== */

        if (
            !nombre ||
            !correo ||
            !password
        ) {
            console.log("");
            console.log(
                "❌ Nombre, correo y contraseña son obligatorios."
            );

            return;
        }

        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                correo
            )
        ) {
            console.log("");
            console.log(
                "❌ El correo electrónico no es válido."
            );

            return;
        }

        if (password.length < 8) {
            console.log("");
            console.log(
                "❌ La contraseña debe tener al menos 8 caracteres."
            );

            return;
        }

        if (password !== confirmarPassword) {
            console.log("");
            console.log(
                "❌ Las contraseñas no coinciden."
            );

            return;
        }

        conexion = await pool.getConnection();

        /* =====================================================
           BUSCAR ROL SUPERADMIN
        ===================================================== */

        const roles = await conexion.query(
            `
            SELECT
                id
            FROM roles
            WHERE codigo = ?
            AND activo = TRUE
            LIMIT 1
            `,
            ["superadmin"]
        );

        if (!roles.length) {
            console.log("");
            console.log(
                "❌ No existe el rol Superadministrador."
            );

            return;
        }

        const rolId = roles[0].id;

        /* =====================================================
           VALIDAR CORREO DUPLICADO
        ===================================================== */

        const usuariosExistentes =
            await conexion.query(
                `
                SELECT
                    id
                FROM usuarios
                WHERE correo = ?
                LIMIT 1
                `,
                [correo]
            );

        if (usuariosExistentes.length) {
            console.log("");
            console.log(
                "❌ Ya existe un usuario registrado con ese correo."
            );

            return;
        }

        /* =====================================================
           GENERAR HASH
        ===================================================== */

        const rondasSalt = 12;

        const passwordHash =
            await bcrypt.hash(
                password,
                rondasSalt
            );

        /* =====================================================
           CREAR SUPERADMIN
        ===================================================== */

        const resultado =
            await conexion.query(
                `
                INSERT INTO usuarios (
                    agencia_id,
                    rol_id,
                    nombre,
                    apellido,
                    correo,
                    password_hash,
                    estado
                )
                VALUES (
                    NULL,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    'activo'
                )
                `,
                [
                    rolId,
                    nombre,
                    apellido || null,
                    correo,
                    passwordHash
                ]
            );

        console.log("");
        console.log(
            "✅ Superadministrador creado correctamente."
        );

        console.log(
            "ID:",
            Number(resultado.insertId)
        );

        console.log(
            "Correo:",
            correo
        );

        console.log(
            "Rol: Superadministrador"
        );

        console.log(
            "Agencia: Ninguna (administrador global)"
        );
    } catch (error) {
        console.error("");
        console.error(
            "❌ No fue posible crear el Superadministrador."
        );

        console.error(
            error.message
        );
    } finally {
        if (conexion) {
            conexion.release();
        }

        rl.close();

        await pool.end();
    }
}

crearSuperadministrador();