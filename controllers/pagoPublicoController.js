const {
    obtenerInformacionPagoPublico
} = require(
    "../services/pagoPublicoService"
);

const {
    registrarPagoPendienteValidacion
} = require(
    "../services/pagoReservacionService"
);


const {
    guardarComprobantePagoPrivado,
    eliminarComprobantePagoPrivado
} = require(
    "../services/comprobantePagoStorageService"
);

const {
    crearNotificacionAgencia
} = require(
    "../services/notificacionAgenciaService"
);

/* =========================================================
   NORMALIZAR NOMBRE ORIGINAL DEL COMPROBANTE
========================================================= */

function normalizarNombreComprobante(
    nombreEntrada
) {

    const nombre =
        String(
            nombreEntrada ||
            "comprobante"
        )
            .split(
                /[\\/]/
            )
            .pop()
            .replace(
                /[\u0000-\u001F\u007F]/g,
                ""
            )
            .trim();


    if (!nombre) {

        return "comprobante";

    }


    return nombre
        .slice(
            0,
            255
        );

}


/* =========================================================
   MOSTRAR PÁGINA PÚBLICA DE PAGO
========================================================= */

async function mostrarPagoPublico(
    req,
    res
) {

    /*
     * El token es la única credencial pública
     * para acceder a la información de pago.
     */

    const token =
        String(
            req.params.token ||
            ""
        ).trim();


    /*
     * Esta página contiene información sensible
     * relacionada con una reservación.
     *
     * Evitamos:
     * - caché del navegador/proxies;
     * - indexación por buscadores;
     * - envío del token mediante Referer.
     */

    res.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, private"
    );


    res.set(
        "Pragma",
        "no-cache"
    );


    res.set(
        "Referrer-Policy",
        "no-referrer"
    );


    res.set(
        "X-Robots-Tag",
        "noindex, nofollow, noarchive"
    );


    try {

        const informacion =
            await obtenerInformacionPagoPublico(
                token
            );


        /*
         * No enviamos a la vista IDs internos
         * de agencia o reservación.
         *
         * La página recibe únicamente la información
         * necesaria para mostrar el proceso al cliente.
         */

        return res.render(
            "pago/index",
            {

                titulo:
                    "Realizar pago",

                agencia:
{

    nombre:
        informacion
            .agencia
            .nombre,

    slug:
        informacion
            .agencia
            .slug,

    logo:
        informacion
            .agencia
            .logo ||
        "",

    colorPrimario:
        informacion
            .agencia
            .colorPrimario ||
        "#0b1f3a",

    colorSecundario:
        informacion
            .agencia
            .colorSecundario ||
        "#ff8a00"

},

                reservacion:
                {

                    codigo:
                        informacion
                            .reservacion
                            .codigo,

                    clienteNombre:
                        informacion
                            .reservacion
                            .clienteNombre,

                    total:
                        informacion
                            .reservacion
                            .total,

                    montoAnticipoRequerido:
                        informacion
                            .reservacion
                            .montoAnticipoRequerido,

                    fechaLimitePago:
                        informacion
                            .reservacion
                            .fechaLimitePago

                },

               metodosPago:
    informacion
        .metodosPago,

fechaExpiracion:
    informacion
        .fechaExpiracion,

token,

queryResultado:
    req.query?.resultado ||
    null

            }
        );

    } catch (error) {

        /*
         * No diferenciamos públicamente entre:
         *
         * - token falso;
         * - token revocado;
         * - token vencido;
         * - reservación ya procesada.
         *
         * El usuario recibe una respuesta genérica.
         */

        if (
            error.codigo ===
            "ENLACE_PAGO_INVALIDO"
        ) {

            return res
                .status(404)
                .send(
                    "El enlace de pago no es válido o ya no se encuentra disponible."
                );

        }


        console.error(
            "Error mostrando página pública de pago:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible cargar la información de pago."
            );

    }

}

/* =========================================================
   REGISTRAR COMPROBANTE DESDE EL PORTAL PÚBLICO
========================================================= */

