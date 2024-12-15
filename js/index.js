import { startSignalR } from "../services/SignalRService";
import { getDataAsync, UpdateData } from "./llamadas";

//Carga inicial de datos
getDataAsync().then((response) => {
    UpdateData(response)
    startSignalR();
});
