import { requireControlPageAccess } from "../_rbac-guard";

export default async function AppsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireControlPageAccess("apps");
  return <>{children}</>;
}
