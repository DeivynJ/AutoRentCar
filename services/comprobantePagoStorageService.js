const fs =
    require(
        "fs"
    );


const path =
    require(
        "path"
    );


const crypto =
    require(
        "crypto"
    );


/* =========================================================
   DIRECTORIO PRIVADO
========================================================= */

const DIRECTORIO_COMPROBANTES =
    path.resolve(
        __dirname,
        "..",
        "storage",
        "comprobantes"
    );


const EXTENSIONES_PERMITIDAS =
    new Set(
        [
            ".jpg",
            ".png",
            ".pdf"
        ]
    );


/* =========================================================
   ERROR CONTROLADO
========================================================= */

function crearErrorAlmacenamiento(
    codigo,
    mensaje,
    status = 500
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
   VALIDAR EXTENSIÓN
========================================================= */

function validarExtension(
    extensionEntrada
) {

    const extension =
        String(
            extensionEntrada ||
            ""
        )
            .trim()
            .toLowerCase();


    if (
        !EXTENSIONES_PERMITIDAS.has(
            extension
        )
    ) {

        throw crearErrorAlmacenamiento(
            "EXTENSION_COMPROBANTE_INVALIDA",
            "La extensión segura del comprobante no es válida.",
            400
        );

    }


    return extension;

}


/* =========================================================
   CREAR DIRECTORIO PRIVADO
========================================================= */

async function asegurarDirectorioPrivado() {

    await fs.promises.mkdir(
        DIRECTORIO_COMPROBANTES,
        {
            recursive:
                true
        }
    );

}


/* =========================================================
   GENERAR NOMBRE ALEATORIO
========================================================= */

function generarNombrePrivado(
    extension
) {

    const identificador =
        crypto
            .randomBytes(
                24
            )
            .toString(
                "hex"
            );


    return (
        `${identificador}${extension}`
    );

}


/* =========================================================
   GUARDAR COMPROBANTE
========================================================= */

async function guardarComprobantePagoPrivado(
    bufferEntrada,
    extensionEntrada
) {

    if (
        !Buffer.isBuffer(
            bufferEntrada
        ) ||
        bufferEntrada.length <= 0
    ) {

        throw crearErrorAlmacenamiento(
            "COMPROBANTE_VACIO",
            "El comprobante no contiene información válida.",
            400
        );

    }


    const extension =
        validarExtension(
            extensionEntrada
        );

        const hashSha256 =
    crypto
        .createHash(
            "sha256"
        )
        .update(
            bufferEntrada
        )
        .digest(
            "hex"
        );


    await asegurarDirectorioPrivado();


    /*
     * El nombre original del archivo nunca forma parte
     * del nombre almacenado.
     *
     * Esto evita:
     * - path traversal;
     * - nombres manipulados;
     * - exposición de datos del cliente;
     * - colisiones previsibles.
     */

    for (
        let intento = 0;
        intento < 5;
        intento += 1
    ) {

        const nombreArchivo =
            generarNombrePrivado(
                extension
            );


        const rutaAbsoluta =
            path.join(
                DIRECTORIO_COMPROBANTES,
                nombreArchivo
            );


        try {

            /*
             * flag: "wx"
             *
             * Garantiza que el archivo se cree únicamente
             * si todavía no existe.
             */

            await fs.promises.writeFile(
                rutaAbsoluta,
                bufferEntrada,
                {
                    flag:
                        "wx",

                    mode:
                        0o600
                }
            );


            /*
             * Esta es la ruta que almacenaremos en MariaDB.
             *
             * No es una URL pública.
             */

            const rutaRelativa =
                path.posix.join(
                    "storage",
                    "comprobantes",
                    nombreArchivo
                );


            return {

    nombreArchivo,

    rutaRelativa,

    rutaAbsoluta,

    extension,

    tamano:
        bufferEntrada.length,

    hashSha256

};

        } catch (error) {

            /*
             * Una colisión es extremadamente improbable,
             * pero generamos otro nombre si llegara a ocurrir.
             */

            if (
                error.code ===
                "EEXIST"
            ) {

                continue;

            }


            throw crearErrorAlmacenamiento(
                "ERROR_GUARDANDO_COMPROBANTE",
                "No fue posible guardar el comprobante de pago.",
                500
            );

        }

    }


    throw crearErrorAlmacenamiento(
        "ERROR_GENERANDO_NOMBRE_COMPROBANTE",
        "No fue posible generar un nombre seguro para el comprobante.",
        500
    );

}


/* =========================================================
   ELIMINAR COMPROBANTE PRIVADO
========================================================= */

async function eliminarComprobantePagoPrivado(
    rutaEntrada
) {

    const ruta =
        String(
            rutaEntrada ||
            ""
        ).trim();


    if (!ruta) {

        return false;

    }


    /*
     * Convertimos la ruta almacenada a una ruta absoluta
     * y comprobamos que permanezca DENTRO del directorio
     * privado de comprobantes.
     */

    const rutaAbsoluta =
        path.resolve(
            __dirname,
            "..",
            ruta
        );


    const rutaRelativa =
        path.relative(
            DIRECTORIO_COMPROBANTES,
            rutaAbsoluta
        );


    if (
        rutaRelativa.startsWith(
            ".."
        ) ||
        path.isAbsolute(
            rutaRelativa
        )
    ) {

        throw crearErrorAlmacenamiento(
            "RUTA_COMPROBANTE_INVALIDA",
            "La ruta del comprobante no pertenece al almacenamiento privado.",
            400
        );

    }


    try {

        await fs.promises.unlink(
            rutaAbsoluta
        );


        return true;

    } catch (error) {

        if (
            error.code ===
            "ENOENT"
        ) {

            return false;

        }


        throw crearErrorAlmacenamiento(
            "ERROR_ELIMINANDO_COMPROBANTE",
            "No fue posible eliminar el comprobante privado.",
            500
        );

    }

}

/* =========================================================
   OBTENER COMPROBANTE PRIVADO
========================================================= */

async function obtenerComprobantePagoPrivado(
    rutaEntrada
) {

    const ruta =
        String(
            rutaEntrada ||
            ""
        ).trim();


    if (!ruta) {

        throw crearErrorAlmacenamiento(
            "COMPROBANTE_NO_DISPONIBLE",
            "El comprobante no se encuentra disponible.",
            404
        );

    }


    /*
     * Convertimos la ruta almacenada en MariaDB
     * a una ruta absoluta.
     */

    const rutaAbsoluta =
        path.resolve(
            __dirname,
            "..",
            ruta
        );


    /*
     * Comprobamos que siga estando estrictamente
     * dentro de storage/comprobantes.
     *
     * Una ruta manipulada como:
     *
     * ../../.env
     *
     * será rechazada.
     */

    const rutaRelativa =
        path.relative(
            DIRECTORIO_COMPROBANTES,
            rutaAbsoluta
        );


    if (
        !rutaRelativa ||
        rutaRelativa.startsWith(
            ".."
        ) ||
        path.isAbsolute(
            rutaRelativa
        )
    ) {

        throw crearErrorAlmacenamiento(
            "RUTA_COMPROBANTE_INVALIDA",
            "La ruta del comprobante no pertenece al almacenamiento privado.",
            400
        );

    }


    let estadisticas;


    try {

        estadisticas =
            await fs.promises.stat(
                rutaAbsoluta
            );

    } catch (error) {

        if (
            error.code ===
            "ENOENT"
        ) {

            throw crearErrorAlmacenamiento(
                "COMPROBANTE_NO_ENCONTRADO",
                "El archivo del comprobante no fue encontrado.",
                404
            );

        }


        throw crearErrorAlmacenamiento(
            "ERROR_LEYENDO_COMPROBANTE",
            "No fue posible acceder al comprobante.",
            500
        );

    }


    /*
     * Nunca permitimos directorios u otros tipos
     * de entrada del sistema de archivos.
     */

    if (
        !estadisticas.isFile()
    ) {

        throw crearErrorAlmacenamiento(
            "COMPROBANTE_INVALIDO",
            "El comprobante almacenado no corresponde a un archivo válido.",
            400
        );

    }


    /*
     * Segunda defensa:
     *
     * aunque en la subida ya limitamos a 5 MB,
     * volvemos a comprobarlo al momento de leerlo.
     */

    const MAXIMO_COMPROBANTE =
        5 *
        1024 *
        1024;


    if (
        estadisticas.size <= 0 ||
        estadisticas.size >
            MAXIMO_COMPROBANTE
    ) {

        throw crearErrorAlmacenamiento(
            "COMPROBANTE_INVALIDO",
            "El tamaño del comprobante almacenado no es válido.",
            400
        );

    }


    let buffer;


    try {

        buffer =
            await fs.promises.readFile(
                rutaAbsoluta
            );

    } catch (error) {

        throw crearErrorAlmacenamiento(
            "ERROR_LEYENDO_COMPROBANTE",
            "No fue posible leer el comprobante.",
            500
        );

    }


    /* -------------------------------------------------
       DETECTAR NUEVAMENTE EL TIPO REAL
    ------------------------------------------------- */

    let mime =
        null;


    let extension =
        null;


    /*
     * PNG
     */

    if (
        buffer.length >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4E &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0D &&
        buffer[5] === 0x0A &&
        buffer[6] === 0x1A &&
        buffer[7] === 0x0A
    ) {

        mime =
            "image/png";

        extension =
            ".png";

    }


    /*
     * JPEG / JPG
     */

    else if (
        buffer.length >= 3 &&
        buffer[0] === 0xFF &&
        buffer[1] === 0xD8 &&
        buffer[2] === 0xFF
    ) {

        mime =
            "image/jpeg";

        extension =
            ".jpg";

    }


    /*
     * PDF
     */

    else if (
        buffer.length >= 5 &&
        buffer[0] === 0x25 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x44 &&
        buffer[3] === 0x46 &&
        buffer[4] === 0x2D
    ) {

        mime =
            "application/pdf";

        extension =
            ".pdf";

    }


    else {

        throw crearErrorAlmacenamiento(
            "COMPROBANTE_TIPO_INVALIDO",
            "El contenido almacenado ya no corresponde a un comprobante permitido.",
            400
        );

    }


    return {

        buffer,

        rutaAbsoluta,

        mime,

        extension,

        tamano:
            estadisticas.size

    };

}


/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports =
{

    guardarComprobantePagoPrivado,
    eliminarComprobantePagoPrivado,
    obtenerComprobantePagoPrivado

};