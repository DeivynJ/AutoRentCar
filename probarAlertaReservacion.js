require("dotenv").config();

const {
    generarAlertasEntregaPendiente
} = require(
    "./services/alertasReservacionAgenciaService"
);


(async () => {

    try {

        const resultado =
            await generarAlertasEntregaPendiente();


        console.log(
            "Resultado alerta entrega:",
            resultado
        );


        process.exit(0);


    } catch (error) {

        console.error(
            "Error generando alerta:",
            error
        );


        process.exit(1);

    }

})();