import { verifyJWT } from "@/utils/verify";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { off } from "process";


export default async function Home() {

  const cookie = await cookies();
  const token = cookie.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  const user = verifyJWT(token);

  if (!user) {
    redirect('/login');
  }

  return (
    <div>

    </div>
  );
}
