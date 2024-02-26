import {
  AttackResult,
  AttackStatus,
  IGame,
  ITable,
  Position,
  Room,
  ShipRequest,
  User,
} from "./types/types";

const users: User[] = [];
const rooms: Room[] = [];

let roomId = 1;

/* ===================================================================================================================*/

export function createUser(id: number, name: string, password: string): User {
  const user = {
    id,
    name,
    password,
    wins: 0,
  };

  users.push(user);

  return user;
}

export const getUserById = (id: User["id"]): User => {
  const user = users.find((u) => u.id === id);
  if (!user) {
    throw new Error(`User is not found by id ${id}`);
  }
  return user;
};
export const getUserByName = (name: User["name"]): User | null => {
  const user = users.find((u) => u.name === name);
  return user || null;
};

export function getUserWinners(): User[] {
  const winners = users.filter((u) => u.wins > 0);
  winners.sort();
  return winners;
}

export function incrementUserWinCount(id: User["id"]) {
  const user = users.find((u) => u.id === id);
  user.wins += 1;
}

export function removeUser(userId: User["id"]) {}

/* ===================================================================================================================*/

export const getRoomById = (id: Room["id"]): Room => {
  const room = rooms.find((r) => r.id === id);
  if (!room) {
    throw new Error(`Room is not found by id ${id}`);
  }
  return room;
};

export function getAllRooms(): Room[] {
  return rooms;
}

export function createRoom(userId: User["id"]): Room {
  const room: Room = {
    id: roomId++,
    user1Id: userId,
    user2Id: null,
    game: null,
  };
  rooms.push(room);
  return room;
}

export function addSecondUserToRoom(id: Room["id"], user2Id: Room["user2Id"]) {
  const room = rooms.find((r) => r.id === id);
  room.user2Id = user2Id;

  room.game = new Game(room.user1Id, room.user2Id, room.user1Id);
}

export function deleteRoomById(id: Room["id"]) {
  const roomInd = rooms.findIndex((r) => r.id === id);
  rooms.splice(roomInd, 1);
}

/* ===================================================================================================================*/

enum CellStatus {
  empty = 0,
  ship = 1,
  killed = 2,
  missed = 3,
}

enum Direction {
  left = 0,
  right = 1,
  up = 2,
  down = 3,
}

const TABLE_SIZE = 10;

export class Table implements ITable {
  readonly table: Array<Array<CellStatus>>;

  static getShipArea(ship: ShipRequest): Position[] {
    let shipArea: Position[] = [];
    const startX = ship.position.x;
    const startY = ship.position.y;
    const length = ship.length;

    if (!ship.direction) {
      // Vertical
      for (let i = 0; i < length; i++) {
        let x = ship.position.x + i;
        shipArea.push({ x, y: startY });
      }
    } else {
      // Horizontal

      for (let i = 0; i < length; i++) {
        let y = startY + i;
        shipArea.push({ x: startX, y });
      }
    }

    return shipArea;
  }

  static isKilled(
    table: Array<Array<CellStatus>>,
    startX: number,
    startY: number
  ): boolean {
    for (const dir of Object.values(Direction)) {
      let x = startX;
      let y = startY;
      switch (dir) {
        case Direction.left: {
          while (
            x >= 0 &&
            table[y][x] !== CellStatus.empty &&
            table[y][x] !== CellStatus.missed
          ) {
            if (table[y][x] === CellStatus.ship) {
              return false;
            }
            x -= 1;
          }
          break;
        }
        case Direction.right: {
          while (
            x < TABLE_SIZE &&
            table[y][x] !== CellStatus.empty &&
            table[y][x] !== CellStatus.missed
          ) {
            if (table[y][x] === CellStatus.ship) {
              return false;
            }
            x += 1;
          }
          break;
        }
        case Direction.up: {
          while (
            y >= 0 &&
            table[y][x] !== CellStatus.empty &&
            table[y][x] !== CellStatus.missed
          ) {
            if (table[y][x] === CellStatus.ship) {
              return false;
            }
            y -= 1;
          }
          break;
        }
        case Direction.down: {
          while (
            y < TABLE_SIZE &&
            table[y][x] !== CellStatus.empty &&
            table[y][x] !== CellStatus.missed
          ) {
            if (table[y][x] === CellStatus.ship) {
              return false;
            }
            y += 1;
          }
          break;
        }
      }
    }

    return true;
  }

  constructor(ships: ShipRequest[]) {
    const row = [];
    for (let j = 0; j < TABLE_SIZE; j += 1) {
      row.push(CellStatus.empty);
    }

    const table = [];
    for (let i = 0; i < TABLE_SIZE; i += 1) {
      table.push([...row]);
    }

    for (const ship of ships) {
      for (const position of Table.getShipArea(ship)) {
        table[position.y][position.x] = CellStatus.ship;
      }
    }

    this.table = table;
  }

