import { Table } from './state'
import { ShipRequest, AttackStatus } from './types/types'

const TEST_SHIPS: ShipRequest[] = [
  {
    'position':
      {
        'x': 5,
        'y': 7,
      },
    'direction': false,
    'type': 'huge',
    'length': 4,
  },
  {
    'position':
      {
        'x': 5,
        'y': 0,
      },
    'direction': false,
    'type': 'large',
    'length': 3,
  },
  {
    'position':
      {
        'x': 0,
        'y': 7,
      },
    'direction': false,
    'type': 'large',
    'length': 3,
  },
  {
    'position':
      {
        'x': 2,
        'y': 5,
      },
    'direction': false,
    'type': 'medium',
    'length': 2,
  },
  {
    'position':
      {
        'x': 8,
        'y': 3,
      },
    'direction': true,
    'type': 'medium',
    'length': 2,
  },
  {
    'position':
      {
        'x': 2,
        'y': 0,
      },
    'direction': true,
    'type': 'medium',
    'length': 2,
  },
  {
    'position':
      {
        'x': 0,
        'y': 2,
      },
    'direction': false,
    'type': 'small',
    'length': 1,
  },
  {
    'position':
      {
        'x': 4,
        'y': 2,
      },
    'direction': false,
    'type': 'small',
    'length': 1,
  },
  {
    'position':
      {
        'x': 7,
        'y': 9,
      },
    'direction': true,
    'type': 'small',
    'length': 1,
  },
  {
    'position':
      {
        'x': 0,
        'y': 0,
      },
    'direction': false,
    'type': 'small',
    'length': 1,
  },
]

describe('Table', () => {
  test('getShipArea with horizontal', () => {
    const ship: ShipRequest = {
      'position':
        {
          'x': 5,
          'y': 7,
        },
      'direction': false,
      'type': 'huge',
      'length': 4,
    }

    expect(Table.getShipArea(ship)).toStrictEqual([
      {
        'x': 5,
        'y': 7,
      },
      {
        'x': 6,
        'y': 7,
      },
      {
        'x': 7,
        'y': 7,
      },
      {
        'x': 8,
        'y': 7,
      },
    ])
  })

  test('getShipArea with horizontal length 2', () => {
    const ship: ShipRequest = {
      'position':
        {
          'x': 2,
          'y': 5,
        },
      'direction': false,
      'type': 'medium',
      'length': 2,
    }

    expect(Table.getShipArea(ship)).toStrictEqual([
      {
        'x': 2,
        'y': 5,
      },
      {
        'x': 3,
        'y': 5,
      },
    ])
  })

  test('getShipArea with vertical', () => {
    const ship: ShipRequest = {
      'position':
        {
          'x': 8,
          'y': 3,
        },
      'direction': true,
      'type': 'medium',
      'length': 2,
    }

    expect(Table.getShipArea(ship)).toStrictEqual([
      {
        'x': 8,
        'y': 3,
      },
      {
        'x': 8,
        'y': 4,
      },
    ])
  })

  test('getShipArea in corner', () => {
    const ship: ShipRequest = {
      'position':
        {
          'x': 9,
          'y': 9,
        },
      'direction': true,
      'type': 'small',
      'length': 1,
    }

    expect(Table.getShipArea(ship)).toStrictEqual([
      {
        'x': 9,
        'y': 9,
      },
    ])
  })

  test('ships table ', () => {

    const table = new Table(TEST_SHIPS)
    expect(table.table).toStrictEqual(
      [
        [1, 0, 1, 0, 0, 1, 1, 1, 0, 0],
        [0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
        [1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
        [0, 0, 1, 1, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [1, 1, 1, 0, 0, 1, 1, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
      ],
    )
  })

  test('allKilled false', () => {
    const table = new Table(TEST_SHIPS)
    expect(table.allKilled).toBe(false)
  })

  test('allKilled true', () => {
    const table = new Table([])
    expect(table.allKilled).toBe(true)
  })

  test('attack miss', () => {
    const table = new Table(TEST_SHIPS)
    expect(table.attack(1, 0)).toStrictEqual({
      status: AttackStatus.miss,
      missPositions: [],
    })
    expect(table.table[0][1]).toBe(3)
  })

  test('isKilled true', () => {
    const table = [
      [2, 0, 2, 0, 0, 1, 1, 1, 0, 0],
      [0, 0, 2, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
      [0, 0, 1, 1, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 0, 0, 1, 2, 2, 2, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    ]

    expect(Table.isKilled(table, 0, 0)).toBe(true)

    expect(Table.isKilled(table, 2, 0)).toBe(true)
    expect(Table.isKilled(table, 2, 1)).toBe(true)

    expect(Table.isKilled(table, 6, 7)).toBe(false)
    expect(Table.isKilled(table, 7, 7)).toBe(false)
    expect(Table.isKilled(table, 8, 7)).toBe(false)
  })

  test('attack killed', () => {
    const table = new Table(TEST_SHIPS)
    table.attack(0, 0)
    // expect(table.attack(0, 0)).toStrictEqual({
    //   status: AttackStatus.killed,
    //   missPositions: [
    //     {x: 1, y: 0},
    //     {x: 0, y: 1},
    //     {x: 1, y: 1},
    //   ]
    // })
    expect(table.table[0][0]).toBe(2)
    expect(table.table[0][1]).toBe(3)
    expect(table.table[1][0]).toBe(3)
    expect(table.table[1][1]).toBe(3)
  })

})
