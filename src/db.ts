import * as mysql from "mysql2/promise";

export const pool = (await mysql.createPool({
    host: "localhost",
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "nukai",
    port: 3306,
    connectionLimit: 50000,
    namedPlaceholders: true
}));


export interface User extends mysql.RowDataPacket {
    id: number,
    sois_id: number,
    name: string,
    registered: boolean,
    password: string,
    perm: string,
    point: number,
}

export interface TimeTable extends mysql.RowDataPacket {
    sois_id: number
    password: string
    timetable: string
    saved_timetable: string
}


export interface SClass extends mysql.RowDataPacket {
    id: number,
    name: string,
    timetable: string,
    days: boolean,
    section: number,
    registed_max: string,
}

export async function getUserById(id: number): Promise<User | null> {
    const [rows] = await pool.query<User[]>(
        'SELECT id, sois_id, name, registered, perm, point FROM users WHERE sois_id = :id',
        { id }
    );
    
    return rows.length > 0 ? rows[0] : null;
}

// export async function getAllUsers(): Promise<User[]> {
//     const [rows] = await pool.query<User[]>(
//         'SELECT id, sois_id, name, registered, perm, point FROM users ORDER BY name'
//     );
    
//     return rows;
// }

export async function updateUserPoints(userId: number, newPoints: number): Promise<void> {
    await pool.query(
        'UPDATE users SET point = :newPoints WHERE id = :userId',
        { newPoints, userId }
    );
}
