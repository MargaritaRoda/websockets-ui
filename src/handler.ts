import WebSocket from "ws";
import {
  AddShipsRequestRequest,
  AddUserToRoomRequest,
  AttackDataRequest,
  AttackStatus,
  Command,
  CommandResponse,
  CommandType,
  ExtensionWebSocket,
  Position,
  RandomAttackDataRequest,
  Room,
  ShipRequest,
  User,
  UserRegRequest,
} from "./types/types";
import {
  addSecondUserToRoom,
  createRoom,
  createUser,
  deleteRoomById,
  getAllRooms,
  getRoomById,
  getUserById,
  getUserByName,
  getUserWinners,
  incrementUserWinCount,
} from "./state";
import { bot, botTable, generateRandomAttackPosition } from "./types/bot";

function regSuccessResponse(user: User): CommandResponse {
  return {
    type: CommandType.REG,
    data: {
      name: user.name,
      index: user.id,
      error: false,
      errorText: "",
    },
    id: 0,
  };
}

function regErrorResponse(errorText: string): CommandResponse {
  return {
    type: CommandType.REG,
    data: {
      name: "",
      index: "",
      error: true,
      errorText: errorText,
    },
    id: 0,
  };
}

function updateWinnersResponse(users: User[]): CommandResponse {
  return {
    type: CommandType.UPDATE_WINNERS,
    data: users.map((user) => ({
      name: user.name,
      wins: user.wins,
    })),
    id: 0,
  };
}

function updateRoomsResponse(rooms: Room[]): CommandResponse {
  return {
    type: CommandType.UPDATE_ROOM,
    id: 0,
    data: rooms.map((room) => {
      const roomUsers = [getUserById(room.user1Id)];

      if (room.user2Id) {
        roomUsers.push(getUserById(room.user2Id));
      }

      return {
        roomId: room.id,
        roomUsers,
      };
    }),
  };
}

function createGameResponse(
  roomId: Room["id"],
  userId: User["id"]
): CommandResponse {
  return {
    type: CommandType.CREATE_GAME,
    id: 0,
    data: {
      idGame: roomId,
      idPlayer: userId,
    },
  };
}

function startGameResponse(
  userId: User["id"],
  ships: ShipRequest[]
): CommandResponse {
  return {
    type: CommandType.START_GAME,
    id: 0,
    data: {
      currentPlayerIndex: userId,
      ships,
    },
  };
}

function attackStatusResponse(
  position: {
    x: number;
    y: number;
  },
  userId: User["id"],
  status: AttackStatus
): CommandResponse {
  return {
    type: CommandType.ATTACK,
    id: 0,
    data: {
      position: position,
      currentPlayer: userId,
      status: status,
    },
  };
}

function turnResponse(nextUserId: User["id"]): CommandResponse {
  return {
    type: CommandType.TURN,
    id: 0,
    data: {
      currentPlayer: nextUserId,
    },
  };
}

function finishResponse(winnerUserId: User["id"]): CommandResponse {
  return {
    type: CommandType.FINISH,
    id: 0,
    data: {
      winPlayer: winnerUserId,
    },
  };
}

function sendResponse(
  response: CommandResponse,
  sockets: ExtensionWebSocket[]
) {
  for (const socket of sockets) {
    socket.send(
      JSON.stringify({
        type: response.type,
        data: JSON.stringify(response.data),
        id: 0,
      })
    );
  }
}

function sendUpdateWinners(allClients: ExtensionWebSocket[]) {
  const winners = getUserWinners();
  sendResponse(updateWinnersResponse(winners), allClients);
}

function sendUpdateRooms(allClients: ExtensionWebSocket[]) {
  const rooms = getAllRooms();
  sendResponse(updateRoomsResponse(rooms), allClients);
}

