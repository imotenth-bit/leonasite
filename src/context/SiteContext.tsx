import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { DEFAULT_SITE_DATA } from '../data/defaultSiteData.ts';
import type {
  AdminStatus,
  ContactMessageItem,
  PhotoItem,
  SiteData,
  SupabaseStatus,
} from '../types/site.ts';

interface UploadPhotoOptions {
  files: FileList | File[];
  category: string;
  title?: string;
  description?: string;
  location?: string;
  dateTaken?: string;
}

interface SiteContextValue {
  site: SiteData;
  loading: boolean;
  error: string | null;
  adminStatus: AdminStatus;
  supabaseStatus: SupabaseStatus | null;
  refreshSite: () => Promise<void>;
  refreshAdminStatus: () => Promise<void>;
  refreshSupabaseStatus: () => Promise<SupabaseStatus | null>;
  syncToSupabase: () => Promise<SupabaseStatus>;
  fetchAdminMessages: () => Promise<ContactMessageItem[]>;
  saveSiteData: (next: SiteData) => Promise<SiteData>;
  uploadPhotos: (options: UploadPhotoOptions) => Promise<PhotoItem[]>;
  updatePhoto: (id: string, patch: Partial<PhotoItem>) => Promise<PhotoItem>;
  replacePhotoFile: (id: string, file: File) => Promise<PhotoItem>;
  deletePhoto: (id: string) => Promise<void>;
  addCategory: (name: string) => Promise<void>;
  deleteCategory: (name: string) => Promise<void>;
  uploadSingleImage: (file: File) => Promise<string>;
  setupAdmin: (password: string) => Promise<void>;
  loginAdmin: (password: string) => Promise<void>;
  logoutAdmin: () => Promise<void>;
}

const SiteContext = createContext<SiteContextValue | undefined>(undefined);

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    return body.error || `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

export function SiteProvider({ children }: { children: ReactNode }) {
  const [site, setSite] = useState<SiteData>(DEFAULT_SITE_DATA);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseStatus | null>(null);
  const [adminStatus, setAdminStatus] = useState<AdminStatus>({
    authenticated: false,
    hasPasswordConfigured: true,
    usingEnvPassword: false,
  });

  const refreshSite = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/site', { credentials: 'include' });
      if (!res.ok) {
        throw new Error(await parseErrorMessage(res));
      }
      const data = (await res.json()) as SiteData;
      setSite(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load website content.');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAdminStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/status', { credentials: 'include' });
      if (res.ok) {
        const status = (await res.json()) as AdminStatus;
        setAdminStatus(status);
      }
    } catch {
      // Non-blocking status check
    }
  }, []);

  const refreshSupabaseStatus = useCallback(async (): Promise<SupabaseStatus | null> => {
    try {
      const res = await fetch('/api/supabase/status', { credentials: 'include' });
      if (res.ok) {
        const status = (await res.json()) as SupabaseStatus;
        setSupabaseStatus(status);
        return status;
      }
    } catch {
      // Ignore transient status fetch failure
    }
    return null;
  }, []);

  useEffect(() => {
    void refreshSite();
    void refreshAdminStatus();
    void refreshSupabaseStatus();
  }, [refreshSite, refreshAdminStatus, refreshSupabaseStatus]);

  const syncToSupabase = async (): Promise<SupabaseStatus> => {
    const res = await fetch('/api/supabase/sync', {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res));
    }
    const body = (await res.json()) as { status: SupabaseStatus; site: SiteData };
    setSupabaseStatus(body.status);
    setSite(body.site);
    return body.status;
  };

  const fetchAdminMessages = async (): Promise<ContactMessageItem[]> => {
    const res = await fetch('/api/admin/messages', { credentials: 'include' });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res));
    }
    const body = (await res.json()) as { messages: ContactMessageItem[] };
    return body.messages;
  };

  const saveSiteData = async (next: SiteData): Promise<SiteData> => {
    const res = await fetch('/api/site', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(next),
    });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res));
    }
    const updated = (await res.json()) as SiteData;
    setSite(updated);
    return updated;
  };

  const uploadPhotos = async (options: UploadPhotoOptions): Promise<PhotoItem[]> => {
    const formData = new FormData();
    const fileList = Array.from(options.files);
    for (const file of fileList) {
      formData.append('files', file);
    }
    formData.append('category', options.category);
    if (options.title) formData.append('title', options.title);
    if (options.description) formData.append('description', options.description);
    if (options.location) formData.append('location', options.location);
    if (options.dateTaken) formData.append('dateTaken', options.dateTaken);

    const res = await fetch('/api/photos/upload', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res));
    }
    const body = (await res.json()) as { added: PhotoItem[]; site: SiteData };
    setSite(body.site);
    return body.added;
  };

  const updatePhoto = async (id: string, patch: Partial<PhotoItem>): Promise<PhotoItem> => {
    const res = await fetch(`/api/photos/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res));
    }
    const body = (await res.json()) as { photo: PhotoItem; site: SiteData };
    setSite(body.site);
    return body.photo;
  };

  const replacePhotoFile = async (id: string, file: File): Promise<PhotoItem> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`/api/photos/${encodeURIComponent(id)}/replace`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res));
    }
    const body = (await res.json()) as { photo: PhotoItem; site: SiteData };
    setSite(body.site);
    return body.photo;
  };

  const deletePhoto = async (id: string): Promise<void> => {
    const res = await fetch(`/api/photos/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res));
    }
    const body = (await res.json()) as { site: SiteData };
    setSite(body.site);
  };

  const addCategory = async (name: string): Promise<void> => {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res));
    }
    const body = (await res.json()) as { site: SiteData };
    setSite(body.site);
  };

  const deleteCategory = async (name: string): Promise<void> => {
    const res = await fetch(`/api/categories/${encodeURIComponent(name)}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res));
    }
    const body = (await res.json()) as { site: SiteData };
    setSite(body.site);
  };

  const uploadSingleImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload-image', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res));
    }
    const body = (await res.json()) as { imageUrl: string };
    return body.imageUrl;
  };

  const setupAdmin = async (password: string): Promise<void> => {
    const res = await fetch('/api/admin/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res));
    }
    await refreshAdminStatus();
  };

  const loginAdmin = async (password: string): Promise<void> => {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res));
    }
    await refreshAdminStatus();
  };

  const logoutAdmin = async (): Promise<void> => {
    await fetch('/api/admin/logout', {
      method: 'POST',
      credentials: 'include',
    });
    await refreshAdminStatus();
  };

  return (
    <SiteContext.Provider
      value={{
        site,
        loading,
        error,
        adminStatus,
        supabaseStatus,
        refreshSite,
        refreshAdminStatus,
        refreshSupabaseStatus,
        syncToSupabase,
        fetchAdminMessages,
        saveSiteData,
        uploadPhotos,
        updatePhoto,
        replacePhotoFile,
        deletePhoto,
        addCategory,
        deleteCategory,
        uploadSingleImage,
        setupAdmin,
        loginAdmin,
        logoutAdmin,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
}

export function useSite(): SiteContextValue {
  const ctx = useContext(SiteContext);
  if (!ctx) {
    throw new Error('useSite must be used within SiteProvider');
  }
  return ctx;
}
