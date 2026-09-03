/* =========================================================
   AUTORENTCAR - CATÁLOGO DEL PANEL
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const input =
            document.getElementById(
                "imagen"
            );


        const imagen =
            document.getElementById(
                "panel-image-preview-img"
            );


        const vacio =
            document.getElementById(
                "panel-image-empty"
            );


        const nombreArchivo =
            document.getElementById(
                "panel-image-file-name"
            );


        if (
            !input ||
            !imagen
        ) {

            return;

        }


        input.addEventListener(
            "change",
            () => {

                const archivo =
                    input.files?.[0];


                if (!archivo) {

                    if (
                        nombreArchivo
                    ) {

                        nombreArchivo.textContent =
                            "Ningún archivo nuevo seleccionado";

                    }


                    return;

                }


                if (
                    nombreArchivo
                ) {

                    nombreArchivo.textContent =
                        archivo.name;

                }


                const lector =
                    new FileReader();


                lector.addEventListener(
                    "load",
                    () => {

                        imagen.src =
                            lector.result;


                        imagen.hidden =
                            false;


                        if (vacio) {

                            vacio.hidden =
                                true;

                        }

                    }
                );


                lector.readAsDataURL(
                    archivo
                );

            }
        );

    }
);