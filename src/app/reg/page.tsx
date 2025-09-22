import { SClass } from "@/db";
import { getTimetable } from "@/lib";
import { verifyJWT } from "@/utils/verify";
import { parse } from 'cookie';
import { JwtPayload } from "jsonwebtoken";
import { GetServerSideProps } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ClassSelectionForm from "@/components/ClassSelectionForm";

export default async function Home(props: { user: string, availableClasses: SClass[] }) {

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

    if (!availableClasses) {
        redirect('/login');
    }

    return (
        <div>
            <ClassSelectionForm
                availableClasses={availableClasses}
                initialSelectedClasses={res.saved}
                userId={user.id.toString()}
            />
            <div className="text-center">
                <h1 className="text-3xl text-red-600 font-bold">注意事項</h1>
                <h1 className="text-3xl text-red-600 font-bold">注意事項</h1>
            </div>
        </div>
    );
}