type ActionFeedbackProps = {
  type: "success" | "error" | "info";
  message: string;
};

const styles = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  error: "border-amber-200 bg-amber-50 text-amber-700",
  info: "border-slate-200 bg-slate-50 text-slate-700",
} as const;

export function ActionFeedback({ type, message }: ActionFeedbackProps) {
  return <section className={`rounded-xl border p-4 text-sm shadow-sm ${styles[type]}`}>{message}</section>;
}
