import login from "../../actions";

export default function LoginPage() {
  return (
    <div className="flex justify-center items-center w-full">
      <form action={login} className="flex flex-col gap-4 mt-64">
        <input name="id" type="number" required className="border-2 pr-4" placeholder="ユーザーID" />
        <input name="password" type="password" required className="border-2" placeholder="パスワード" />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}