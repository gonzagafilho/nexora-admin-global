type ControlErrorStateProps = {
  message: string;
};

export function ControlErrorState({ message }: ControlErrorStateProps) {
  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 shadow-sm">
      {message}
    </section>
  );
}
