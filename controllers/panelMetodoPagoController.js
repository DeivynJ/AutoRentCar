/* =========================================================
   AUTORENTCAR
   CONTROLADOR DE MÉTODOS DE PAGO DEL PANEL
========================================================= */

const {
    listarMetodosPagoAgencia,
    obtenerMetodoPagoAgenciaPorId,
    crearMetodoPagoAgencia,
    actualizarMetodoPagoAgencia,
    cambiarEstadoMetodoPagoAgencia
} = require(
    "../services/metodoPagoAgenciaService"
);


/* =========================================================
   LISTAR MÉTODOS DE PAGO
========================================================= */

async function listarMetodosPagoPanel(
    req,
    res
) {

    try {

        /*
         * La agencia siempre proviene del contexto
         * autenticado del panel.
         *
         * Nunca debe recibirse agencia_id desde:
         *
         * - query
         * - params
         * - body
         */

        const agenciaId =
            Number(
                req.agencia?.id
            );


        if (
            !Number.isInteger(
                agenciaId
            ) ||
            agenciaId <= 0
        ) {

            return res.status(
                403
            ).send(
                "No fue posible determinar la agencia."
            );

        }


        const metodosPago =
    await listarMetodosPagoAgencia(
        agenciaId
    );


let metodoEditar =
    null;


const metodoEditarId =
    Number(
        req.query?.editar
    );


if (
    Number.isInteger(
        metodoEditarId
    ) &&
    metodoEditarId > 0
) {

    metodoEditar =
        await obtenerMetodoPagoAgenciaPorId(
            agenciaId,
            metodoEditarId
        );

}


return res.render(
    "panel/metodos-pago/index",
    {

        titulo:
            "Métodos de pago",

        subtituloPagina:
            "Configuración de pagos",

        paginaActual:
            "metodos-pago",

        usuario:
            req.usuarioAgencia,

        agencia:
            req.agencia,

        suscripcion:
    req.suscripcion,

plan:
    req.plan,

metodosPago,

metodoEditar

    }
);

    } catch (error) {

        console.error(
            "Error al listar métodos de pago del panel:",
            error
        );

        if (
    error.codigo ===
    "METODO_NO_ENCONTRADO"
) {

    const mensaje =
        encodeURIComponent(
            error.message
        );

    return res.redirect(
        `/panel/metodos-pago?resultado=error&mensaje=${mensaje}`
    );

}


        return res.status(
            500
        ).send(
            "No fue posible cargar los métodos de pago."
        );

    }

}

/* =========================================================
   CREAR MÉTODO DE PAGO
========================================================= */

async function crearMetodoPagoPanel(
    req,
    res
) {

    try {

        /*
         * La agencia se obtiene exclusivamente
         * del contexto autenticado.
         */

        const agenciaId =
            Number(
                req.agencia?.id
            );


        if (
            !Number.isInteger(
                agenciaId
            ) ||
            agenciaId <= 0
        ) {

            return res.status(
                403
            ).send(
                "No fue posible determinar la agencia."
            );

        }


        const metodo =
            await crearMetodoPagoAgencia(
                agenciaId,
                {

                    nombre:
                        req.body?.nombre,

                    tipo:
                        req.body?.tipo,

                    banco:
                        req.body?.banco,

                    titular:
                        req.body?.titular,

                    tipoCuenta:
                        req.body?.tipoCuenta,

                    numeroCuenta:
                        req.body?.numeroCuenta,

                    instrucciones:
                        req.body?.instrucciones,

                    requiereComprobante:
                        req.body?.requiereComprobante,

                    activo:
                        req.body?.activo,

                    orden:
                        req.body?.orden

                }
            );


        return res.redirect(
            `/panel/metodos-pago?resultado=creado&id=${metodo.id}`
        );

    } catch (error) {

        console.error(
            "Error al crear método de pago:",
            error
        );


        const erroresControlados = [

            "ID_INVALIDO",
            "TIPO_INVALIDO",
            "NOMBRE_INVALIDO",
            "DATOS_BANCARIOS_INCOMPLETOS",
            "AGENCIA_NO_ENCONTRADA"

        ];


        if (
            erroresControlados.includes(
                error.codigo
            )
        ) {

            const mensaje =
                encodeURIComponent(
                    error.message
                );


            return res.redirect(
                `/panel/metodos-pago?resultado=error&mensaje=${mensaje}`
            );

        }


        return res.status(
            500
        ).send(
            "No fue posible crear el método de pago."
        );

    }

}

