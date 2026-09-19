/* =========================================================
   AUTORENTCAR
   CIFRADO DE CREDENCIALES SENSIBLES
========================================================= */

const crypto =
    require("crypto");


const ALGORITMO =
    "aes-256-gcm";


/* =========================================================
   OBTENER CLAVE MAESTRA
========================================================= */

function obtenerClaveMaestra() {

    const claveHex =
        String(
            process.env.CORREO_ENCRYPTION_KEY ||
            ""
        ).trim();


    if (
        !/^[a-fA-F0-9]{64}$/.test(
            claveHex
        )
    ) {

        throw new Error(
            "CORREO_ENCRYPTION_KEY_INVALIDA"
        );

    }


    return Buffer.from(
        claveHex,
        "hex"
    );

}


/* =========================================================
   CIFRAR TEXTO
========================================================= */

function cifrarTexto(
    valor
) {

    const texto =
        String(
            valor ||
            ""
        );


    if (
        !texto
    ) {

        throw new Error(
            "VALOR_CIFRADO_VACIO"
        );

    }


    const clave =
        obtenerClaveMaestra();


    const iv =
        crypto.randomBytes(
            12
        );


    const cipher =
        crypto.createCipheriv(
            ALGORITMO,
            clave,
            iv
        );


    const cifrado =
        Buffer.concat([

            cipher.update(
                texto,
                "utf8"
            ),

            cipher.final()

        ]);


    const authTag =
        cipher.getAuthTag();


    return {

        valorCifrado:
            cifrado.toString(
                "base64"
            ),

        iv:
            iv.toString(
                "base64"
            ),

        authTag:
            authTag.toString(
                "base64"
            )

    };

}


/* =========================================================
   DESCIFRAR TEXTO
========================================================= */

function descifrarTexto({

    valorCifrado,

    iv,

    authTag

}) {

    if (
        !valorCifrado ||
        !iv ||
        !authTag
    ) {

        throw new Error(
            "DATOS_CIFRADO_INCOMPLETOS"
        );

    }


    const clave =
        obtenerClaveMaestra();


    const decipher =
        crypto.createDecipheriv(
            ALGORITMO,
            clave,
            Buffer.from(
                iv,
                "base64"
            )
        );


    decipher.setAuthTag(
        Buffer.from(
            authTag,
            "base64"
        )
    );


    const descifrado =
        Buffer.concat([

            decipher.update(
                Buffer.from(
                    valorCifrado,
                    "base64"
                )
            ),

            decipher.final()

        ]);


    return descifrado.toString(
        "utf8"
    );

}


/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports = {

    cifrarTexto,

    descifrarTexto

};