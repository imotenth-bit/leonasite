import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowRight, BookOpen, Camera, GraduationCap, MapPin, Trophy } from 'lucide-react';
import { motion } from 'motion/react';
import { Lightbox } from '../components/Lightbox.tsx';
import { SafeImage } from '../components/SafeImage.tsx';
import { useSite } from '../context/SiteContext.tsx';

export function HomePage() {
  const { site } = useSite();
  const { profile, photos, education, hobbies, achievements } = site;
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const featuredPhotos = photos.slice(0, 3);

  const scrollToHighlights = () => {
    const el = document.getElementById('highlights');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div>
      {/* Welcome Banner */}
      <section className="relative overflow-hidden bg-slate-900 text-white">
        <div className="absolute inset-0">
          <SafeImage
            src={profile.heroBannerImage}
            alt="Scenic Pacific Northwest coastal mountains backdrop"
            eager
            className="w-full h-full object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-slate-950/75 via-slate-950/65 to-slate-950/90"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-32 flex flex-col items-center text-center">
          {/* Circular Profile Frame */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="w-32 h-32 sm:w-40 sm:h-40 rounded-full p-1 bg-white/25 backdrop-blur-sm ring-2 ring-white/80 shadow-2xl mb-8 overflow-hidden"
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-slate-800">
              <SafeImage
                src={profile.profileImage}
                alt={profile.name}
                eager
                className="w-full h-full object-cover object-top"
              />
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="text-sm sm:text-base font-medium text-blue-200 tracking-tight mb-3"
          >
            {profile.welcomeHeading}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white text-balance max-w-3xl"
          >
            {profile.name}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.14 }}
            className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm sm:text-base text-slate-200"
          >
            <span>{profile.tagline}</span>
            <span aria-hidden="true" className="text-blue-400">·</span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-300" aria-hidden="true" />
              {profile.location}
            </span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.18 }}
            className="mt-6 text-base sm:text-lg text-slate-200/95 max-w-2xl leading-relaxed"
          >
            {profile.shortIntro}
          </motion.p>

          {/* Animated Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.22 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-4"
          >
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.15 }}>
              <Link
                to="/about"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm sm:text-base shadow-lg shadow-blue-950/30 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
              >
                <span>About Me</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </motion.div>

            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.15 }}>
              <Link
                to="/gallery"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-sm font-semibold text-sm sm:text-base transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <Camera className="w-4 h-4" aria-hidden="true" />
                <span>My Photo Gallery</span>
              </Link>
            </motion.div>
          </motion.div>

          <button
            type="button"
            onClick={scrollToHighlights}
            aria-label="Scroll down to highlights"
            className="mt-12 inline-flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-400 rounded"
          >
            <span>Explore Highlights</span>
            <ArrowDown className="w-3.5 h-3.5 animate-bounce" aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* Summary Strip */}
      <section
        id="highlights"
        className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Institution</p>
            <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
              {profile.university}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Cohort</p>
            <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
              {profile.graduationYear}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Photographs</p>
            <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white font-mono tabular-nums">
              {photos.length} Published
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Milestones &amp; Awards</p>
            <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white font-mono tabular-nums">
              {achievements.certificates.length + achievements.milestones.length} Recorded
            </p>
          </div>
        </div>
      </section>

      {/* Featured Photo Gallery Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">
              Recent Captures
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Selected Photographs
            </h2>
          </div>
          <Link
            to="/gallery"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors whitespace-nowrap"
          >
            <span>Open Full Gallery</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredPhotos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setLightboxIndex(index)}
              className="group text-left rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <div className="aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
                <SafeImage
                  src={photo.imageUrl}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-5">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {photo.category} · <span className="font-mono tabular-nums">{photo.dateTaken}</span>
                </p>
                <h3 className="mt-1.5 text-base font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {photo.title}
                </h3>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Explore Pages Grid */}
      <section className="border-t border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">
              Across the Website
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Education, Hobbies &amp; Milestones
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              to="/education"
              className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/60 dark:hover:border-blue-500/60 transition-colors flex flex-col justify-between gap-6"
            >
              <div className="space-y-3">
                <GraduationCap className="w-6 h-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Education</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {education.timeline[0]?.institution} — {education.timeline[0]?.degree}. Explore favorite subjects and academic goals.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400">
                View Timeline <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </span>
            </Link>

            <Link
              to="/hobbies"
              className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/60 dark:hover:border-blue-500/60 transition-colors flex flex-col justify-between gap-6"
            >
              <div className="space-y-3">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Hobbies &amp; Interests</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {hobbies.length} personal pursuits spanning sports, music, reading, computing, and coastal travel.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400">
                Explore Hobbies <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </span>
            </Link>

            <Link
              to="/achievements"
              className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/60 dark:hover:border-blue-500/60 transition-colors flex flex-col justify-between gap-6"
            >
              <div className="space-y-3">
                <Trophy className="w-6 h-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Achievements</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Certificates of merit, civic hackathon honors, and key personal milestones from recent years.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400">
                See Awards <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      <Lightbox
        items={featuredPhotos}
        activeIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    </div>
  );
}
