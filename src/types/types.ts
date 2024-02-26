import WebSocket from "ws";

export interface ExtensionWebSocket extends WebSocket {
  index: number;
}

export enum CommandType {
  REG = "reg", // registration/login user
  CREATE_ROOM = "create_room",
  CREATE_GAME = "create_game",
  START_GAME = "start_game",
  TURN = "turn", // who is shooting now
  ATTACK = "attack", // coordinates of shot and status
  FINISH = "finish", //id of winner
  UPDATE_ROOM = "update_room", //list of rooms and players in rooms
  UPDATE_WINNERS = "update_winners", //send score table to  all players
  ADD_SHIPS = "add_ships",
  RANDOM_ATTACK = "randomAttack",
  ADD_USER_TO_ROOM = "add_user_to_room",
}

export interface Command {
  type: CommandType;
  data: unknown;
}

export function isCommand(x: unknown): x is Command {
  return (
    typeof x === "object" &&
    "type" in x &&
    typeof x.type === "string" &&
    Object.values(CommandType).includes(x.type as CommandType) &&
    "data" in x
  );
}

export type UserRegRequest = {
  name: string;
  password: string;
};

export type AddUserToRoomRequest = {
  indexRoom: number;
};

export type Position = {
  x: number;
  y: number;
};

export enum AttackStatus {
  miss = "miss",
  killed = "killed",
  shot = "shot",
}

export type ShipRequest = {
  position: Position;
  direction: boolean;
  length: number;
  type: "small" | "medium" | "large" | "huge";
};

export type AddShipsRequestRequest = {
  gameId: number; // roomId
  indexPlayer: number;
  ships: ShipRequest[];
};

export type RandomAttackDataRequest = {
  gameId: number;
  indexPlayer: number;
};

export type AttackDataRequest = {
  gameId: number;
  indexPlayer: number;
  x: number;
  y: number;
};

export type CommandResponse = {
  type: CommandType;
  data: unknown;
  id: 0;
};

export interface User {
  id: number;
  name: string;
  password: string;
  wins: number;
}

export type AttackResult = {
  status: AttackStatus;
  missPositions: Position[];
};

export interface ITable {
  allKilled: boolean;
  attack(x: number, y: number): AttackResult;

  getRandomPosition(): Position;
}

export interface IGame {
  user1Id: User["id"];
  user2Id: User["id"];
  activeUserId: User["id"];

  isFinished: boolean;
  canStart: boolean;

  addUserTable(userId: User["id"], ship: ShipRequest[]): void;
  attack(x: number, y: number): AttackResult;
  getUserTable(userId: User["id"]): ITable;
}

export interface Room {
  id: number;
  user1Id: number;
  user2Id: number | null;

  game: IGame | null;
}
