import WebSocket from "ws";
import {ExtensionWebSocket, isCommand} from '../src/types/types'
import {requestHandler} from "../src/handler";
import {removeUser} from './../src/state'

const ws_port = parseInt(process.env.WEBSOCKET_SERVER_PORT, 10) || 3000;


export const clients: ExtensionWebSocket[] = [];

export const ws_server_start = () => {
  let clientId = 1

  const ws = new WebSocket.Server({ port: ws_port }, () => {
    console.log(`Start Web Socket server on the ${ws_port} port!`);

    ws.on("connection", (wsClient: ExtensionWebSocket) => {
      wsClient.index = clientId++;
      clients.push(wsClient);
      console.log('Added clint socker %s', wsClient.index, clients.map(s => s.index))


      wsClient.on("message", async (message) => {
        // console.log('wsClient message from %d', wsClient.index, message, clients.map(s => s.index))

        let msg
        try {
          msg = JSON.parse(message.toString())
          if (msg['data']) {
            msg['data'] = JSON.parse(msg['data'])
          }
        } catch (err) {
          console.error('Bad message: ', message)
          return
        }

        if (!isCommand(msg)) {
          console.error('Unknown command: ', message)
          return
        }

        requestHandler(msg, wsClient, clients);
      });

      wsClient.on("close", async (message) => {
        removeUser(wsClient.index)
        let clientIndex = clients.findIndex(c => c.index === wsClient.index)
        clients.splice(clientIndex, 1)

        console.log(
          'wsClient close from %d', wsClient.index, message, clients.map(s => s.index)
        )

      });
    });
  });
};
