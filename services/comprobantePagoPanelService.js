/* =========================================================
   AUTORENTCAR
   SERVICIO DE COMPROBANTES DE PAGO DEL PANEL
========================================================= */

const crypto =
    require(
        "crypto"
    );


const {
    pool
} = require(
    "../config/database"
);


const {
    obtenerComprobantePagoPrivado
} = require(
    "./comprobantePagoStorageService"
);


/* =========================================================
   ERROR CONTROLADO
========================================================= */

function crearErrorComprobante(
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

        throw crearErrorComprobante(
            "ID_INVALIDO",
            `${nombre} no es válido.`,
            400
        );

    }


    return numero;

}


/* =========================================================
   OBTENER Y VERIFICAR COMPROBANTE
========================================================= */

async function obtenerComprobantePagoVerificado(
    agenciaId,
    pagoId
) {

    const agenciaIdSeguro =
        validarId(
            agenciaId,
            "La agencia"
        );


    const pagoIdSeguro =
        validarId(
            pagoId,
            "El pago"
        );


    /* -------------------------------------------------
       BUSCAR PAGO DENTRO DE LA AGENCIA

       Nunca buscamos únicamente por pagoId.
    ------------------------------------------------- */

    const pagos =
        await pool.query(
            `
            SELECT

                id,
                agencia_id,
                reservacion_id,

                comprobante_ruta,
                comprobante_nombre_original,
                comprobante_mime,
                comprobante_tamano,
                comprobante_hash_sha256,

                estado

            FROM pagos_reservacion

            WHERE
                id = ?
                AND agencia_id = ?

            LIMIT 1
            `,
            [
                pagoIdSeguro,
                agenciaIdSeguro
            ]
        );


    if (
        !pagos.length
    ) {

        throw crearErrorComprobante(
            "PAGO_NO_ENCONTRADO",
            "El comprobante no se encuentra disponible.",
            404
        );

    }


    const pago =
        pagos[0];


    /* -------------------------------------------------
       EL PAGO DEBE TENER COMPROBANTE
    ------------------------------------------------- */

    if (
        !pago.comprobante_ruta ||
        !pago.comprobante_mime ||
        !pago.comprobante_tamano
    ) {

        throw crearErrorComprobante(
            "COMPROBANTE_NO_DISPONIBLE",
            "Este pago no tiene un comprobante disponible.",
            404
        );

    }


    /* -------------------------------------------------
       EXIGIR HUELLA SHA-256
    ------------------------------------------------- */

    const hashRegistrado =
        String(
            pago.comprobante_hash_sha256 ||
            ""
        )
            .trim()
            .toLowerCase();


    if (
        !/^[a-f0-9]{64}$/.test(
            hashRegistrado
        )
    ) {

        throw crearErrorComprobante(
            "INTEGRIDAD_NO_DISPONIBLE",
            "No fue posible verificar la integridad del comprobante.",
            409
        );

    }


    /* -------------------------------------------------
       LEER ARCHIVO DESDE ALMACENAMIENTO PRIVADO

       Este servicio ya comprueba:
       - que la ruta permanezca dentro de storage/comprobantes;
       - que sea un archivo;
       - máximo 5 MB;
       - firma real JPG/PNG/PDF.
    ------------------------------------------------- */

    const archivo =
        await obtenerComprobantePagoPrivado(
            pago.comprobante_ruta
        );


    /* -------------------------------------------------
       COMPARAR MIME
    ------------------------------------------------- */

    if (
        String(
            pago.comprobante_mime
        ).trim() !==
        archivo.mime
    ) {

        throw crearErrorComprobante(
            "INTEGRIDAD_COMPROBANTE_INVALIDA",
            "El tipo del comprobante almacenado no coincide con el registrado.",
            409
        );

    }


    /* -------------------------------------------------
       COMPARAR TAMAÑO
    ------------------------------------------------- */

    if (
        Number(
            pago.comprobante_tamano
        ) !==
        Number(
            archivo.tamano
        )
    ) {

        throw crearErrorComprobante(
            "INTEGRIDAD_COMPROBANTE_INVALIDA",
            "El tamaño del comprobante almacenado no coincide con el registrado.",
            409
        );

    }


    /* -------------------------------------------------
       CALCULAR SHA-256 ACTUAL
    ------------------------------------------------- */

    const hashActual =
        crypto
            .createHash(
                "sha256"
            )
            .update(
                archivo.buffer
            )
            .digest(
                "hex"
            );


    /*
     * Comparamos las dos huellas como buffers.
     */

    const hashRegistradoBuffer =
        Buffer.from(
            hashRegistrado,
            "hex"
        );


    const hashActualBuffer =
        Buffer.from(
            hashActual,
            "hex"
        );


    if (
        hashRegistradoBuffer.length !==
            hashActualBuffer.length ||
        !crypto.timingSafeEqual(
            hashRegistradoBuffer,
            hashActualBuffer
        )
    ) {

        throw crearErrorComprobante(
            "INTEGRIDAD_COMPROBANTE_INVALIDA",
            "El comprobante almacenado no coincide con el archivo originalmente registrado.",
            409
        );

    }


    /* -------------------------------------------------
       COMPROBANTE VERIFICADO
    ------------------------------------------------- */

    return {

        pago:
        {

            id:
                Number(
                    pago.id
                ),

            agenciaId:
                Number(
                    pago.agencia_id
                ),

            reservacionId:
                Number(
                    pago.reservacion_id
                ),

            estado:
                pago.estado,

            nombreOriginal:
                pago.comprobante_nombre_original ||
                "comprobante",

            mime:
                archivo.mime,

            tamano:
                archivo.tamano

        },

        archivo:
        {

            buffer:
                archivo.buffer,

            mime:
                archivo.mime,

            extension:
                archivo.extension,

            tamano:
                archivo.tamano

        },

        integridad:
        {

            verificada:
                true

        }

    };

}


/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports =
{

    obtenerComprobantePagoVerificado

};