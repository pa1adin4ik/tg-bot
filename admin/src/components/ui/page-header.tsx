export const PageHeader = ({ title, description }: { title: string; description?: string }) => {
  return (
    <div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      {description ? <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{description}</p> : null}
    </div>
  );
};