export const requestHandler = (
  message: Command,
  wsClient: ExtensionWebSocket,
  allClients: ExtensionWebSocket[]
) => {
  console.log("start handle command from user %d: ", wsClient.index, message);

  switch (message.type) {
    case CommandType.REG: {
      const data = message.data as UserRegRequest;

      if (getUserByName(data.name)) {
        sendResponse(regErrorResponse("User already exists"), [wsClient]);
        return;
      }

      const user = createUser(wsClient.index, data.name, data.password);

      sendResponse(regSuccessResponse(user), [wsClient]);

      sendUpdateWinners(allClients);
      sendUpdateRooms(allClients);

      break;
    }
    case CommandType.CREATE_ROOM: {
      createRoom(wsClient.index);
      sendUpdateRooms(allClients);
      break;
    }
    case CommandType.ADD_USER_TO_ROOM: {
      const data = message.data as AddUserToRoomRequest;

      const room = getRoomById(data.indexRoom);
      addSecondUserToRoom(data.indexRoom, wsClient.index);

      const firstClient = allClients.find(
        (client) => client.index === room.user1Id
      );

      sendResponse(createGameResponse(room.id, room.user1Id), [firstClient]);
      sendResponse(createGameResponse(room.id, room.user2Id), [wsClient]);
      break;
    }
    case CommandType.ADD_SHIPS: {
      const data = message.data as AddShipsRequestRequest;
      const room = getRoomById(data.gameId);
      const userId = wsClient.index;

      const clients = allClients.filter(
        (client) =>
          client.index === room.user1Id || client.index === room.user2Id
      );

      room.game.addUserTable(userId, data.ships);

      if (room.game.canStart) {
        sendResponse(
          startGameResponse(room.game.activeUserId, data.ships),
          clients
        );
        //==============================================================================
        if (room.game.user1Id === bot.id) {
          room.game.attack(
            generateRandomAttackPosition().x,
            generateRandomAttackPosition().y
          );
          const client = allClients.filter(
            (client) => client.index === room.user2Id
          );
          sendResponse(
            startGameResponse(room.game.activeUserId, data.ships),
            client
          );
        }
        //===================================================================================
      }

      break;
    }
    case CommandType.RANDOM_ATTACK:
    case CommandType.ATTACK: {
      const data = message.data as RandomAttackDataRequest;
      let room;
      try {
        room = getRoomById(data.gameId);
      } catch (err) {
        console.error(err);
        return;
      }
      const game = room.game;

      if (game.activeUserId !== data.indexPlayer) {
        console.log("Skip user %d shoot", data.indexPlayer);
        return;
      }

      let shotPosition: Position;

      switch (message.type) {
        case CommandType.RANDOM_ATTACK:
          const table = room.game.getUserTable(wsClient.index);
          shotPosition = table.getRandomPosition();
          break;
        case CommandType.ATTACK: {
          const data = message.data as AttackDataRequest;
          shotPosition = {
            x: data.x,
            y: data.y,
          };

          break;
        }
      }

      const clients = allClients.filter(
        (client) =>
          client.index === game.user1Id || client.index === game.user2Id
      );

      const attackResult = game.attack(shotPosition.x, shotPosition.y);

      sendResponse(
        attackStatusResponse(
          shotPosition,
          data.indexPlayer,
          attackResult.status
        ),
        clients
      );
      //====================================================
      if (room.game.user1Id === bot.id) {
        const client = allClients.filter(
          (client) => client.index === game.user2Id
        );

        sendResponse(
          attackStatusResponse(
            shotPosition,
            data.indexPlayer,
            attackResult.status
          ),
          client
        );
      }
      //=========================================================================================

      switch (attackResult.status) {
        case AttackStatus.killed: {
          for (const position of attackResult.missPositions) {
            sendResponse(
              attackStatusResponse(
                position,
                data.indexPlayer,
                AttackStatus.miss
              ),
              clients
            );
          }

          if (game.isFinished) {
            sendResponse(finishResponse(data.indexPlayer), clients);
            incrementUserWinCount(wsClient.index);
            sendUpdateWinners(allClients);
            deleteRoomById(room.id);
            sendUpdateRooms(allClients);
          }
          break;
        }
        case AttackStatus.shot: {
          break;
        }
        case AttackStatus.miss: {
          sendResponse(turnResponse(game.activeUserId), clients);

          //====================================
          if (room.game.user1Id === bot.id) {
            const client = allClients.filter(
              (client) => client.index === game.user2Id
            );

            sendResponse(turnResponse(game.activeUserId), client);

            const attackResult = game.attack(
              generateRandomAttackPosition().x,
              generateRandomAttackPosition().y
            );
            switch (attackResult.status) {
              case "miss": {
                sendResponse(turnResponse(game.activeUserId), client);
                break;
              }
              case "shot": {
                game.attack(
                  generateRandomAttackPosition().x,
                  generateRandomAttackPosition().y
                );
                break;
              }
              case "killed": {
                for (const position of attackResult.missPositions) {
                  sendResponse(
                    attackStatusResponse(
                      position,
                      data.indexPlayer,
                      AttackStatus.miss
                    ),
                    client
                  );
                }
                const humanClients = allClients.filter(
                  (c) => c.index !== bot.id
                );

                if (game.isFinished) {
                  sendResponse(finishResponse(data.indexPlayer), client);
                  incrementUserWinCount(bot.id);
                  sendUpdateWinners(humanClients);
                  deleteRoomById(room.id);
                  sendUpdateRooms(humanClients);
                }
                break;
              }
            }
          }
          //=====================================================

          break;
        }
      }
      break;
    }
    case CommandType.SINGLE_PLAY: {
      const user = createUser(bot.id, bot.name, bot.password);
      sendResponse(regSuccessResponse(user), [wsClient]);
      const room = createRoom(user.id);

      addSecondUserToRoom(room.id, wsClient.index);

      sendResponse(createGameResponse(room.id, wsClient.index), [wsClient]);

      // Add bot ships
      room.game.addUserTable(
        bot.id,
        botTable as AddShipsRequestRequest["ships"]
      );

      // Start the game by sending the first turn to the player
      sendResponse(turnResponse(wsClient.index), [wsClient]);

      break;
    }

    default: {
      console.error(`Unknown command type: `, message);
    }
  }
};
