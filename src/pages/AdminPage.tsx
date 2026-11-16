import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  AlertCircle,
  BookOpen,
  Camera,
  Check,
  CheckCircle2,
  Copy,
  Database,
  FolderPlus,
  GraduationCap,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  Plus,
  RefreshCw,
  Settings,
  ShieldCheck,
  Trash2,
  Upload,
  User,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader.tsx';
import { SafeImage } from '../components/SafeImage.tsx';
import { useSite } from '../context/SiteContext.tsx';
import type {
  CertificateItem,
  ContactMessageItem,
  EducationEntry,
  HobbyItem,
  MilestoneItem,
  PhotoItem,
  SiteData,
  SubjectItem,
} from '../types/site.ts';

type AdminTab = 'photos' | 'profile' | 'education' | 'hobbies' | 'messages' | 'setup';

export function AdminPage() {
  const {
    site,
    adminStatus,
    supabaseStatus,
    refreshSupabaseStatus,
    syncToSupabase,
    fetchAdminMessages,
    setupAdmin,
    loginAdmin,
    logoutAdmin,
    saveSiteData,
    uploadPhotos,
    updatePhoto,
    replacePhotoFile,
    deletePhoto,
    addCategory,
    deleteCategory,
    uploadSingleImage,
  } = useSite();

  // Auth states
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Dashboard navigation & notifications
  const [activeTab, setActiveTab] = useState<AdminTab>('photos');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);

  // Editable draft copy of site content
  const [draft, setDraft] = useState<SiteData>(site);
  useEffect(() => {
    setDraft(site);
  }, [site]);

  // Photo upload & management states
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
  const [uploadCategory, setUploadCategory] = useState(site.categories[0] || 'Personal');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadLocation, setUploadLocation] = useState('');
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [photoDraft, setPhotoDraft] = useState<Partial<PhotoItem>>({});
  const [messages, setMessages] = useState<ContactMessageItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [syncingSupabase, setSyncingSupabase] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const loadMessages = async () => {
    setLoadingMessages(true);
    try {
      const list = await fetchAdminMessages();
      setMessages(list);
    } catch (err) {
      showError(err, 'Unable to load contact messages.');
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (adminStatus.authenticated && activeTab === 'messages') {
      void loadMessages();
    }
  }, [adminStatus.authenticated, activeTab]);

  const showSuccess = (text: string) => setNotice({ type: 'success', text });
  const showError = (err: unknown, fallback: string) =>
    setNotice({ type: 'error', text: err instanceof Error ? err.message : fallback });

  const handleSetupSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (password.length < 8) {
      setAuthError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }
    setAuthBusy(true);
    try {
      await setupAdmin(password);
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to initialize admin password.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!password) {
      setAuthError('Please enter your administrator password.');
      return;
    }
    setAuthBusy(true);
    try {
      await loginAdmin(password);
      setPassword('');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    setNotice(null);
    try {
      await saveSiteData(draft);
      showSuccess('All website content changes saved persistently.');
    } catch (err) {
      showError(err, 'Failed to save changes.');
    } finally {
      setSavingDraft(false);
    }
  };

  const handlePhotoUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!uploadFiles || uploadFiles.length === 0) {
      setNotice({ type: 'error', text: 'Please select at least one photograph file.' });
      return;
    }
    setUploadingPhotos(true);
    setNotice(null);
    try {
      const added = await uploadPhotos({
        files: uploadFiles,
        category: uploadCategory,
        title: uploadTitle,
        description: uploadDescription,
        location: uploadLocation,
      });
      setUploadFiles(null);
      setUploadTitle('');
      setUploadDescription('');
      setUploadLocation('');
      showSuccess(`Uploaded ${added.length} photograph${added.length > 1 ? 's' : ''}.`);
    } catch (err) {
      showError(err, 'Photo upload failed.');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleAddCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setNotice(null);
    try {
      await addCategory(newCategoryName.trim());
      setNewCategoryName('');
      showSuccess('Photo category created.');
    } catch (err) {
      showError(err, 'Could not add category.');
    }
  };

  const handleDeleteCategory = async (name: string) => {
    setNotice(null);
    try {
      await deleteCategory(name);
      showSuccess(`Category "${name}" removed.`);
    } catch (err) {
      showError(err, 'Could not delete category.');
    }
  };

  const startEditingPhoto = (photo: PhotoItem) => {
    setEditingPhotoId(photo.id);
    setPhotoDraft({
      title: photo.title,
      description: photo.description,
      category: photo.category,
      location: photo.location || '',
      dateTaken: photo.dateTaken,
    });
  };

  const savePhotoEdit = async (id: string) => {
    setNotice(null);
    try {
      await updatePhoto(id, photoDraft);
      setEditingPhotoId(null);
      showSuccess('Photograph metadata updated.');
    } catch (err) {
      showError(err, 'Failed to update photograph.');
    }
  };

  const handleSingleImageUpload = async (
    file: File | undefined,
    onUrl: (url: string) => void
  ) => {
    if (!file) return;
    setNotice(null);
    try {
      const url = await uploadSingleImage(file);
      onUrl(url);
      showSuccess('Image uploaded. Click "Save Changes" to apply across the site.');
    } catch (err) {
      showError(err, 'Image upload failed.');
    }
  };

  // Unauthenticated View
  if (!adminStatus.authenticated) {
    return (
      <div>
        <PageHeader
          kicker="Content Management"
          title="Administrator Portal"
          subtitle="Sign in to upload photographs, organize categories, and edit personal profile, education, hobbies, and achievements."
        />

        <section className="max-w-md mx-auto px-4 py-14">
          {!adminStatus.hasPasswordConfigured ? (
            <form
              onSubmit={handleSetupSubmit}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-5"
            >
              <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
                <ShieldCheck className="w-5 h-5" aria-hidden="true" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  First-Time Admin Setup
                </h2>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Create your administrator password to protect the dashboard. Your password is salted and hashed on the server using cryptographic scrypt.
              </p>

              {authError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Create Password (min. 8 characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={authBusy}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold"
              >
                {authBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                <span>Set Password &amp; Enter Dashboard</span>
              </button>
            </form>
          ) : (
            <form
              onSubmit={handleLoginSubmit}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-5"
            >
              <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
                <KeyRound className="w-5 h-5" aria-hidden="true" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Administrator Sign In
                </h2>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Enter your administrator password to manage photographs and website content.
              </p>

              {authError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={authBusy}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold"
              >
                {authBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>Sign In</span>
              </button>
            </form>
          )}
        </section>
      </div>
    );
  }

  // Authenticated Dashboard
  const tabs: { id: AdminTab; label: string; icon: typeof Camera }[] = [
    { id: 'photos', label: 'Photos & Categories', icon: Camera },
    { id: 'profile', label: 'Profile & About', icon: User },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'hobbies', label: 'Hobbies & Awards', icon: BookOpen },
    { id: 'messages', label: 'Messages', icon: Mail },
    { id: 'setup', label: 'Supabase & Setup', icon: Settings },
  ];

  return (
    <div>
      <PageHeader
        kicker="Authenticated Session"
        title="Admin Dashboard"
        subtitle="Manage your photography archive, categories, personal biography, education timeline, hobbies, and certificates."
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Top Action Strip */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            {tabs.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {activeTab !== 'photos' && activeTab !== 'setup' && (
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={savingDraft}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold whitespace-nowrap"
              >
                {savingDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>{savingDraft ? 'Saving...' : 'Save Changes'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={logoutAdmin}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium whitespace-nowrap"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Notice */}
        {notice && (
          <div
            role="status"
            className={`p-4 rounded-xl border text-sm flex items-center gap-3 ${
              notice.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
            }`}
          >
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span>{notice.text}</span>
          </div>
        )}

        {/* TAB 1: PHOTOS & CATEGORIES */}
        {activeTab === 'photos' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Upload Photos Card */}
              <form
                onSubmit={handlePhotoUpload}
                className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4"
              >
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Upload Photographs
                  </h2>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Choose Image Files (supports multiple selection)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => setUploadFiles(e.target.files)}
                    className="block w-full text-sm text-slate-600 dark:text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-950 dark:file:text-blue-300"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Category
                    </label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                    >
                      {site.categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Location (Optional)
                    </label>
                    <input
                      type="text"
                      value={uploadLocation}
                      onChange={(e) => setUploadLocation(e.target.value)}
                      placeholder="Seattle, WA"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="Leaves blank to use filename"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    placeholder="Story or caption for these photographs"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploadingPhotos}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold"
                >
                  {uploadingPhotos ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span>{uploadingPhotos ? 'Uploading...' : 'Upload to Gallery'}</span>
                </button>
              </form>

              {/* Category Manager Card */}
              <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
                <div className="flex items-center gap-2">
                  <FolderPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Photo Categories
                  </h2>
                </div>

                <form onSubmit={handleAddCategory} className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="New category name"
                    maxLength={32}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </form>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {site.categories.map((cat) => {
                    const count = site.photos.filter((p) => p.category === cat).length;
                    return (
                      <div key={cat} className="py-2.5 flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium text-slate-900 dark:text-white">{cat}</span>
                          <span className="ml-2 text-xs text-slate-500 font-mono tabular-nums">
                            ({count})
                          </span>
                        </div>
                        {site.categories.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat)}
                            aria-label={`Delete category ${cat}`}
                            className="text-xs text-red-600 dark:text-red-400 hover:underline"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Manage Existing Photos */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Manage Gallery Photographs ({site.photos.length})
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {site.photos.map((photo) => {
                  const isEditing = editingPhotoId === photo.id;
                  return (
                    <div
                      key={photo.id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row gap-4"
                    >
                      <div className="w-full sm:w-36 aspect-[4/3] sm:aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                        <SafeImage src={photo.imageUrl} alt={photo.title} />
                      </div>

                      <div className="flex-1 min-w-0 space-y-3">
                        {isEditing ? (
                          <div className="space-y-2.5">
                            <input
                              type="text"
                              value={photoDraft.title || ''}
                              onChange={(e) => setPhotoDraft({ ...photoDraft, title: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                              placeholder="Title"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <select
                                value={photoDraft.category || ''}
                                onChange={(e) => setPhotoDraft({ ...photoDraft, category: e.target.value })}
                                className="px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                              >
                                {site.categories.map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>
                              <input
                                type="text"
                                value={photoDraft.location || ''}
                                onChange={(e) => setPhotoDraft({ ...photoDraft, location: e.target.value })}
                                placeholder="Location"
                                className="px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                              />
                            </div>
                            <textarea
                              rows={2}
                              value={photoDraft.description || ''}
                              onChange={(e) => setPhotoDraft({ ...photoDraft, description: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => savePhotoEdit(photo.id)}
                                className="px-3 py-1.5 rounded bg-blue-600 text-white text-xs font-semibold"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingPhotoId(null)}
                                className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div>
                              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                {photo.category} · <span className="font-mono tabular-nums">{photo.dateTaken}</span>
                              </p>
                              <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate">
                                {photo.title}
                              </h3>
                              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-1">
                                {photo.description}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 pt-1">
                              <button
                                type="button"
                                onClick={() => startEditingPhoto(photo)}
                                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                Edit Details
                              </button>

                              <label className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 cursor-pointer">
                                <RefreshCw className="w-3 h-3" />
                                <span>Replace Image</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    e.target.value = '';
                                    if (!file) return;
                                    try {
                                      await replacePhotoFile(photo.id, file);
                                      showSuccess('Photograph image replaced.');
                                    } catch (err) {
                                      showError(err, 'Replace failed.');
                                    }
                                  }}
                                />
                              </label>

                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    await deletePhoto(photo.id);
                                    showSuccess(`Deleted "${photo.title}".`);
                                  } catch (err) {
                                    showError(err, 'Delete failed.');
                                  }
                                }}
                                className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PROFILE & ABOUT ME */}
        {activeTab === 'profile' && (
          <div className="space-y-8">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Identity &amp; Welcome Banner
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                    <SafeImage src={draft.profile.profileImage} alt="Profile preview" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Profile Portrait</p>
                    <label className="inline-block px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold cursor-pointer">
                      Upload New Portrait
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleSingleImageUpload(e.target.files?.[0], (url) =>
                            setDraft({ ...draft, profile: { ...draft.profile, profileImage: url } })
                          )
                        }
                      />
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-32 h-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                    <SafeImage src={draft.profile.heroBannerImage} alt="Banner preview" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Home Banner Background</p>
                    <label className="inline-block px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold cursor-pointer">
                      Upload New Banner
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleSingleImageUpload(e.target.files?.[0], (url) =>
                            setDraft({ ...draft, profile: { ...draft.profile, heroBannerImage: url } })
                          )
                        }
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name</label>
                  <input
                    type="text"
                    value={draft.profile.name}
                    onChange={(e) =>
                      setDraft({ ...draft, profile: { ...draft.profile, name: e.target.value } })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Welcome Heading</label>
                  <input
                    type="text"
                    value={draft.profile.welcomeHeading}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        profile: { ...draft.profile, welcomeHeading: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tagline</label>
                  <input
                    type="text"
                    value={draft.profile.tagline}
                    onChange={(e) =>
                      setDraft({ ...draft, profile: { ...draft.profile, tagline: e.target.value } })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input
                    type="text"
                    value={draft.profile.location}
                    onChange={(e) =>
                      setDraft({ ...draft, profile: { ...draft.profile, location: e.target.value } })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">School / University</label>
                  <input
                    type="text"
                    value={draft.profile.university}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        profile: { ...draft.profile, university: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={draft.profile.social.email}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        profile: {
                          ...draft.profile,
                          social: { ...draft.profile.social, email: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Short Home Introduction</label>
                <textarea
                  rows={3}
                  value={draft.profile.shortIntro}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      profile: { ...draft.profile, shortIntro: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                About Me Content
              </h2>

              <div>
                <label className="block text-sm font-medium mb-1">About Headline</label>
                <input
                  type="text"
                  value={draft.about.headline}
                  onChange={(e) =>
                    setDraft({ ...draft, about: { ...draft.about, headline: e.target.value } })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Biography Paragraphs (separated by blank line)
                </label>
                <textarea
                  rows={5}
                  value={draft.about.bioParagraphs.join('\n\n')}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      about: {
                        ...draft.about,
                        bioParagraphs: e.target.value.split(/\n\s*\n/).filter(Boolean),
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Personal Interests</label>
                  <textarea
                    rows={3}
                    value={draft.about.interestsSummary}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        about: { ...draft.about, interestsSummary: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Future Ambitions</label>
                  <textarea
                    rows={3}
                    value={draft.about.futureAmbitions}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        about: { ...draft.about, futureAmbitions: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: EDUCATION */}
        {activeTab === 'education' && (
          <div className="space-y-8">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Education Timeline
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    const entry: EducationEntry = {
                      id: `edu-${Date.now()}`,
                      institution: 'New School or College',
                      degree: 'Degree or Program',
                      period: '2026 — Present',
                      location: 'City',
                      gpaOrHonors: 'Honors',
                      description: 'Description of studies and activities.',
                      highlights: [],
                    };
                    setDraft({
                      ...draft,
                      education: {
                        ...draft.education,
                        timeline: [entry, ...draft.education.timeline],
                      },
                    });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add School</span>
                </button>
              </div>

              <div className="space-y-4">
                {draft.education.timeline.map((entry, idx) => (
                  <div
                    key={entry.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        Entry #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            education: {
                              ...draft.education,
                              timeline: draft.education.timeline.filter((item) => item.id !== entry.id),
                            },
                          })
                        }
                        className="text-xs text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={entry.institution}
                        onChange={(e) => {
                          const next = [...draft.education.timeline];
                          next[idx] = { ...entry, institution: e.target.value };
                          setDraft({ ...draft, education: { ...draft.education, timeline: next } });
                        }}
                        placeholder="Institution"
                        className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                      />
                      <input
                        type="text"
                        value={entry.degree}
                        onChange={(e) => {
                          const next = [...draft.education.timeline];
                          next[idx] = { ...entry, degree: e.target.value };
                          setDraft({ ...draft, education: { ...draft.education, timeline: next } });
                        }}
                        placeholder="Degree / Program"
                        className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                      />
                      <input
                        type="text"
                        value={entry.period}
                        onChange={(e) => {
                          const next = [...draft.education.timeline];
                          next[idx] = { ...entry, period: e.target.value };
                          setDraft({ ...draft, education: { ...draft.education, timeline: next } });
                        }}
                        placeholder="Period"
                        className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                      />
                      <input
                        type="text"
                        value={entry.gpaOrHonors}
                        onChange={(e) => {
                          const next = [...draft.education.timeline];
                          next[idx] = { ...entry, gpaOrHonors: e.target.value };
                          setDraft({ ...draft, education: { ...draft.education, timeline: next } });
                        }}
                        placeholder="GPA / Honors"
                        className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={entry.description}
                      onChange={(e) => {
                        const next = [...draft.education.timeline];
                        next[idx] = { ...entry, description: e.target.value };
                        setDraft({ ...draft, education: { ...draft.education, timeline: next } });
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Favorite Subjects & Goals */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Favorite Subjects &amp; Goals
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    const subj: SubjectItem = {
                      id: `subj-${Date.now()}`,
                      name: 'New Subject',
                      area: 'Discipline',
                      note: 'Why I enjoy studying this subject.',
                    };
                    setDraft({
                      ...draft,
                      education: {
                        ...draft.education,
                        favoriteSubjects: [...draft.education.favoriteSubjects, subj],
                      },
                    });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Subject</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {draft.education.favoriteSubjects.map((subj, idx) => (
                  <div
                    key={subj.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5"
                  >
                    <div className="flex justify-between">
                      <input
                        type="text"
                        value={subj.name}
                        onChange={(e) => {
                          const next = [...draft.education.favoriteSubjects];
                          next[idx] = { ...subj, name: e.target.value };
                          setDraft({
                            ...draft,
                            education: { ...draft.education, favoriteSubjects: next },
                          });
                        }}
                        className="font-semibold text-sm bg-transparent border-b border-slate-200 dark:border-slate-700 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            education: {
                              ...draft.education,
                              favoriteSubjects: draft.education.favoriteSubjects.filter(
                                (s) => s.id !== subj.id
                              ),
                            },
                          })
                        }
                        className="text-xs text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      type="text"
                      value={subj.area}
                      onChange={(e) => {
                        const next = [...draft.education.favoriteSubjects];
                        next[idx] = { ...subj, area: e.target.value };
                        setDraft({
                          ...draft,
                          education: { ...draft.education, favoriteSubjects: next },
                        });
                      }}
                      placeholder="Area"
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                    />
                    <textarea
                      rows={2}
                      value={subj.note}
                      onChange={(e) => {
                        const next = [...draft.education.favoriteSubjects];
                        next[idx] = { ...subj, note: e.target.value };
                        setDraft({
                          ...draft,
                          education: { ...draft.education, favoriteSubjects: next },
                        });
                      }}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Educational Goals</label>
                <textarea
                  rows={3}
                  value={draft.education.educationalGoals}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      education: { ...draft.education, educationalGoals: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: HOBBIES & ACHIEVEMENTS */}
        {activeTab === 'hobbies' && (
          <div className="space-y-8">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Hobbies &amp; Interests ({draft.hobbies.length})
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    const item: HobbyItem = {
                      id: `hobby-${Date.now()}`,
                      title: 'New Hobby',
                      category: 'Personal',
                      summary: 'Quick highlight',
                      description: 'Describe what you enjoy about this hobby.',
                      imageUrl: site.profile.heroBannerImage,
                    };
                    setDraft({ ...draft, hobbies: [...draft.hobbies, item] });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Hobby</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {draft.hobbies.map((hobby, idx) => (
                  <div
                    key={hobby.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={hobby.title}
                        onChange={(e) => {
                          const next = [...draft.hobbies];
                          next[idx] = { ...hobby, title: e.target.value };
                          setDraft({ ...draft, hobbies: next });
                        }}
                        className="font-semibold text-sm flex-1 bg-transparent border-b border-slate-200 dark:border-slate-700 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            hobbies: draft.hobbies.filter((h) => h.id !== hobby.id),
                          })
                        }
                        className="text-xs text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={hobby.category}
                        onChange={(e) => {
                          const next = [...draft.hobbies];
                          next[idx] = { ...hobby, category: e.target.value };
                          setDraft({ ...draft, hobbies: next });
                        }}
                        placeholder="Category"
                        className="px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                      />
                      <label className="px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 text-xs text-center font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">
                        Upload Photo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleSingleImageUpload(e.target.files?.[0], (url) => {
                              const next = [...draft.hobbies];
                              next[idx] = { ...hobby, imageUrl: url };
                              setDraft({ ...draft, hobbies: next });
                            })
                          }
                        />
                      </label>
                    </div>

                    <input
                      type="text"
                      value={hobby.summary}
                      onChange={(e) => {
                        const next = [...draft.hobbies];
                        next[idx] = { ...hobby, summary: e.target.value };
                        setDraft({ ...draft, hobbies: next });
                      }}
                      placeholder="Short summary"
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                    />
                    <textarea
                      rows={2}
                      value={hobby.description}
                      onChange={(e) => {
                        const next = [...draft.hobbies];
                        next[idx] = { ...hobby, description: e.target.value };
                        setDraft({ ...draft, hobbies: next });
                      }}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Certificates & Milestones */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Certificates &amp; Milestones
                </h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const cert: CertificateItem = {
                        id: `cert-${Date.now()}`,
                        title: 'New Certificate / Award',
                        issuer: 'Issuing Organization',
                        date: '2026',
                        category: 'Award',
                        description: 'Details about this recognition.',
                        imageUrl: '/src/assets/images/achievement_certificate_desk_1794821503492.jpg',
                      };
                      setDraft({
                        ...draft,
                        achievements: {
                          ...draft.achievements,
                          certificates: [...draft.achievements.certificates, cert],
                        },
                      });
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Certificate</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const milestone: MilestoneItem = {
                        id: `mile-${Date.now()}`,
                        year: '2026',
                        title: 'New Milestone',
                        context: 'Organization or Context',
                        detail: 'Milestone overview.',
                      };
                      setDraft({
                        ...draft,
                        achievements: {
                          ...draft.achievements,
                          milestones: [milestone, ...draft.achievements.milestones],
                        },
                      });
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Milestone</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {draft.achievements.certificates.map((cert, idx) => (
                  <div
                    key={cert.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={cert.title}
                        onChange={(e) => {
                          const next = [...draft.achievements.certificates];
                          next[idx] = { ...cert, title: e.target.value };
                          setDraft({
                            ...draft,
                            achievements: { ...draft.achievements, certificates: next },
                          });
                        }}
                        className="font-semibold text-sm flex-1 bg-transparent border-b border-slate-200 dark:border-slate-700 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            achievements: {
                              ...draft.achievements,
                              certificates: draft.achievements.certificates.filter(
                                (c) => c.id !== cert.id
                              ),
                            },
                          })
                        }
                        className="text-xs text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={cert.issuer}
                        onChange={(e) => {
                          const next = [...draft.achievements.certificates];
                          next[idx] = { ...cert, issuer: e.target.value };
                          setDraft({
                            ...draft,
                            achievements: { ...draft.achievements, certificates: next },
                          });
                        }}
                        placeholder="Issuer"
                        className="px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                      />
                      <input
                        type="text"
                        value={cert.date}
                        onChange={(e) => {
                          const next = [...draft.achievements.certificates];
                          next[idx] = { ...cert, date: e.target.value };
                          setDraft({
                            ...draft,
                            achievements: { ...draft.achievements, certificates: next },
                          });
                        }}
                        placeholder="Date"
                        className="px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                      />
                    </div>
                    <label className="inline-block px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 text-xs font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">
                      Upload Certificate Image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleSingleImageUpload(e.target.files?.[0], (url) => {
                            const next = [...draft.achievements.certificates];
                            next[idx] = { ...cert, imageUrl: url };
                            setDraft({
                              ...draft,
                              achievements: { ...draft.achievements, certificates: next },
                            });
                          })
                        }
                      />
                    </label>
                    <textarea
                      rows={2}
                      value={cert.description}
                      onChange={(e) => {
                        const next = [...draft.achievements.certificates];
                        next[idx] = { ...cert, description: e.target.value };
                        setDraft({
                          ...draft,
                          achievements: { ...draft.achievements, certificates: next },
                        });
                      }}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CONTACT MESSAGES INBOX */}
        {activeTab === 'messages' && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Contact Messages
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Inquiries stored in Supabase <code className="font-mono text-xs">contact_messages</code>.
                </p>
              </div>
              <button
                type="button"
                onClick={loadMessages}
                disabled={loadingMessages}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingMessages ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {messages.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">
                No messages recorded yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {messages.map((msg) => (
                  <div key={msg.id} className="py-4 space-y-1.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                        {msg.subject}
                      </h3>
                      <span className="text-xs font-mono tabular-nums text-slate-500">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      {msg.name} · {msg.email} ·{' '}
                      {msg.emailDelivered ? 'Email Delivered' : 'Saved to Database'}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                      {msg.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: SUPABASE & SETUP GUIDE */}
        {activeTab === 'setup' && (
          <div className="space-y-6">
            {/* Live Supabase Status Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Supabase Database &amp; Storage Connection
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void refreshSupabaseStatus()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Check Status</span>
                  </button>
                  <button
                    type="button"
                    disabled={syncingSupabase}
                    onClick={async () => {
                      setSyncingSupabase(true);
                      setNotice(null);
                      try {
                        await syncToSupabase();
                        showSuccess('Synced all website content and photos to Supabase.');
                      } catch (err) {
                        showError(err, 'Sync failed. Make sure supabase/schema.sql has been run.');
                      } finally {
                        setSyncingSupabase(false);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold"
                  >
                    {syncingSupabase ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>Sync &amp; Seed to Supabase</span>
                  </button>
                </div>
              </div>

              {supabaseStatus && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Project ID</p>
                    <p className="mt-1 font-mono font-semibold text-slate-900 dark:text-white">
                      {supabaseStatus.projectId}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Postgres Tables</p>
                    <p
                      className={`mt-1 font-semibold ${
                        supabaseStatus.tablesReady
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {supabaseStatus.tablesReady ? 'Ready (Connected)' : 'Needs SQL Schema'}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Storage Bucket (photos)</p>
                    <p
                      className={`mt-1 font-semibold ${
                        supabaseStatus.storageReady
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {supabaseStatus.storageReady ? 'Ready (Public Bucket)' : 'Needs SQL Schema'}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Server Auth Mode</p>
                    <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                      {supabaseStatus.hasSecretKey ? 'Secret Key' : 'Publishable Key'}
                    </p>
                  </div>
                </div>
              )}

              {supabaseStatus && (!supabaseStatus.tablesReady || !supabaseStatus.storageReady) && (
                <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-4 text-xs sm:text-sm text-amber-900 dark:text-amber-200 space-y-3">
                  <p className="font-semibold">
                    One-time setup required in your Supabase Dashboard:
                  </p>
                  <p>
                    Open <strong>Supabase Dashboard → SQL Editor → New Query</strong> for project{' '}
                    <code className="font-mono font-semibold">{supabaseStatus.projectId}</code>, paste the SQL script below, click <strong>Run</strong>, and then click <strong>Sync &amp; Seed to Supabase</strong> above.
                  </p>
                  {supabaseStatus.lastError && (
                    <p className="font-mono text-xs opacity-85">
                      Current status: {supabaseStatus.lastError}
                    </p>
                  )}
                </div>
              )}

              {supabaseStatus?.schemaSql && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      supabase/schema.sql
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(supabaseStatus.schemaSql);
                        setCopiedSql(true);
                        setTimeout(() => setCopiedSql(false), 2000);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSql ? 'Copied SQL' : 'Copy SQL'}</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto max-h-72 border border-slate-800">
                    {supabaseStatus.schemaSql}
                  </pre>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Live Contact Email Delivery (Resend)
              </h3>
              <p>
                Contact messages are automatically stored in Supabase <code className="font-mono text-xs">contact_messages</code> once the SQL schema is run. To also forward messages by email, add these variables in your environment secrets:
              </p>
              <ul className="list-disc pl-5 space-y-1 font-mono text-xs">
                <li>RESEND_API_KEY="re_..."</li>
                <li>CONTACT_TO_EMAIL="acct.imphal@gmail.com"</li>
                <li>CONTACT_FROM_EMAIL="Personal Website &lt;onboarding@resend.dev&gt;"</li>
              </ul>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