  get allKilled(): boolean {
    for (let i = 0; i < TABLE_SIZE; i += 1) {
      const hasShip = this.table[i].some(
        (status) => status === CellStatus.ship
      );
      if (hasShip) {
        return false;
      }
    }
    return true;
  }

  getMissedPositionsAround(startX: number, startY: number): Position[] {
    const positions: Position[] = [];
    const table = this.table;

    function pushAround(table: Array<Array<CellStatus>>, x: number, y: number) {
      let _x;
      let _y;
      for (let incX of [0, -1, 1]) {
        _x = x + incX;
        for (let incY of [0, -1, 1]) {
          _y = y + incY;
          if (_x < 0 || _y < 0 || _x >= TABLE_SIZE || _y >= TABLE_SIZE) {
            continue;
          }
          console.log({ _x, _y });
          if (table[_y][_x] === CellStatus.empty) {
            positions.push({ x: _x, y: _y });
          }
        }
      }
    }

    for (const dir of Object.values(Direction)) {
      let x = startX;
      let y = startY;
      switch (dir) {
        case Direction.left: {
          while (x >= 0 && table[y][x] === CellStatus.killed) {
            pushAround(this.table, x, y);
            x -= 1;
          }
          break;
        }
        case Direction.right: {
          while (x < TABLE_SIZE && table[y][x] === CellStatus.killed) {
            pushAround(this.table, x, y);
            x += 1;
          }
          break;
        }
        case Direction.up: {
          while (y >= 0 && table[y][x] === CellStatus.killed) {
            pushAround(this.table, x, y);
            y -= 1;
          }
          break;
        }
        case Direction.down: {
          while (y < TABLE_SIZE && table[y][x] === CellStatus.killed) {
            pushAround(this.table, x, y);
            y += 1;
          }
          break;
        }
      }
    }
    return positions;
  }

  attack(x: number, y: number): AttackResult {
    switch (this.table[y][x]) {
      case CellStatus.ship: {
        this.table[y][x] = CellStatus.killed;

        const isKilled: boolean = Table.isKilled(this.table, x, y);

        if (isKilled) {
          const missPositions: Position[] = this.getMissedPositionsAround(x, y);

          for (const { x, y } of missPositions) {
            this.table[y][x] = CellStatus.missed;
          }

          return { status: AttackStatus.killed, missPositions };
        }
        return { status: AttackStatus.shot, missPositions: [] };
      }
      default: {
        this.table[y][x] = CellStatus.missed;
        return { status: AttackStatus.miss, missPositions: [] };
      }
    }
  }

  getRandomPosition(): Position {
    for (let x = 0; x < TABLE_SIZE; x += 1) {
      for (let y = 0; y < TABLE_SIZE; y += 1) {
        if (this.table[y][x] !== CellStatus.missed) {
          return {
            x,
            y,
          };
        }
      }
    }
    return {
      x: -1,
      y: -1,
    };
  }
}

/* ===================================================================================================================*/

class Game implements IGame {
  readonly user1Id: User["id"];
  readonly user2Id: User["id"];

  activeUserId: User["id"];

  user1Table: ITable | null;
  user2Table: ITable | null;

  constructor(
    user1Id: User["id"],
    user2Id: User["id"],
    activeUserId: User["id"]
  ) {
    this.user1Id = user1Id;
    this.user2Id = user2Id;
    this.activeUserId = activeUserId;
    this.user1Table = null;
    this.user2Table = null;
  }

  getUserTable(userId: User["id"]): ITable {
    if (userId === this.user1Id) {
      return this.user1Table;
    }
    return this.user2Table;
  }

  attack(x: number, y: number): AttackResult {
    const oppositeUserId =
      this.activeUserId === this.user1Id ? this.user2Id : this.user1Id;
    const table: ITable = this.getUserTable(oppositeUserId);
    const result = table.attack(x, y);

    if (result.status === AttackStatus.miss) {
      this.activeUserId = oppositeUserId;
    }

    return result;
  }

  addUserTable(userId: User["id"], ships: ShipRequest[]) {
    if (userId === this.user1Id) {
      this.user1Table = new Table(ships);
    } else {
      this.user2Table = new Table(ships);
    }
  }

  get isFinished(): boolean {
    return this.user1Table.allKilled || this.user2Table.allKilled;
  }

  get canStart(): boolean {
    return this.user1Table !== null && this.user2Table !== null;
  }
}
