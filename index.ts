import { httpServer } from "./src/http_server";
import { ws_server_start } from "./ws_server/ws_server";

const httpPort = parseInt(process.env.HTTP_SERVER_PORT, 10) || 8181;
console.log(`Start static http server on the ${httpPort} port!`);
httpServer.listen(httpPort);
ws_server_start();
