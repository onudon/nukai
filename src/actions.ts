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
    if (false) {
    // if (user.registered) {
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

    const token = jwt.sign({ id, perm: user.perm }, process.env.JWT_SECRET!, { expiresIn: '7d' });

    const cookieStore = await cookies();
    cookieStore.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7d
        sameSite: 'lax'
    });

    console.log("Login: " + id)
    redirect("/")
}

async function checkLogin(id: number, password: string) {
    //Validation

    const res = await getSyllabusResponse(id, password)
    if ((await res.res.status) === 302) {
        const setCookie = res.cookie;
        // console.log("Set-Cookie: ", setCookie);
        if (setCookie) {
            const cookie = await parseCookie(setCookie);
            const result = await refreshTimetable(cookie)
            // console.log("Refresh Timetable: ", result);
            const table = result.map(v => v.id + ",").join("");
            setIndividualTimetable(id.toString(), table.substring(0, table.length - 1));
        }
        return true
    } else {
        return false
    }

}

export async function parseCookie(oldCookie: string) {
    return oldCookie.split(';')[0].split('=')[1];
}

export async function getSyllabusResponse(id: number, password: string) {

    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'
    const pre = await fetch("https://syllabus-view.kwansei.ac.jp/main/web/login/view/")
    // const pre = await fetch("http://sis-syllabus.kwansei.ac.jp/stg/app/student/web/login/view/")
    const text = await pre.text()
    // console.log("Login page fetched: ", pre);
    const start = text.indexOf('<input type="hidden" name="_token" value="')

    const token = text.substring(start + 42, start + 82)

    var cookie: string = String(pre.headers.getSetCookie()[0])
    cookie = cookie.split(';')[0];

    const headers = new Headers();
    headers.append('Host', 'syllabus-view.kwansei.ac.jp');
    headers.append('Content-Type', 'application/x-www-form-urlencoded');
    headers.append('Cookie', cookie);

    const res = await fetch('http://syllabus-view.kwansei.ac.jp/main/web/login/login/', {
    // const res = await fetch('https://sis-syllabus.kwansei.ac.jp/stg/app/student/web/login/login/', {
        method: 'POST',
        headers: headers,
        body: "_token=" + token + "&TXT_ST_ID=" + id + "&TXT_ST_PW=" + password,
        redirect: 'manual'
    });
    if (res.headers.has('set-cookie')) {
        cookie = String(res.headers.getSetCookie()[0]).split(';')[0];
    }

    // console.log("Login fetch response: ", res);
    // console.log("Login fetch status: ", res.status);
    return {res: res, cookie: cookie}
}
export async function refreshTimetable(cookie: string) {
    const apiRes = await fetch((process.env.API_URL + "/scrape?cookie=" + cookie), { method: 'GET' })

    // console.log("Classes fetched: ", apiRes);

    const cdata: { [key: string]: SClass } = await apiRes.json();

    const entries = Object.entries(cdata).map(([key, value]) => value);

    // console.log("Classes fetched: ", entries);

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

export async function createUser(formData: FormData) {
    const sois_id = Number(formData.get('sois_id'));
    const name = formData.get('name') as string;
    const perm = Number(formData.get('perm'));

    // バリデーション
    if (!z.number().min(100000).max(999999).safeParse(sois_id).success) {
        redirect('/admin?error=invalid_id');
    }

    if (!z.string().min(1).max(50).safeParse(name).success) {
        redirect('/admin?error=invalid_name');
    }

    // 権限レベルのバリデーション（1 または -1から-5）
    // if (perm !== 1 && (perm < -5 || perm > -1)) {
    //     redirect('/admin?error=invalid_perm');
    // }

    try {
        // 既存ユーザーの確認
        const [existingUser] = await pool.query<User[]>(
            "SELECT id FROM users WHERE sois_id = :sois_id", 
            { sois_id }
        );

        if (existingUser.length > 0) {
            redirect('/admin?error=user_exists');
        }

        // 新しいユーザーを作成
        await pool.query(
            "INSERT INTO users (sois_id, name, registered, perm, point) VALUES (:sois_id, :name, :registered, :perm, 10000)",
            {
                sois_id,
                name,
                registered: false, // 初期は空文字、初回ログイン時に設定
                perm: perm.toString()
            }
        );

        redirect('/admin?success=1');
    } catch (error) {
        console.error('ユーザー作成エラー:', error);
        redirect('/admin?error=db_error');
    }
}

export async function transferPoints(formData: FormData) {
    const fromUserId = parseInt(formData.get('fromUserId') as string);
    const toSoisId = parseInt(formData.get('toSoisId') as string);
    const amount = parseInt(formData.get('amount') as string);
    const message = formData.get('message') as string || '';

    // バリデーション
    if (!fromUserId || !toSoisId || !amount || amount <= 0) {
        redirect('/?error=invalid_data');
    }

    if (!z.number().min(100000).max(999999).safeParse(toSoisId).success) {
        redirect('/?error=invalid_sois_id');
    }

    var isError = true;
    try {
        // トランザクション開始
        await pool.query('START TRANSACTION');

        // 送金者の情報を取得
        const [fromUserRows] = await pool.query<User[]>(
            'SELECT id, point FROM users WHERE sois_id = :fromUserId',
            { fromUserId }
        );
        const fromUser = fromUserRows[0];

        if (!fromUser) {
            await pool.query('ROLLBACK');
            redirect('/?error=user_not_found');
        }

        if (fromUser.point < amount) {
            await pool.query('ROLLBACK');
            redirect('/?error=insufficient_points');
        }

        // 受取者の情報を取得
        const [toUserRows] = await pool.query<User[]>(
            'SELECT id, sois_id, point FROM users WHERE sois_id = :toSoisId',
            { toSoisId }
        );
        const toUser = toUserRows[0];

        if (!toUser) {
            await pool.query('ROLLBACK');
            redirect('/?error=recipient_not_found');
        }

        // 自分自身への送金をチェック
        if (fromUser.id === toUser.id) {
            await pool.query('ROLLBACK');
            redirect('/?error=same_user');
        }

        // ポイントを更新
        await pool.query(
            'UPDATE users SET point = point - :amount WHERE sois_id = :fromUserId',
            { amount, fromUserId }
        );

        await pool.query(
            'UPDATE users SET point = point + :amount WHERE id = :toUserId',
            { amount, toUserId: toUser.id }
        );

        // トランザクション完了
        await pool.query('COMMIT');

    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Transfer error:', error);
        isError = false;   
    }
    if (isError) {
        redirect('/?success=transfer_completed');
    }else{
        redirect('/?error=transfer_failed');
    }
}
