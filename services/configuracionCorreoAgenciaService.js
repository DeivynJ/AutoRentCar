/* =========================================================
   AUTORENTCAR
   CONFIGURACIÓN DE CORREO POR AGENCIA
========================================================= */

const {
    pool
} = require(
    "../config/database"
);


const {
    cifrarTexto,
    descifrarTexto
} = require(
    "./cifradoCredencialesService"
);


/* =========================================================
   VALIDACIONES
========================================================= */

function normalizarId(
    valor
) {

    const id =
        Number(
            valor
        );


    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {

        throw new Error(
            "AGENCIA_ID_INVALIDO"
        );

    }


    return id;

}


function normalizarCorreo(
    valor
) {

    const correo =
        String(
            valor ||
            ""
        )
            .trim()
            .toLowerCase();


    if (
        !correo ||
        !correo.includes("@")
    ) {

        throw new Error(
            "CORREO_INVALIDO"
        );

    }


    return correo;

}


/* =========================================================
   OBTENER CONFIGURACIÓN
========================================================= */

async function obtenerConfiguracionCorreoAgencia(
    agenciaId,
    {
        incluirClave =
            false
    } = {}
) {

    const idAgencia =
        normalizarId(
            agenciaId
        );


    const conexion =
        await pool.getConnection();


    try {

        const filas =
            await conexion.query(
                `
                SELECT

                    id,

                    agencia_id,

                    proveedor,

                    nombre_remitente,

                    correo_remitente,

                    smtp_host,

                    smtp_puerto,

                    smtp_secure,

                    smtp_usuario,

                    smtp_clave_cifrada,

                    smtp_iv,

                    smtp_auth_tag,

                    activo,

                    verificado,

                    fecha_verificacion,

                    fecha_creacion,

                    fecha_actualizacion

                FROM configuracion_correo_agencia

                WHERE agencia_id = ?

                LIMIT 1
                `,
                [
                    idAgencia
                ]
            );


        if (
            filas.length === 0
        ) {

            return null;

        }


        const configuracion =
            filas[0];


        const resultado = {

            id:
                configuracion.id,

            agenciaId:
                configuracion.agencia_id,

            proveedor:
                configuracion.proveedor,

            nombreRemitente:
                configuracion.nombre_remitente,

            correoRemitente:
                configuracion.correo_remitente,

            smtpHost:
                configuracion.smtp_host,

            smtpPuerto:
                Number(
                    configuracion.smtp_puerto
                ),

            smtpSecure:
                Number(
                    configuracion.smtp_secure
                ) === 1,

            smtpUsuario:
                configuracion.smtp_usuario,

            activo:
                Number(
                    configuracion.activo
                ) === 1,

            verificado:
                Number(
                    configuracion.verificado
                ) === 1,

            fechaVerificacion:
                configuracion.fecha_verificacion,

            fechaCreacion:
                configuracion.fecha_creacion,

            fechaActualizacion:
                configuracion.fecha_actualizacion

        };


        if (
            incluirClave
        ) {

            resultado.smtpClave =
                descifrarTexto({

                    valorCifrado:
                        configuracion.smtp_clave_cifrada,

                    iv:
                        configuracion.smtp_iv,

                    authTag:
                        configuracion.smtp_auth_tag

                });

        }


        return resultado;


    } finally {

        conexion.release();

    }

}


/* =========================================================
   GUARDAR / ACTUALIZAR CONFIGURACIÓN
========================================================= */

