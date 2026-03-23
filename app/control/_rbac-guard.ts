import { redirect } from "next/navigation";
import { canAccessPage, type ControlPageKey } from "@/lib/control-rbac";
import { requireControlSessionUser } from "@/lib/control-session";

export async function requireControlPageAccess(page: ControlPageKey) {
  const user = await requireControlSessionUser();
  if (!canAccessPage(user.profile, page)) {
    redirect("/control");
  }
  return user;
}
