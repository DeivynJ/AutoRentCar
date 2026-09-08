const {
    pool
} = require(
    "../config/database"
);


const {
    validarTokenPagoReservacion
} = require(
    "./tokenPagoReservacionService"
);


/* =========================================================
   OBTENER INFORMACIÓN PÚBLICA DE PAGO
========================================================= */

async function obtenerInformacionPagoPublico(
    tokenEntrada
) {

    /*
     * Primero se valida el token.
     *
     * Esta validación ya comprueba:
     * - existencia;
     * - revocación;
     * - vencimiento;
     * - reservación pendiente de pago;
     * - plazo de pago vigente.
     */

    const acceso =
        await validarTokenPagoReservacion(
            tokenEntrada
        );


    let conexion;


    try {

        conexion =
            await pool.getConnection();


        /* -------------------------------------------------
           MÉTODOS ACTIVOS DE LA AGENCIA

           Nunca se recibe agencia_id desde el cliente.

           La agencia proviene exclusivamente del token
           validado por el servidor.
        ------------------------------------------------- */

        const metodosPago =
            await conexion.query(
                `
                SELECT

                    id,
                    codigo,
                    nombre,
                    tipo,

                    banco,
                    titular,
                    tipo_cuenta,
                    numero_cuenta,

                    moneda,
                    instrucciones,

                    requiere_comprobante,

                    orden

                FROM metodos_pago_agencia

                WHERE
                    agencia_id = ?
                    AND activo = 1

                ORDER BY
                    orden ASC,
                    id ASC
                `,
                [
                    acceso.agencia.id
                ]
            );


        return {

            ok:
                true,

            agencia:
{

    id:
        acceso.agencia.id,

    nombre:
        acceso.agencia.nombre,

    slug:
        acceso.agencia.slug,

    logo:
        acceso.agencia.logo ||
        "",

    colorPrimario:
        acceso.agencia.colorPrimario ||
        "#0b1f3a",

    colorSecundario:
        acceso.agencia.colorSecundario ||
        "#ff8a00"

},

            reservacion:
            {

                id:
                    acceso.reservacion.id,

                codigo:
                    acceso.reservacion.codigo,

                estado:
                    acceso.reservacion.estado,

                clienteNombre:
                    acceso.reservacion.clienteNombre,

                total:
                    acceso.reservacion.total,

                montoAnticipoRequerido:
                    acceso.reservacion
                        .montoAnticipoRequerido,

                fechaLimitePago:
                    acceso.reservacion
                        .fechaLimitePago

            },

            metodosPago:
                metodosPago.map(
                    (
                        metodo
                    ) => ({

                        id:
                            Number(
                                metodo.id
                            ),

                        codigo:
                            metodo.codigo,

                        nombre:
                            metodo.nombre,

                        tipo:
                            metodo.tipo,

                        banco:
                            metodo.banco,

                        titular:
                            metodo.titular,

                        tipoCuenta:
                            metodo.tipo_cuenta,

                        numeroCuenta:
                            metodo.numero_cuenta,

                        moneda:
                            metodo.moneda,

                        instrucciones:
                            metodo.instrucciones,

                        requiereComprobante:
                            Boolean(
                                metodo
                                    .requiere_comprobante
                            ),

                        orden:
                            Number(
                                metodo.orden ||
                                0
                            )

                    })
                ),

            fechaExpiracion:
                acceso.fechaExpiracion

        };

    } finally {

        if (
            conexion
        ) {

            conexion.release();

        }

    }

}


/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports =
{

    obtenerInformacionPagoPublico

};