import LoginForm from "@/components/LoginForm";
import login from "../../actions";

export default function LoginPage() {

  return (
    <div className="flex justify-center items-center w-full">
      <LoginForm></LoginForm>
    </div>
  );
}