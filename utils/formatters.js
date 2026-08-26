/* =========================================================
   UTILIDADES DE FORMATO
========================================================= */

/**
 * Formatea valores monetarios
 */
function formatoMoneda(valor) {

    if (
        valor === null ||
        valor === undefined
    ) {

        return "USD $0.00";

    }


    return new Intl.NumberFormat(
        "en-US",
        {
            style: "currency",
            currency: "USD"
        }

    ).format(
        Number(valor)
    );

}

/**
 * Formatea fechas para mostrar
 */
function formatoFecha(fecha) {


    if (!fecha) {

        return "No disponible";

    }


    return new Date(fecha)
        .toLocaleDateString(
            "es-DO",
            {
                year: "numeric",
                month: "long",
                day: "numeric"
            }
        );

}

module.exports = {

    formatoMoneda,

    formatoFecha

};