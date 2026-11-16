import { useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Camera,
  Check,
  Loader2,
  Lock,
  Pencil,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { Lightbox } from '../components/Lightbox.tsx';
import { PageHeader } from '../components/PageHeader.tsx';
import { SafeImage } from '../components/SafeImage.tsx';
import { useSite } from '../context/SiteContext.tsx';
import type { PhotoItem } from '../types/site.ts';

export function GalleryPage() {
  const {
    site,
    adminStatus,
    uploadPhotos,
    updatePhoto,
    replacePhotoFile,
    deletePhoto,
  } = useSite();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Admin upload & inline editing states
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
  const [uploadCategory, setUploadCategory] = useState<string>(site.categories[0] || 'Personal');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadLocation, setUploadLocation] = useState('');
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [editingPhoto, setEditingPhoto] = useState<PhotoItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [busyPhotoId, setBusyPhotoId] = useState<string | null>(null);

  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null);

  const categories = ['All', ...site.categories];
  const filteredPhotos =
    selectedCategory === 'All'
      ? site.photos
      : site.photos.filter((p) => p.category === selectedCategory);

  const handleUploadSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!uploadFiles || uploadFiles.length === 0) {
      setFeedback({ type: 'error', text: 'Please select one or more image files from your computer.' });
      return;
    }
    setUploading(true);
    setFeedback(null);
    try {
      const added = await uploadPhotos({
        files: uploadFiles,
        category: uploadCategory,
        title: uploadTitle,
        description: uploadDescription,
        location: uploadLocation,
      });
      setFeedback({
        type: 'success',
        text: `Uploaded ${added.length} photograph${added.length > 1 ? 's' : ''} to ${uploadCategory}.`,
      });
      setUploadFiles(null);
      setUploadTitle('');
      setUploadDescription('');
      setUploadLocation('');
      setShowUploadPanel(false);
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to upload photographs.',
      });
    } finally {
      setUploading(false);
    }
  };

  const openEditModal = (photo: PhotoItem) => {
    setEditingPhoto(photo);
    setEditTitle(photo.title);
    setEditDescription(photo.description);
    setEditCategory(photo.category);
    setEditLocation(photo.location || '');
  };

  const handleEditSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingPhoto) return;
    setSavingEdit(true);
    setFeedback(null);
    try {
      await updatePhoto(editingPhoto.id, {
        title: editTitle,
        description: editDescription,
        category: editCategory,
        location: editLocation,
      });
      setEditingPhoto(null);
      setFeedback({ type: 'success', text: 'Photograph details updated.' });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update photograph.',
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const triggerReplaceFile = (photoId: string) => {
    setReplaceTargetId(photoId);
    replaceInputRef.current?.click();
  };

  const handleReplaceFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !replaceTargetId) return;
    setBusyPhotoId(replaceTargetId);
    setFeedback(null);
    try {
      await replacePhotoFile(replaceTargetId, file);
      setFeedback({ type: 'success', text: 'Photograph image replaced persistently.' });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to replace photograph.',
      });
    } finally {
      setBusyPhotoId(null);
      setReplaceTargetId(null);
    }
  };

  const handleDeletePhoto = async (photo: PhotoItem) => {
    setBusyPhotoId(photo.id);
    setFeedback(null);
    try {
      await deletePhoto(photo.id);
      setFeedback({ type: 'success', text: `Deleted "${photo.title}".` });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to delete photograph.',
      });
    } finally {
      setBusyPhotoId(null);
    }
  };

  return (
    <div>
      <PageHeader
        kicker="Photography Collection"
        title="Photo Gallery"
        subtitle="Browse personal moments, family gatherings, campus friends, travel landscapes, and everyday memories. Click any photograph for full-screen view."
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-8">
        {/* Toolbar: Category Filters + Upload Trigger */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div
            role="tablist"
            aria-label="Filter photographs by category"
            className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          >
            {categories.map((category) => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-600 ${
                    active
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {adminStatus.authenticated ? (
              <button
                type="button"
                onClick={() => setShowUploadPanel((prev) => !prev)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors whitespace-nowrap"
              >
                <Upload className="w-4 h-4" aria-hidden="true" />
                <span>{showUploadPanel ? 'Close Uploader' : 'Upload Photos'}</span>
              </button>
            ) : (
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition-colors whitespace-nowrap"
              >
                <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                <span>Admin Sign-In to Upload / Edit</span>
              </Link>
            )}
          </div>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div
            role="status"
            className={`p-4 rounded-xl border text-sm flex items-center justify-between gap-4 ${
              feedback.type === 'success'
                ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200'
                : 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
            }`}
          >
            <span>{feedback.text}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              aria-label="Dismiss notification"
              className="p-1 hover:opacity-75"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Authenticated Multi-Photo Upload Panel */}
        {adminStatus.authenticated && showUploadPanel && (
          <form
            onSubmit={handleUploadSubmit}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Upload Multiple Photographs
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                JPG, PNG, WebP, GIF, AVIF · Max 10 MB each
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Image Files
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setUploadFiles(e.target.files)}
                  className="block w-full text-sm text-slate-600 dark:text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-950 dark:file:text-blue-300"
                />
                {uploadFiles && uploadFiles.length > 0 && (
                  <p className="mt-1.5 text-xs text-blue-600 dark:text-blue-400">
                    {uploadFiles.length} file{uploadFiles.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Category
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                >
                  {site.categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Location (Optional)
                </label>
                <input
                  type="text"
                  value={uploadLocation}
                  onChange={(e) => setUploadLocation(e.target.value)}
                  placeholder="Seattle, WA"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Title Prefix (Optional — defaults to filename)
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Weekend Mountain Hike"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Short story or context behind these photographs"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowUploadPanel(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>{uploading ? 'Uploading...' : 'Save Photographs'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Hidden file input for replacing a photo */}
        <input
          ref={replaceInputRef}
          type="file"
          accept="image/*"
          onChange={handleReplaceFileChange}
          className="hidden"
        />

        {/* Photo Grid */}
        {filteredPhotos.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center space-y-3">
            <Camera className="w-10 h-10 mx-auto text-slate-400" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              No photographs in {selectedCategory}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Select another category or sign in as Administrator to upload new photographs.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPhotos.map((photo, index) => {
              const isBusy = busyPhotoId === photo.id;
              return (
                <article
                  key={photo.id}
                  className="group rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow flex flex-col"
                >
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(index)}
                    aria-label={`Open full-screen view of ${photo.title}`}
                    className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800 focus-visible:outline-2 focus-visible:outline-blue-600"
                  >
                    <SafeImage
                      src={photo.imageUrl}
                      alt={photo.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/65 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    />
                  </button>

                  <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {photo.category} · <span className="font-mono tabular-nums">{photo.dateTaken}</span>
                        {photo.location ? ` · ${photo.location}` : ''}
                      </p>
                      <h3 className="mt-1.5 text-base font-semibold text-slate-900 dark:text-white">
                        {photo.title}
                      </h3>
                      {photo.description && (
                        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                          {photo.description}
                        </p>
                      )}
                    </div>

                    {adminStatus.authenticated && (
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(photo)}
                          disabled={isBusy}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 px-2.5 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => triggerReplaceFile(photo.id)}
                          disabled={isBusy}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 px-2.5 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isBusy ? 'animate-spin' : ''}`} aria-hidden="true" />
                          <span>Replace</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePhoto(photo)}
                          disabled={isBusy}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 px-2.5 py-1.5 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Edit Photo Modal */}
      {editingPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Edit photograph details"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleEditSave}
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Edit Photograph Details
              </h2>
              <button
                type="button"
                onClick={() => setEditingPhoto(null)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Title
              </label>
              <input
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
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
                  Location
                </label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingPhoto(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
              >
                {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <Lightbox
        items={filteredPhotos}
        activeIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    </div>
  );
}
