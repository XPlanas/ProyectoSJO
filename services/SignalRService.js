import {getDataAsync, UpdateData} from "../js/llamadas.js";
const SignalRConnection = new signalR.HubConnectionBuilder()
    .withUrl("https://pruebasjo.polarier.com:501/signalr")
    .configureLogging(signalR.LogLevel.Information)
    .build();

export async function startSignalR() {
    try {
        await SignalRConnection.start();
        console.log("SignalR Connected.");

        //Evento que se lanzará cuando se reciba una nueva venta
        SignalRConnection.on("NewVenta", (data) => {
            console.log("NewVenta registered", data);
            document.getElementById("cantidadField").innerText = new Date(data.fecha).toLocaleTimeString();
            UpdateData();
        });
    } catch (err) {
        console.error(err);
        setTimeout(startSignalR, 5000);
    }
}

SignalRConnection.onclose(async () => {
    await startSignalR();
});