/* =========================================================
   ACTUALIZAR MÉTODO DE PAGO
========================================================= */

async function actualizarMetodoPagoPanel(
    req,
    res
) {

    try {

        const agenciaId =
            Number(
                req.agencia?.id
            );


        const metodoId =
            Number(
                req.params?.metodoId
            );


        if (
            !Number.isInteger(
                agenciaId
            ) ||
            agenciaId <= 0
        ) {

            return res.status(
                403
            ).send(
                "No fue posible determinar la agencia."
            );

        }


        if (
            !Number.isInteger(
                metodoId
            ) ||
            metodoId <= 0
        ) {

            return res.redirect(
                "/panel/metodos-pago?resultado=error&mensaje=El%20m%C3%A9todo%20de%20pago%20no%20es%20v%C3%A1lido."
            );

        }


        const metodo =
            await actualizarMetodoPagoAgencia(
                agenciaId,
                metodoId,
                {

                    nombre:
                        req.body?.nombre,

                    tipo:
                        req.body?.tipo,

                    banco:
                        req.body?.banco,

                    titular:
                        req.body?.titular,

                    tipoCuenta:
                        req.body?.tipoCuenta,

                    numeroCuenta:
                        req.body?.numeroCuenta,

                    instrucciones:
                        req.body?.instrucciones,

                    requiereComprobante:
                        req.body?.requiereComprobante,

                    activo:
                        req.body?.activo,

                    orden:
                        req.body?.orden

                }
            );


        return res.redirect(
            `/panel/metodos-pago?resultado=actualizado&id=${metodo.id}`
        );

    } catch (error) {

        console.error(
            "Error al actualizar método de pago:",
            error
        );


        const erroresControlados = [

            "ID_INVALIDO",
            "TIPO_INVALIDO",
            "NOMBRE_INVALIDO",
            "DATOS_BANCARIOS_INCOMPLETOS",
            "METODO_NO_ENCONTRADO"

        ];


        if (
            erroresControlados.includes(
                error.codigo
            )
        ) {

            const mensaje =
                encodeURIComponent(
                    error.message
                );


            return res.redirect(
                `/panel/metodos-pago?resultado=error&mensaje=${mensaje}`
            );

        }


        return res.status(
            500
        ).send(
            "No fue posible actualizar el método de pago."
        );

    }

}

/* =========================================================
   CAMBIAR ESTADO DE MÉTODO DE PAGO
========================================================= */

async function cambiarEstadoMetodoPagoPanel(
    req,
    res
) {

    try {

        const agenciaId =
            Number(
                req.agencia?.id
            );


        const metodoId =
            Number(
                req.params?.metodoId
            );


        const activo =
            req.body?.activo;


        if (
            !Number.isInteger(
                agenciaId
            ) ||
            agenciaId <= 0
        ) {

            return res.status(
                403
            ).send(
                "No fue posible determinar la agencia."
            );

        }


        if (
            !Number.isInteger(
                metodoId
            ) ||
            metodoId <= 0
        ) {

            return res.redirect(
                "/panel/metodos-pago?resultado=error&mensaje=El%20m%C3%A9todo%20de%20pago%20no%20es%20v%C3%A1lido."
            );

        }


        const metodo =
            await cambiarEstadoMetodoPagoAgencia(
                agenciaId,
                metodoId,
                activo
            );


        const resultado =
            Number(
                metodo.activo
            ) === 1
                ? "activado"
                : "desactivado";


        return res.redirect(
            `/panel/metodos-pago?resultado=${resultado}&id=${metodo.id}`
        );

    } catch (error) {

        console.error(
            "Error al cambiar estado del método de pago:",
            error
        );


        const erroresControlados = [

            "ID_INVALIDO",
            "ESTADO_INVALIDO",
            "METODO_NO_ENCONTRADO"

        ];


        if (
            erroresControlados.includes(
                error.codigo
            )
        ) {

            const mensaje =
                encodeURIComponent(
                    error.message
                );


            return res.redirect(
                `/panel/metodos-pago?resultado=error&mensaje=${mensaje}`
            );

        }


        return res.status(
            500
        ).send(
            "No fue posible cambiar el estado del método de pago."
        );

    }

}

/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports = {

    listarMetodosPagoPanel,

    crearMetodoPagoPanel,

    actualizarMetodoPagoPanel,

    cambiarEstadoMetodoPagoPanel

};