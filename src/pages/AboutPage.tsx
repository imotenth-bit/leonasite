import { Link } from 'react-router-dom';
import { ArrowRight, Compass, MapPin, Sparkles } from 'lucide-react';
import { PageHeader } from '../components/PageHeader.tsx';
import { SafeImage } from '../components/SafeImage.tsx';
import { useSite } from '../context/SiteContext.tsx';

export function AboutPage() {
  const { site } = useSite();
  const { profile, about } = site;

  return (
    <div>
      <PageHeader
        kicker="Biography"
        title="About Me"
        subtitle={`${profile.name} · ${profile.location} · ${profile.university}`}
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          {/* Left Column: Portrait & Quick Facts */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm aspect-[4/4.5]">
              <SafeImage
                src={profile.profileImage}
                alt={`Portrait of ${profile.name}`}
                eager
                className="w-full h-full object-cover object-top"
              />
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white mb-4">
                <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                <span>Quick Profile</span>
              </div>
              <dl className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                <div className="py-2.5 flex items-center justify-between gap-4">
                  <dt className="text-slate-500 dark:text-slate-400">Name</dt>
                  <dd className="font-medium text-slate-900 dark:text-white text-right">{profile.name}</dd>
                </div>
                {about.highlights.map((item) => (
                  <div key={item.label} className="py-2.5 flex items-center justify-between gap-4">
                    <dt className="text-slate-500 dark:text-slate-400">{item.label}</dt>
                    <dd className="font-medium text-slate-900 dark:text-white text-right">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* Right Column: Story, Interests, Ambitions */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-8">
            <div className="space-y-6">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white text-balance">
                {about.headline}
              </h2>

              <div className="space-y-4 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                {about.bioParagraphs.map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>

              {about.quote && (
                <blockquote className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/70 p-6 font-serif italic text-lg text-slate-800 dark:text-slate-200 leading-relaxed">
                  “{about.quote}”
                </blockquote>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-3">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <Sparkles className="w-5 h-5" aria-hidden="true" />
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                      Personal Interests
                    </h3>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {about.interestsSummary}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-3">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <Compass className="w-5 h-5" aria-hidden="true" />
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                      Future Ambitions
                    </h3>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {about.futureAmbitions}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-4">
              <Link
                to="/gallery"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
              >
                <span>Browse Photo Gallery</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold transition-colors"
              >
                <span>Get in Touch</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
