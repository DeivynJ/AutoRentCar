/* =========================================================
   AUTORENTCAR - PANEL DE AGENCIA
========================================================= */

function mostrarInicioPanel(
    req,
    res
) {

    return res.render(
        "panel/inicio",
        {
            titulo:
                "Dashboard",

            subtituloPagina:
                "Panel de agencia",

            paginaActual:
                "dashboard",

            usuario:
                req.usuarioAgencia,

            agencia:
                req.agencia,

            suscripcion:
                req.suscripcion,

            plan:
                req.plan
        }
    );

}


module.exports = {
    mostrarInicioPanel
};