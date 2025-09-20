'use server';

import { set, z } from "zod";
import { redirect } from 'next/navigation';
import { pool, User } from './db';

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
    if (false) {
    // if (user.registered) {
        if (user.password !== password) {
            user.password = ""
            redirect("/login?error=1")
        }
    }else {
        if (await checkLogin(id, password)) {
            await pool.query("UPDATE users SET registered = true, password = :password WHERE id = :id", { password, id: user.id })
        }else {
            redirect("/login?error=1")
        }
    }
    redirect("/")
}

async function checkLogin(id: number, password: string) {
    //Validation

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
        body: "_token="+token+"&TXT_ST_ID="+id+"&TXT_ST_PW="+password,
        redirect: 'manual'
    });
    if ((await res.status) === 302) {
        const setCookie = res.headers.get('set-cookie');
        if (setCookie) {
            cookie = setCookie.split(';')[0].substring("main/OPENSYLLABUS=".length);
            console.log(process.env.API_URL + "/scrape?cookie=" + cookie)
            refreshTimetable(cookie)
        }
        return true
    }else {
        return false
    }

}

async function refreshTimetable(cookie: string) {
    const apiRes = await fetch((process.env.API_URL + "/scrape?cookie=" + cookie), { method: 'GET' })

    console.log(await apiRes.json())

}