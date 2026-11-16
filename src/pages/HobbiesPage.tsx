import { PageHeader } from '../components/PageHeader.tsx';
import { SafeImage } from '../components/SafeImage.tsx';
import { useSite } from '../context/SiteContext.tsx';

export function HobbiesPage() {
  const { site } = useSite();

  return (
    <div>
      <PageHeader
        kicker="Life Outside Class"
        title="Hobbies & Interests"
        subtitle="The sports, music, books, computing projects, and travels that keep curiosity alive every week."
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {site.hobbies.map((hobby) => (
            <article
              key={hobby.id}
              className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col"
            >
              <div className="aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
                <SafeImage
                  src={hobby.imageUrl}
                  alt={hobby.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col gap-3">
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  {hobby.category}
                </p>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {hobby.title}
                </h2>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {hobby.summary}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {hobby.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
