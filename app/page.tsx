import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CONTROL_ACCESS_TOKEN_COOKIE } from "@/lib/auth-cookie";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CONTROL_ACCESS_TOKEN_COOKIE)?.value;
  redirect(token ? "/control" : "/login");
}
