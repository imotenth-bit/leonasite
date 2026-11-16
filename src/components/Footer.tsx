import { Link } from 'react-router-dom';
import { Github, Instagram, Linkedin, Mail, Twitter } from 'lucide-react';
import { useSite } from '../context/SiteContext.tsx';

export function Footer() {
  const { site } = useSite();
  const { social, name, location } = site.profile;
  const currentYear = new Date().getFullYear();

  const socialItems = [
    { label: 'GitHub', href: social.github, icon: Github },
    { label: 'LinkedIn', href: social.linkedin, icon: Linkedin },
    { label: 'Instagram', href: social.instagram, icon: Instagram },
    { label: 'X (Twitter)', href: social.twitter, icon: Twitter },
    { label: 'Email', href: social.email ? `mailto:${social.email}` : '', icon: Mail },
  ].filter((item) => Boolean(item.href));

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="space-y-2">
            <Link
              to="/"
              className="text-lg font-bold tracking-tight text-slate-900 dark:text-white inline-block"
            >
              {name}
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {site.profile.tagline} · {location}
            </p>
          </div>

          <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <Link to="/about" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              About Me
            </Link>
            <Link to="/gallery" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Photo Gallery
            </Link>
            <Link to="/education" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Education
            </Link>
            <Link to="/hobbies" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Hobbies
            </Link>
            <Link to="/achievements" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Achievements
            </Link>
            <Link to="/contact" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Contact
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            {socialItems.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith('mailto:') ? undefined : '_blank'}
                rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                aria-label={label}
                title={label}
                className="w-10 h-10 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-blue-600 hover:text-blue-600 dark:hover:border-blue-400 dark:hover:text-blue-400 transition-colors"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-500">
          <p>© {currentYear} {name}. All rights reserved.</p>
          <Link to="/admin" className="hover:text-slate-800 dark:hover:text-slate-300 transition-colors">
            Administrator Dashboard
          </Link>
        </div>
      </div>
    </footer>
  );
}
