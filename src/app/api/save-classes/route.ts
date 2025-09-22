import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/db';
import { verifyJWT } from '@/utils/verify';
import { cookies } from 'next/headers';
import { JwtPayload } from 'jsonwebtoken';
import z from 'zod';

export async function POST(request: NextRequest) {
    try {
        const { userId, selectedClasses } = await request.json();

        // JWTトークンでユーザー認証
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = verifyJWT(token) as JwtPayload;
        console.log("request: " + user);
        if (!user || !user.id || user.id.toString() !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 既存の選択を削除

        var saveFormat = ""

        selectedClasses.forEach((cls: number) => {
            // DBに保存する形式に変換
            // 例: "classId1,classId2,classId3"

            if (z.number().min(10000).max(999999).safeParse(cls).success) {
                saveFormat = saveFormat.concat(cls + ",")
            }
        })
        saveFormat = saveFormat.slice(0, -1); // 最後のカンマを削除

        await pool.query(
            'UPDATE users SET saved_timetable=:timetable WHERE sois_id=:sois_id',
            {
                timetable: saveFormat,
                sois_id: userId
            }
        );


        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving classes:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}