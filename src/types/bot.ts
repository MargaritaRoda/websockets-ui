import {Position} from "./types";
export const bot = {
    id: -1,
    name: "Capitan Morgan",
    password: '777',
    wins: 0,
}

export const botTable = [
        {
            position: { x: 5, y: 2 },
            direction: false,
            type: 'huge',
            length: 4,

        },
        {
            position: { x: 7, y: 2 },
            direction: true,
            type: 'large',
            length: 3,

        },
        {
            position: { x: 3, y: 7 },
            direction: true,
            type: 'large',
            length: 3,

        },
        {
            position: { x: 7, y: 9},
            direction: false,
            type: 'medium',
            length: 2,

        },
        {
            position: { x:1, y: 8 },
            direction: false,
            type: 'medium',
            length: 2,
            rest: 2
        },
        {
            position: { x: 4, y: 0 },
            direction: true,
            type: 'medium',
            length: 2,

        },
        {
            position: { x: 0, y: 0 },
            direction: true,
            type: 'small',
            length: 1,

        },
        {
            position: { x: 1, y: 2 },
            direction: true,
            type: 'small',
            length: 1,

        },
        {
            position: { x: 1, y: 6 },
            direction: true,
            type: 'small',
            length: 1,

        },
        {
            position: { x: 8, y: 4 },
            direction: false,
            type: 'small',
            length: 1,

        }

]

export function generateRandomAttackPosition(): Position {
    const x = Math.floor(Math.random() * 10); // Generate random number between 0 and 9 for x coordinate
    const y = Math.floor(Math.random() * 10); // Generate random number between 0 and 9 for y coordinate
    return { x, y };
}