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