async function guardarConfiguracionCorreoAgencia({

    agenciaId,

    proveedor =
        "gmail",

    nombreRemitente,

    correoRemitente,

    smtpHost =
        "smtp.gmail.com",

    smtpPuerto =
        465,

    smtpSecure =
        true,

    smtpUsuario,

    smtpClave =
        null,

    activo =
        true

}) {

    const idAgencia =
        normalizarId(
            agenciaId
        );


    const nombre =
        String(
            nombreRemitente ||
            ""
        ).trim();


    const correo =
        normalizarCorreo(
            correoRemitente
        );


    const usuario =
        normalizarCorreo(
            smtpUsuario
        );


    const host =
        String(
            smtpHost ||
            ""
        ).trim();


    const puerto =
        Number(
            smtpPuerto
        );


    const proveedorNormalizado =
        String(
            proveedor ||
            "gmail"
        )
            .trim()
            .toLowerCase();


    if (
        !nombre
    ) {

        throw new Error(
            "NOMBRE_REMITENTE_REQUERIDO"
        );

    }


    if (
        !host
    ) {

        throw new Error(
            "SMTP_HOST_REQUERIDO"
        );

    }


    if (
        !Number.isInteger(puerto) ||
        puerto <= 0 ||
        puerto > 65535
    ) {

        throw new Error(
            "SMTP_PUERTO_INVALIDO"
        );

    }


    const conexion =
        await pool.getConnection();


    try {

        await conexion.beginTransaction();


        const agencias =
            await conexion.query(
                `
                SELECT id

                FROM agencias

                WHERE id = ?

                LIMIT 1
                `,
                [
                    idAgencia
                ]
            );


        if (
            agencias.length === 0
        ) {

            throw new Error(
                "AGENCIA_NO_ENCONTRADA"
            );

        }


        const existentes =
            await conexion.query(
                `
                SELECT

                    smtp_clave_cifrada,

                    smtp_iv,

                    smtp_auth_tag

                FROM configuracion_correo_agencia

                WHERE agencia_id = ?

                LIMIT 1
                `,
                [
                    idAgencia
                ]
            );


        let datosCifrados =
            null;


        if (
            smtpClave
        ) {

            datosCifrados =
                cifrarTexto(
                    smtpClave
                );

        } else if (
            existentes.length >
            0
        ) {

            datosCifrados = {

                valorCifrado:
                    existentes[0].smtp_clave_cifrada,

                iv:
                    existentes[0].smtp_iv,

                authTag:
                    existentes[0].smtp_auth_tag

            };

        } else {

            throw new Error(
                "SMTP_CLAVE_REQUERIDA"
            );

        }


        await conexion.query(
            `
            INSERT INTO configuracion_correo_agencia
            (
                agencia_id,

                proveedor,

                nombre_remitente,

                correo_remitente,

                smtp_host,

                smtp_puerto,

                smtp_secure,

                smtp_usuario,

                smtp_clave_cifrada,

                smtp_iv,

                smtp_auth_tag,

                activo,

                verificado,

                fecha_verificacion
            )
            VALUES
            (
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
                0,
                NULL
            )

            ON DUPLICATE KEY UPDATE

                proveedor =
                    VALUES(proveedor),

                nombre_remitente =
                    VALUES(nombre_remitente),

                correo_remitente =
                    VALUES(correo_remitente),

                smtp_host =
                    VALUES(smtp_host),

                smtp_puerto =
                    VALUES(smtp_puerto),

                smtp_secure =
                    VALUES(smtp_secure),

                smtp_usuario =
                    VALUES(smtp_usuario),

                smtp_clave_cifrada =
                    VALUES(smtp_clave_cifrada),

                smtp_iv =
                    VALUES(smtp_iv),

                smtp_auth_tag =
                    VALUES(smtp_auth_tag),

                activo =
                    VALUES(activo),

                verificado =
                    0,

                fecha_verificacion =
                    NULL
            `,
            [

                idAgencia,

                proveedorNormalizado,

                nombre,

                correo,

                host,

                puerto,

                smtpSecure
                    ? 1
                    : 0,

                usuario,

                datosCifrados.valorCifrado,

                datosCifrados.iv,

                datosCifrados.authTag,

                activo
                    ? 1
                    : 0

            ]
        );


        await conexion.commit();


        return {

            guardada:
                true,

            agenciaId:
                idAgencia

        };


    } catch (error) {

        await conexion.rollback();

        throw error;


    } finally {

        conexion.release();

    }

}


/* =========================================================
   MARCAR CONFIGURACIÓN COMO VERIFICADA
========================================================= */

async function marcarConfiguracionCorreoVerificada(
    agenciaId
) {

    const idAgencia =
        normalizarId(
            agenciaId
        );


    const conexion =
        await pool.getConnection();


    try {

        const resultado =
            await conexion.query(
                `
                UPDATE configuracion_correo_agencia

                SET
                    verificado = 1,
                    fecha_verificacion = NOW()

                WHERE agencia_id = ?
                `,
                [
                    idAgencia
                ]
            );


        return {

            actualizada:
                Number(
                    resultado.affectedRows ||
                    0
                ) > 0

        };


    } finally {

        conexion.release();

    }

}


/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports = {

    obtenerConfiguracionCorreoAgencia,

    guardarConfiguracionCorreoAgencia,

    marcarConfiguracionCorreoVerificada

};