import { SClass } from "@/db";
import { getTimetable } from "@/lib";
import { verifyJWT } from "@/utils/verify";
import { parse } from 'cookie';
import { JwtPayload } from "jsonwebtoken";
import { GetServerSideProps } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ClassSelectionForm from "@/components/ClassSelectionForm";

export default async function Home() {

    const cookie = await cookies();
    const token = cookie.get('token')?.value;

    if (!token) {
        redirect('/login');
    }

    const user: JwtPayload = verifyJWT(token) as JwtPayload;

    if (!user) {
        redirect('/login');
    }

    const res = await getTimetable(user["id"]) as { availables: SClass[], saved: number[] };
    const availableClasses: [SClass] = res.availables as [SClass];
    const id: string = user["id"];

    if (!availableClasses) {
        redirect('/login');
    }

    return (
        <div>
            <ClassSelectionForm
                availableClasses={availableClasses}
                userId={id}
                initialSelectedClasses={res.saved}
            />
            <div className="text-center">
                <h1 className="text-5xl text-red-600 font-bold mt-5">注意事項</h1>
                <p className="text-gray-700 text-2xl my-16 max-w-2xl mx-auto">
                    ・必ず事前にポップアップを許可してください。<br />
                    ・必ず事前に
                    <a href="https://sis-syllabus.kwansei.ac.jp/student/schedule/view" target="_blank" rel="noopener noreferrer">こちらのシラバス</a>
                    でログインしてください<br />
                    ・必ず事前にシミュレーションで試してみてください。<br />
                    ・事前に履修に入っている授業はここに表示されません<br />
                    ・このシステムを口外しないでください<br />
                    ・このシステムを利用することで発生したいかなる損害についても、開発者は一切責任を負いません。<br />
                    ・このシステムの利用は自己責任で行ってください。
                </p>
            </div>
        </div>
    );
}