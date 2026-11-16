import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Footer } from './components/Footer.tsx';
import { Navbar } from './components/Navbar.tsx';
import { SiteProvider, useSite } from './context/SiteContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { AboutPage } from './pages/AboutPage.tsx';
import { AchievementsPage } from './pages/AchievementsPage.tsx';
import { AdminPage } from './pages/AdminPage.tsx';
import { ContactPage } from './pages/ContactPage.tsx';
import { EducationPage } from './pages/EducationPage.tsx';
import { GalleryPage } from './pages/GalleryPage.tsx';
import { HobbiesPage } from './pages/HobbiesPage.tsx';
import { HomePage } from './pages/HomePage.tsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
}

function AppShell() {
  const { loading, error, refreshSite } = useSite();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200">
      <ScrollToTop />
      <Navbar />

      {error && (
        <div
          role="alert"
          className="bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-900 dark:text-amber-200"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={refreshSite}
              className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      )}

      <main className="flex-1">
        {loading ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
            <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
            <p className="text-sm font-medium">Loading personal website...</p>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/education" element={<EducationPage />} />
            <Route path="/hobbies" element={<HobbiesPage />} />
            <Route path="/achievements" element={<AchievementsPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SiteProvider>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </SiteProvider>
    </ThemeProvider>
  );
}
