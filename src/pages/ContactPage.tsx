import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Github,
  Instagram,
  Linkedin,
  Loader2,
  Mail,
  MapPin,
  Send,
  Twitter,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader.tsx';
import { useSite } from '../context/SiteContext.tsx';
import type { ContactServiceStatus } from '../types/site.ts';

interface FieldErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

export function ContactPage() {
  const { site } = useSite();
  const { social, location } = site.profile;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [serviceStatus, setServiceStatus] = useState<ContactServiceStatus | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/contact/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ContactServiceStatus | null) => {
        if (data) setServiceStatus(data);
      })
      .catch(() => {
        // Ignore status check errors
      });
  }, []);

  const validateForm = (): boolean => {
    const errors: FieldErrors = {};
    if (name.trim().length < 2) {
      errors.name = 'Please enter your name (at least 2 characters).';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }
    if (subject.trim().length < 3) {
      errors.subject = 'Please enter a subject (at least 3 characters).';
    }
    if (message.trim().length < 10) {
      errors.message = 'Please write a message of at least 10 characters.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitResult(null);
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
        }),
      });
      const body = (await res.json()) as { ok?: boolean; message?: string; error?: string };
      if (!res.ok) {
        setSubmitResult({
          type: 'error',
          text: body.error || 'Unable to deliver message right now.',
        });
        return;
      }

      setSubmitResult({
        type: 'success',
        text: body.message || 'Your message has been delivered via email.',
      });
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setFieldErrors({});
    } catch (err) {
      setSubmitResult({
        type: 'error',
        text: err instanceof Error ? err.message : 'Network error while sending message.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const socialItems = [
    { label: 'GitHub', href: social.github, icon: Github },
    { label: 'LinkedIn', href: social.linkedin, icon: Linkedin },
    { label: 'Instagram', href: social.instagram, icon: Instagram },
    { label: 'X (Twitter)', href: social.twitter, icon: Twitter },
  ].filter((item) => Boolean(item.href));

  return (
    <div>
      <PageHeader
        kicker="Get in Touch"
        title="Contact Me"
        subtitle="Have a question, project idea, or collaboration in mind? Send a message below or connect via social channels."
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Contact Details & Social */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Direct Channels
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  I welcome inquiries about research, software engineering internships, and photography collaborations.
                </p>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Location</p>
                    <p className="text-slate-600 dark:text-slate-300">{location}</p>
                  </div>
                </div>
                {social.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" aria-hidden="true" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Email</p>
                      <a
                        href={`mailto:${social.email}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {social.email}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">
                  Social Links
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {socialItems.map(({ label, href, icon: Icon }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-blue-600 hover:text-blue-600 dark:hover:border-blue-400 dark:hover:text-blue-400 transition-colors"
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                      <span>{label}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {serviceStatus && !serviceStatus.configured && (
              <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-5 text-sm text-amber-900 dark:text-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>
                    {serviceStatus.databaseReady
                      ? 'Messages Save to Supabase (Email Forwarding Optional)'
                      : 'Email & Database Configuration Needed'}
                  </span>
                </div>
                <p className="leading-relaxed text-xs sm:text-sm">
                  {serviceStatus.databaseReady ? (
                    <>
                      Submissions are saved directly to your Supabase{' '}
                      <code className="font-mono font-semibold">contact_messages</code> table. To also forward messages by email, add{' '}
                      <code className="font-mono font-semibold">RESEND_API_KEY</code> and{' '}
                      <code className="font-mono font-semibold">CONTACT_TO_EMAIL</code> in environment secrets.
                    </>
                  ) : (
                    <>
                      Run <code className="font-mono font-semibold">supabase/schema.sql</code> in Supabase to store contact inquiries, or configure{' '}
                      <code className="font-mono font-semibold">RESEND_API_KEY</code> and{' '}
                      <code className="font-mono font-semibold">CONTACT_TO_EMAIL</code> in environment secrets for live email delivery.
                    </>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-7">
            <form
              onSubmit={handleSubmit}
              noValidate
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-5"
            >
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Send a Message
              </h2>

              {submitResult && (
                <div
                  role="alert"
                  className={`p-4 rounded-xl border text-sm flex items-start gap-3 ${
                    submitResult.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                      : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                  }`}
                >
                  {submitResult.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
                  ) : (
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
                  )}
                  <span>{submitResult.text}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label
                    htmlFor="contact-name"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  {fieldErrors.name && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.name}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="contact-email"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  {fieldErrors.email && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.email}</p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="contact-subject"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Subject
                </label>
                <input
                  id="contact-subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="What is this regarding?"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                {fieldErrors.subject && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.subject}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="contact-message"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Message
                </label>
                <textarea
                  id="contact-message"
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your message here..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                {fieldErrors.message && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.message}</p>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Send className="w-4 h-4" aria-hidden="true" />
                  )}
                  <span>{submitting ? 'Sending...' : 'Send Message'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