async function registrarComprobantePagoPublico(
    req,
    res
) {

    /*
     * Estos valores NO provienen del formulario.
     *
     * Fueron obtenidos previamente por:
     *
     * requerirTokenPagoValido
     */

    const acceso =
        req.accesoPagoPublico;


    const token =
        req.tokenPagoPublico;


    if (
        !acceso ||
        !token
    ) {

        return res
            .status(404)
            .send(
                "El enlace de pago no es válido o ya no se encuentra disponible."
            );

    }


    const agenciaId =
        acceso.agencia.id;


    const reservacionId =
        acceso.reservacion.id;


    /*
     * El cliente solamente selecciona el método.
     *
     * El servicio comprobará nuevamente que dicho
     * método pertenezca a ESTA agencia y esté activo.
     */

    const metodoPagoId =
        req.body?.metodoPagoId;


    const monto =
        req.body?.monto;


    const referencia =
        req.body?.referencia;


    const fechaPago =
        req.body?.fechaPago;


    let archivoGuardado =
        null;


    try {

        /* -------------------------------------------------
           GUARDAR ARCHIVO PRIVADO

           Solo llegamos aquí después de:
           - token válido;
           - Multer;
           - tamaño;
           - MIME;
           - firma básica del archivo.
        ------------------------------------------------- */

        if (
            req.file &&
            req.comprobantePagoSeguro
        ) {

            archivoGuardado =
                await guardarComprobantePagoPrivado(
                    req.file.buffer,
                    req.comprobantePagoSeguro.extension
                );

        }


        /* -------------------------------------------------
           REGISTRAR PAGO

           El servicio vuelve a comprobar:
           - agencia;
           - reservación;
           - plazo;
           - método;
           - saldo;
           - comprobante requerido.

           El cliente NO controla:
           - agencia_id;
           - reservacion_id;
           - moneda;
           - estado;
           - origen.
        ------------------------------------------------- */

        const pago =
            await registrarPagoPendienteValidacion(
                agenciaId,
                reservacionId,
                metodoPagoId,
                {

                    monto,

                    referencia,

                    fechaPago,

                    comprobanteRuta:
                        archivoGuardado
                            ?.rutaRelativa ||
                        null,

                    comprobanteNombreOriginal:
                        req.file
                            ? normalizarNombreComprobante(
                                req.file.originalname
                            )
                            : null,

                    comprobanteMime:
    req.comprobantePagoSeguro
        ?.mime ||
    null,

comprobanteTamano:
    archivoGuardado
        ?.tamano ||
    null,

comprobanteHashSha256:
    archivoGuardado
        ?.hashSha256 ||
    null

                }
            );

        /* -------------------------------------------------
   NOTIFICAR A LA AGENCIA

   El pago ya fue registrado correctamente.

   Si la notificación falla, NO eliminamos
   el pago ni hacemos creer al cliente que
   el comprobante no fue recibido.
------------------------------------------------- */

try {

    await crearNotificacionAgencia(
        {

            agenciaId,

            categoria:
                "pagos",

            tipo:
                "comprobante_pago_recibido",

            titulo:
                "Nuevo comprobante de pago",

            mensaje:
                `Se recibió un comprobante de ${pago.moneda} ${Number(
                    pago.monto
                ).toFixed(
                    2
                )} para la reservación ${acceso.reservacion.codigo}. Está pendiente de validación.`,

            destinoUrl:
                `/panel/reservaciones/${reservacionId}`,

            entidadTipo:
                "pago",

            entidadId:
                Number(
                    pago.id
                ),

            nivel:
                "info"

        }
    );

} catch (
    errorNotificacion
) {

    console.error(
        "Pago registrado, pero falló la notificación de agencia:",
        errorNotificacion
    );

}


        /*
         * No exponemos el ID interno del pago
         * en la URL pública.
         */

        return res.redirect(
            `/pago/${encodeURIComponent(
                token
            )}?resultado=comprobante_enviado`
        );

    } catch (error) {

        /* -------------------------------------------------
           LIMPIAR ARCHIVO HUÉRFANO

           Si el archivo se guardó pero el pago no llegó
           a registrarse en MariaDB, lo eliminamos.
        ------------------------------------------------- */

        if (
            archivoGuardado
                ?.rutaRelativa
        ) {

            try {

                await eliminarComprobantePagoPrivado(
                    archivoGuardado
                        .rutaRelativa
                );

            } catch (
                errorEliminando
            ) {

                console.error(
                    "Error eliminando comprobante huérfano:",
                    errorEliminando
                );

            }

        }


        /* -------------------------------------------------
           ERRORES CONTROLADOS QUE PUEDE CORREGIR EL CLIENTE
        ------------------------------------------------- */

        if (
            [
                "ID_INVALIDO",
                "MONTO_INVALIDO",
                "MONTO_SUPERA_SALDO",
                "METODO_NO_ENCONTRADO",
                "METODO_INACTIVO",
                "COMPROBANTE_REQUERIDO",
                "COMPROBANTE_INVALIDO"
            ].includes(
                error.codigo
            )
        ) {

            return res
                .status(
                    error.status ||
                    400
                )
                .send(
                    error.message
                );

        }


        /* -------------------------------------------------
           RESERVACIÓN YA NO DISPONIBLE PARA PAGOS
        ------------------------------------------------- */

        if (
            [
                "PLAZO_PAGO_VENCIDO",
                "RESERVACION_NO_ENCONTRADA",
                "RESERVACION_NO_PENDIENTE_PAGO"
            ].includes(
                error.codigo
            )
        ) {

            return res
                .status(
                    error.status ||
                    409
                )
                .send(
                    "Esta reservación ya no se encuentra disponible para recibir pagos."
                );

        }


        console.error(
            "Error registrando comprobante público:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible registrar el comprobante de pago."
            );

    }

}


/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports =
{

    mostrarPagoPublico,
    registrarComprobantePagoPublico

};