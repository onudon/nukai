'use server';

import { z } from "zod";
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { pool, SClass, User } from './db';
import jwt from 'jsonwebtoken';

export default async function login(formData: FormData) {
    const id = Number(formData.get('id'));
    const password = formData.get('password') as string;

    if (!z.number().min(100000).max(999999).safeParse(id).success) {
        return
    }
    if (!z.string().min(6).max(30).regex(/^[a-zA-Z0-9]+$/).safeParse(password).success) {
        return
    }

    const [rows] = await pool.query<[User]>("SELECT * FROM users WHERE sois_id = :id", { id })
    if (+rows.length === 0) {
        redirect("/login?error=1")
    }
    const user: User = rows[0];
    // if (false) {
    if (user.registered) {
        if (user.password !== password) {
            user.password = ""
            redirect("/login?error=1")
        }
    } else {
        if (await checkLogin(id, password)) {
            await pool.query("UPDATE users SET registered = true, password = :password WHERE id = :id", { password, id: user.id })
        } else {
            redirect("/login?error=1")
        }
    }

    const token = jwt.sign({ id }, process.env.JWT_SECRET!, { expiresIn: '7d' });

    const cookieStore = await cookies();
    cookieStore.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7d
        sameSite: 'lax'
    });
    redirect("/")
}

async function checkLogin(id: number, password: string) {
    //Validation

    const res = await getSyllabusResponse(id, password)

    if ((await res.status) === 302) {
        const setCookie = res.headers.get('set-cookie');
        if (setCookie) {
            const cookie = await parseCookie(setCookie);
            const result = await refreshTimetable(cookie)
            const table = result.map(v => v.id + ",").join("");
            setIndividualTimetable(id.toString(), table.substring(0, table.length - 1));
        }
        return true
    } else {
        return false
    }

}

export async function parseCookie(oldCookie: string) {
    return oldCookie.split(';')[0].substring("main/OPENSYLLABUS=".length)
}

export async function getSyllabusResponse(id: number, password: string) {

    const pre = await fetch("https://syllabus-view.kwansei.ac.jp/main/web/login/view/")
    const text = await pre.text()
    const start = text.indexOf('<input type="hidden" name="_token" value="')

    const token = text.substring(start + 42, start + 82)

    var cookie: string = String(pre.headers.getSetCookie()[0])
    cookie = cookie.split(';')[0];

    const headers = new Headers();
    headers.append('Host', 'syllabus-view.kwansei.ac.jp');
    headers.append('Content-Type', 'application/x-www-form-urlencoded');
    headers.append('Cookie', cookie);

    const res = await fetch('http://syllabus-view.kwansei.ac.jp/main/web/login/login/', {
        method: 'POST',
        headers: headers,
        body: "_token=" + token + "&TXT_ST_ID=" + id + "&TXT_ST_PW=" + password,
        redirect: 'manual'
    });
    return res
}
export async function refreshTimetable(cookie: string) {
    const apiRes = await fetch((process.env.API_URL + "/scrape?cookie=" + cookie), { method: 'GET' })

    const cdata: { [key: string]: SClass } = await apiRes.json();

    const entries = Object.entries(cdata).map(([key, value]) => value);

    entries.forEach(async (value) => {
        await pool.query(`INSERT INTO classes (id, name, timetable, days, section, registed_max) VALUES 
            (:id, :name, :timetable, :days, :section, :registed_max)
            ON DUPLICATE KEY 
            UPDATE name=:name, timetable=:timetable, days=:days, section=:section, registed_max=:registed_max`,
            value);
    });

    return entries;
}

export async function setIndividualTimetable(id: string, timetable: string) {
    await pool.query(
        'UPDATE users SET timetable=:timetable WHERE sois_id=:sois_id',
        {
            timetable,
            sois_id: id
        }
    );
}
