interface PageHeaderProps {
  kicker: string;
  title: string;
  subtitle: string;
}

export function PageHeader({ kicker, title, subtitle }: PageHeaderProps) {
  return (
    <section className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 tracking-tight mb-2">
          {kicker}
        </p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white text-balance max-w-3xl">
          {title}
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      </div>
    </section>
  );
}
