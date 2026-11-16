import { Award, BookOpen, GraduationCap, Target } from 'lucide-react';
import { PageHeader } from '../components/PageHeader.tsx';
import { useSite } from '../context/SiteContext.tsx';

export function EducationPage() {
  const { site } = useSite();
  const { education } = site;

  return (
    <div>
      <PageHeader
        kicker="Academic Journey"
        title="Education"
        subtitle="Schools, favorite fields of study, academic honors, and long-term learning goals."
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
        {/* Timeline */}
        <div>
          <div className="flex items-center gap-2.5 mb-8">
            <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Academic Timeline
            </h2>
          </div>

          <div className="relative space-y-8 before:absolute before:left-[11px] before:top-3 before:bottom-3 before:w-px before:bg-slate-200 dark:before:bg-slate-800">
            {education.timeline.map((entry) => (
              <div key={entry.id} className="relative pl-10">
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-2 w-6 h-6 rounded-full bg-white dark:bg-slate-950 border-2 border-blue-600 dark:border-blue-400 flex items-center justify-center"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                </span>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                    <div>
                      <p className="text-xs font-mono tabular-nums text-blue-600 dark:text-blue-400 font-medium">
                        {entry.period} · {entry.location}
                      </p>
                      <h3 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                        {entry.institution}
                      </h3>
                    </div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      {entry.gpaOrHonors}
                    </p>
                  </div>

                  <p className="text-base font-medium text-slate-800 dark:text-slate-200">
                    {entry.degree}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {entry.description}
                  </p>

                  {entry.highlights.length > 0 && (
                    <ul className="pt-2 space-y-2 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300">
                      {entry.highlights.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <span aria-hidden="true" className="text-blue-600 dark:text-blue-400 font-semibold">
                            —
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Favorite Subjects */}
        <div>
          <div className="flex items-center gap-2.5 mb-8">
            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Favorite Subjects
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {education.favoriteSubjects.map((subject) => (
              <div
                key={subject.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-2"
              >
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  {subject.area}
                </p>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {subject.name}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {subject.note}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Academic Achievements & Educational Goals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2.5">
              <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Academic Achievements
              </h2>
            </div>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              {education.academicAchievements.map((ach, idx) => (
                <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                  <span aria-hidden="true" className="text-blue-600 dark:text-blue-400 font-semibold">
                    0{idx + 1}.
                  </span>
                  <span>{ach}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2.5">
              <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Educational Goals
              </h2>
            </div>
            <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              {education.educationalGoals}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
