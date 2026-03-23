import { requireControlPageAccess } from "../_rbac-guard";

export default async function LicensesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireControlPageAccess("licenses");
  return <>{children}</>;
}
