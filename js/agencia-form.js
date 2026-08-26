/* =========================================================
   AUTORENTCAR - FORMULARIO DE AGENCIAS
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const nombre =
            document.getElementById(
                "nombre"
            );


        const vistaNombre =
            document.getElementById(
                "brand-preview-name"
            );


        const colorPrimario =
            document.getElementById(
                "color_primario"
            );


        const colorSecundario =
            document.getElementById(
                "color_secundario"
            );


        const valorPrimario =
            document.getElementById(
                "color-primario-value"
            );


        const valorSecundario =
            document.getElementById(
                "color-secundario-value"
            );


        const cabeceraPreview =
            document.getElementById(
                "agency-interface-preview-header"
            );


        const botonPreview =
            document.getElementById(
                "agency-interface-preview-button"
            );


        const inputLogo =
            document.getElementById(
                "logo"
            );


        const imagenLogo =
            document.getElementById(
                "agency-logo-image"
            );


        const placeholderLogo =
            document.getElementById(
                "agency-logo-placeholder"
            );


        const nombreLogo =
            document.getElementById(
                "agency-logo-name"
            );


        const logoMini =
            document.getElementById(
                "agency-interface-logo-mini"
            );


        const selectorPlan =
            document.getElementById(
                "plan_id"
            );


        const tarjetasPlan =
            document.querySelectorAll(
                "[data-plan-card]"
            );


        let urlPreviewLogo =
            null;


        /* =================================================
           NOMBRE
        ================================================= */

        function actualizarNombre() {

            if (!vistaNombre) {
                return;
            }


            vistaNombre.textContent =
                nombre?.value.trim() ||
                "Nueva agencia";

        }


        nombre?.addEventListener(
            "input",
            actualizarNombre
        );


        /* =================================================
           COLORES DE INTERFAZ
        ================================================= */

        function actualizarColores() {

            const primario =
                colorPrimario?.value ||
                "#0b1f3a";


            const secundario =
                colorSecundario?.value ||
                "#ff8a00";


            if (valorPrimario) {

                valorPrimario.textContent =
                    primario;

            }


            if (valorSecundario) {

                valorSecundario.textContent =
                    secundario;

            }


            if (cabeceraPreview) {

                cabeceraPreview.style.background =
                    primario;

            }


            if (botonPreview) {

                botonPreview.style.background =
                    secundario;

            }

        }


        colorPrimario?.addEventListener(
            "input",
            actualizarColores
        );


        colorSecundario?.addEventListener(
            "input",
            actualizarColores
        );


        /* =================================================
           LOGO
        ================================================= */

        function limpiarPreviewAnterior() {

            if (urlPreviewLogo) {

                URL.revokeObjectURL(
                    urlPreviewLogo
                );


                urlPreviewLogo =
                    null;

            }

        }


        inputLogo?.addEventListener(
            "change",
            () => {

                const archivo =
                    inputLogo.files?.[0];


                limpiarPreviewAnterior();


                if (!archivo) {

                    if (imagenLogo) {

                        imagenLogo.hidden =
                            true;

                        imagenLogo.removeAttribute(
                            "src"
                        );

                    }


                    if (placeholderLogo) {

                        placeholderLogo.hidden =
                            false;

                    }


                    if (nombreLogo) {

                        nombreLogo.textContent =
                            "Ningún archivo seleccionado";

                    }


                    if (logoMini) {

                        logoMini.innerHTML =
                            '<i class="fa-regular fa-image"></i>';

                    }


                    return;

                }


                const tiposPermitidos = [
                    "image/png",
                    "image/jpeg",
                    "image/webp"
                ];


                if (
                    !tiposPermitidos.includes(
                        archivo.type
                    )
                ) {

                    alert(
                        "Selecciona una imagen PNG, JPG, JPEG o WebP."
                    );


                    inputLogo.value =
                        "";


                    return;

                }


                const maximo =
                    3 * 1024 * 1024;


                if (
                    archivo.size >
                    maximo
                ) {

                    alert(
                        "El logo no puede superar los 3 MB."
                    );


                    inputLogo.value =
                        "";


                    return;

                }


                urlPreviewLogo =
                    URL.createObjectURL(
                        archivo
                    );


                if (imagenLogo) {

                    imagenLogo.src =
                        urlPreviewLogo;

                    imagenLogo.hidden =
                        false;

                }


                if (placeholderLogo) {

                    placeholderLogo.hidden =
                        true;

                }


                if (nombreLogo) {

                    nombreLogo.textContent =
                        archivo.name;

                }


                if (logoMini) {

                    logoMini.innerHTML = "";


                    const miniImagen =
                        document.createElement(
                            "img"
                        );


                    miniImagen.src =
                        urlPreviewLogo;


                    miniImagen.alt =
                        "Logo";


                    logoMini.appendChild(
                        miniImagen
                    );

                }

            }
        );


        /* =================================================
           PLAN
        ================================================= */

        function actualizarPlan() {

            const planSeleccionado =
                selectorPlan?.value ||
                "";


            tarjetasPlan.forEach(
                (tarjeta) => {

                    tarjeta.classList.toggle(
                        "selected",

                        tarjeta.dataset.planCard ===
                            planSeleccionado
                    );

                }
            );

        }


        selectorPlan?.addEventListener(
            "change",
            actualizarPlan
        );


        /* =================================================
           LIMPIEZA
        ================================================= */

        window.addEventListener(
            "beforeunload",
            limpiarPreviewAnterior
        );


        /* =================================================
           INICIALIZACIÓN
        ================================================= */

        actualizarNombre();

        actualizarColores();

        actualizarPlan();

    }
);