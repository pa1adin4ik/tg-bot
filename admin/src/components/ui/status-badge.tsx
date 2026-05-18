export const StatusBadge = ({ status }: { status: string }) => {
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
      {status.replace(/_/g, ' ')}
    </span>
  );
};
