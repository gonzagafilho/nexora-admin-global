import { requireControlPageAccess } from "../_rbac-guard";

export default async function InfraLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireControlPageAccess("infra");
  return <>{children}</>;
}
