"use client"

import login from "@/actions";

export default function LoginForm() {
    const hide = () => {
        const form = document.querySelector("form");
        if (form) {
            form.style.display = "none";
        }
    }
    return (
        <form action={login} className="flex flex-col gap-4 mt-64">
            <input name="id" type="number" required className="border-2 pr-4" placeholder="ユーザーID" />
            <input name="password" type="password" required className="border-2" placeholder="パスワード" />
            <button type="submit" onClick={hide}>Login</button>
        </form>
    );
}