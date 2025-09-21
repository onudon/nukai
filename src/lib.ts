"use server"

import { getSyllabusResponse, parseCookie, refreshTimetable, setIndividualTimetable } from "./actions";
import { pool, SClass, TimeTable } from "./db"

export async function getTimetable(id: string) {

    const [rows] = await pool.query<[TimeTable]>("SELECT sois_id,password,timetable,saved_timetable FROM users WHERE sois_id = :id", { id });

    const result = rows[0];
    var availables: SClass[] = [];
    var saved: number[] = result.saved_timetable.split(',').map(v => Number(v));

    if (!result.timetable) {
        const res = await getSyllabusResponse(result.sois_id, result.password);
        const setCookie = res.headers.get('set-cookie');
        if (setCookie) {
            const cookie = await parseCookie(setCookie);
            availables = await refreshTimetable(cookie);
            const table = availables.map(v => v.id + ",").join("");
            setIndividualTimetable(id.toString(), table.substring(0, table.length - 1));
        } else {
            return null;
        }
    } else {
        const tids = result.timetable.split(',').map(v => Number(v));
        if (tids.length === 0) return null;
        const [trows] = await pool.query<SClass[]>("SELECT * FROM classes WHERE id IN (?)", [tids]);
        availables = trows;
    }

    return { availables, saved };
}