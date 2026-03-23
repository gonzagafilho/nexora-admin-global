import ControlShell from "./ControlShell";
import { allowedMenuKeys } from "@/lib/control-rbac";
import { requireControlSessionUser } from "@/lib/control-session";

export default async function ControlLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireControlSessionUser();

  return (
    <ControlShell
      userName={user.name}
      userProfile={user.profile}
      allowedMenu={allowedMenuKeys(user.profile)}
    >
      {children}
    </ControlShell>
  );
}
