/* =========================================================
   AUTORENTCAR - MÓDULO DE AGENCIAS
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const buscador =
            document.getElementById(
                "agency-search"
            );

        const filtroEstado =
            document.getElementById(
                "agency-status-filter"
            );

        const filas =
            Array.from(
                document.querySelectorAll(
                    ".agency-row"
                )
            );

        const sinResultados =
            document.getElementById(
                "agency-no-results"
            );


        /* =================================================
           FILTRAR AGENCIAS
        ================================================= */

        function filtrarAgencias() {

            const texto =
                (
                    buscador?.value ||
                    ""
                )
                    .trim()
                    .toLowerCase();


            const estado =
                filtroEstado?.value ||
                "";


            let visibles = 0;


            filas.forEach(
                (fila) => {

                    const textoFila =
                        fila.dataset.search ||
                        "";

                    const estadoFila =
                        fila.dataset.status ||
                        "";


                    const coincideTexto =
                        !texto ||
                        textoFila.includes(
                            texto
                        );


                    const coincideEstado =
                        !estado ||
                        estadoFila ===
                        estado;


                    const mostrar =
                        coincideTexto &&
                        coincideEstado;


                    fila.hidden =
                        !mostrar;


                    if (mostrar) {
                        visibles += 1;
                    }

                }
            );


            if (sinResultados) {

                sinResultados.hidden =
                    visibles !== 0 ||
                    filas.length === 0;
            }

        }


        /* =================================================
           EVENTOS
        ================================================= */

        buscador?.addEventListener(
            "input",
            filtrarAgencias
        );


        filtroEstado?.addEventListener(
            "change",
            filtrarAgencias
        );

    }
);