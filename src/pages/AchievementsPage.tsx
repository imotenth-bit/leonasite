import { useState } from 'react';
import { Award, Flag } from 'lucide-react';
import { Lightbox } from '../components/Lightbox.tsx';
import { PageHeader } from '../components/PageHeader.tsx';
import { SafeImage } from '../components/SafeImage.tsx';
import { useSite } from '../context/SiteContext.tsx';

export function AchievementsPage() {
  const { site } = useSite();
  const { certificates, milestones } = site.achievements;
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const lightboxItems = certificates.map((c) => ({
    id: c.id,
    title: c.title,
    description: `${c.issuer} — ${c.description}`,
    category: c.category,
    imageUrl: c.imageUrl,
    dateTaken: c.date,
  }));

  return (
    <div>
      <PageHeader
        kicker="Honors & Recognition"
        title="Achievements"
        subtitle="Certificates, academic honors, competition awards, and meaningful personal milestones."
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
        {/* Certificates Gallery */}
        <div>
          <div className="flex items-center gap-2.5 mb-8">
            <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Certificates &amp; Awards
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {certificates.map((cert, idx) => (
              <button
                key={cert.id}
                type="button"
                onClick={() => setLightboxIndex(idx)}
                className="group text-left rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow flex flex-col focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <SafeImage
                    src={cert.imageUrl}
                    alt={cert.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6 space-y-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {cert.category} · <span className="font-mono tabular-nums">{cert.date}</span>
                  </p>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {cert.title}
                  </h3>
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    {cert.issuer}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                    {cert.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Important Milestones */}
        <div>
          <div className="flex items-center gap-2.5 mb-8">
            <Flag className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Important Milestones
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
            {milestones.map((item) => (
              <div
                key={item.id}
                className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-8"
              >
                <div className="sm:w-24 shrink-0">
                  <span className="text-lg font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400">
                    {item.year}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {item.context}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                    {item.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Lightbox
        items={lightboxItems}
        activeIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    </div>
  );
}
