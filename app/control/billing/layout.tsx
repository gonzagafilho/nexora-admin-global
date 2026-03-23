import { requireControlPageAccess } from "../_rbac-guard";

export default async function BillingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireControlPageAccess("billing");
  return <>{children}</>;
}
