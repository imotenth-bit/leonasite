import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { DEFAULT_SITE_DATA } from './src/data/defaultSiteData.ts';
import type { ContactMessageItem, PhotoItem, SiteData, SupabaseStatus } from './src/types/site.ts';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const ROOT_DIR = process.cwd();
const DATA_DIR = path.join(ROOT_DIR, 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const SITE_DATA_FILE = path.join(DATA_DIR, 'site-data.json');
const ADMIN_AUTH_FILE = path.join(DATA_DIR, 'admin-auth.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const SCHEMA_SQL_FILE = path.join(ROOT_DIR, 'supabase', 'schema.sql');
const COOKIE_NAME = 'personal_site_admin_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

// Supabase configuration (non-secret URL + publishable key from user project)
const SUPABASE_PROJECT_ID = 'cvwbaxkxpconetzdmvyl';
const SUPABASE_URL = (process.env.SUPABASE_URL || `https://${SUPABASE_PROJECT_ID}.supabase.co`).trim();
const SUPABASE_PUBLISHABLE_KEY = (
  process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_sMzxqCxQOYjF9i7wGX1zGw_L5_uMkiE'
).trim();
const SUPABASE_SECRET_KEY = (process.env.SUPABASE_SECRET_KEY || '').trim();
const SUPABASE_BUCKET = 'photos';

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SECRET_KEY || SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const RUNTIME_SECRET =
  process.env.SESSION_SECRET && process.env.SESSION_SECRET.trim().length >= 16
    ? process.env.SESSION_SECRET.trim()
    : getOrCreateEphemeralSecret();

function getOrCreateEphemeralSecret(): string {
  const secretFile = path.join(DATA_DIR, '.session-secret');
  if (fs.existsSync(secretFile)) {
    return fs.readFileSync(secretFile, 'utf8').trim();
  }
  const generated = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(secretFile, generated, { mode: 0o600 });
  return generated;
}

function readSchemaSql(): string {
  if (fs.existsSync(SCHEMA_SQL_FILE)) {
    return fs.readFileSync(SCHEMA_SQL_FILE, 'utf8');
  }
  return '';
}

function readLocalSiteData(): SiteData {
  if (!fs.existsSync(SITE_DATA_FILE)) {
    fs.writeFileSync(SITE_DATA_FILE, JSON.stringify(DEFAULT_SITE_DATA, null, 2), 'utf8');
    return structuredClone(DEFAULT_SITE_DATA);
  }
  try {
    const raw = fs.readFileSync(SITE_DATA_FILE, 'utf8');
    return JSON.parse(raw) as SiteData;
  } catch {
    return structuredClone(DEFAULT_SITE_DATA);
  }
}

function writeLocalSiteData(data: SiteData): SiteData {
  const next: SiteData = {
    ...data,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(SITE_DATA_FILE, JSON.stringify(next, null, 2), 'utf8');
  return next;
}

interface SupabasePhotoRow {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url: string;
  storage_path: string | null;
  date_taken: string;
  location: string | null;
  featured: boolean;
  created_at: string;
}

interface SupabaseSettingsRow {
  id: string;
  profile: SiteData['profile'];
  about: SiteData['about'];
  categories: SiteData['categories'];
  education: SiteData['education'];
  hobbies: SiteData['hobbies'];
  achievements: SiteData['achievements'];
  updated_at: string;
}

function mapPhotoRowToItem(row: SupabasePhotoRow): PhotoItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    imageUrl: row.image_url,
    storagePath: row.storage_path || undefined,
    dateTaken: row.date_taken,
    location: row.location || undefined,
    featured: row.featured,
    createdAt: row.created_at,
  };
}

function mapPhotoItemToRow(photo: PhotoItem): SupabasePhotoRow {
  return {
    id: photo.id,
    title: photo.title,
    description: photo.description || '',
    category: photo.category,
    image_url: photo.imageUrl,
    storage_path: photo.storagePath || null,
    date_taken: photo.dateTaken,
    location: photo.location || null,
    featured: Boolean(photo.featured),
    created_at: photo.createdAt || new Date().toISOString(),
  };
}

async function getSupabaseDiagnostics(): Promise<SupabaseStatus> {
  let tablesReady = false;
  let storageReady = false;
  let lastError: string | null = null;

  try {
    const [settingsCheck, photosCheck] = await Promise.all([
      supabase.from('site_settings').select('id').limit(1),
      supabase.from('photos').select('id').limit(1),
    ]);

    if (!settingsCheck.error && !photosCheck.error) {
      tablesReady = true;
    } else {
      lastError = settingsCheck.error?.message || photosCheck.error?.message || 'Supabase tables not initialized yet.';
    }
  } catch (err) {
    lastError = err instanceof Error ? err.message : 'Unable to connect to Supabase database.';
  }

  try {
    const bucketRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket/${SUPABASE_BUCKET}`, {
      headers: {
        apikey: SUPABASE_SECRET_KEY || SUPABASE_PUBLISHABLE_KEY,
        ...(SUPABASE_SECRET_KEY ? { Authorization: `Bearer ${SUPABASE_SECRET_KEY}` } : {}),
      },
    });
    if (bucketRes.ok) {
      storageReady = true;
    } else if (!lastError) {
      lastError = `Storage bucket '${SUPABASE_BUCKET}' not found yet.`;
    }
  } catch (err) {
    if (!lastError) {
      lastError = err instanceof Error ? err.message : 'Unable to reach Supabase Storage.';
    }
  }

  return {
    projectId: SUPABASE_PROJECT_ID,
    url: SUPABASE_URL,
    configured: Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY),
    tablesReady,
    storageReady,
    hasSecretKey: Boolean(SUPABASE_SECRET_KEY),
    lastError,
    schemaSql: readSchemaSql(),
  };
}

async function seedSupabaseFromSiteData(data: SiteData): Promise<{ ok: boolean; error?: string }> {
  const settingsRow: SupabaseSettingsRow = {
    id: 'main',
    profile: data.profile,
    about: data.about,
    categories: data.categories,
    education: data.education,
    hobbies: data.hobbies,
    achievements: data.achievements,
    updated_at: new Date().toISOString(),
  };

  const { error: settingsErr } = await supabase
    .from('site_settings')
    .upsert(settingsRow, { onConflict: 'id' });
  if (settingsErr) {
    return { ok: false, error: settingsErr.message };
  }

  if (data.photos.length > 0) {
    const rows = data.photos.map(mapPhotoItemToRow);
    const { error: photosErr } = await supabase
      .from('photos')
      .upsert(rows, { onConflict: 'id' });
    if (photosErr) {
      return { ok: false, error: photosErr.message };
    }
  }

  return { ok: true };
}

async function readSiteData(): Promise<SiteData> {
  const localData = readLocalSiteData();

  try {
    const [settingsRes, photosRes] = await Promise.all([
      supabase.from('site_settings').select('*').eq('id', 'main').maybeSingle(),
      supabase.from('photos').select('*').order('created_at', { ascending: false }),
    ]);

    if (settingsRes.error || photosRes.error) {
      return localData;
    }

    if (!settingsRes.data) {
      // Tables exist in Supabase, seed initial Maibam Leona content automatically!
      await seedSupabaseFromSiteData(localData);
      return localData;
    }

    const row = settingsRes.data as SupabaseSettingsRow;
    const photos = ((photosRes.data as SupabasePhotoRow[] | null) || []).map(mapPhotoRowToItem);
    const merged: SiteData = {
      profile: row.profile,
      about: row.about,
      categories: row.categories,
      photos,
      education: row.education,
      hobbies: row.hobbies,
      achievements: row.achievements,
      updatedAt: row.updated_at || new Date().toISOString(),
    };
    writeLocalSiteData(merged);
    return merged;
  } catch {
    return localData;
  }
}

async function writeSiteSettingsToStore(data: SiteData): Promise<SiteData> {
  const savedLocal = writeLocalSiteData(data);
  try {
    await supabase.from('site_settings').upsert(
      {
        id: 'main',
        profile: savedLocal.profile,
        about: savedLocal.about,
        categories: savedLocal.categories,
        education: savedLocal.education,
        hobbies: savedLocal.hobbies,
        achievements: savedLocal.achievements,
        updated_at: savedLocal.updatedAt,
      },
      { onConflict: 'id' }
    );
  } catch {
    // Keep local backup intact if Supabase tables aren't initialized yet
  }
  return savedLocal;
}

interface StoredAdminAuth {
  salt: string;
  hash: string;
  createdAt: string;
}

function readStoredAdminAuth(): StoredAdminAuth | null {
  if (!fs.existsSync(ADMIN_AUTH_FILE)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(ADMIN_AUTH_FILE, 'utf8')) as StoredAdminAuth;
  } catch {
    return null;
  }
}

function hasEnvPassword(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.trim().length > 0);
}

function hasConfiguredPassword(): boolean {
  return hasEnvPassword() || readStoredAdminAuth() !== null;
}

function verifyPassword(password: string): boolean {
  if (hasEnvPassword()) {
    const expected = process.env.ADMIN_PASSWORD!.trim();
    const a = crypto.createHash('sha256').update(password).digest();
    const b = crypto.createHash('sha256').update(expected).digest();
    return crypto.timingSafeEqual(a, b);
  }
  const stored = readStoredAdminAuth();
  if (!stored) return false;
  const derived = crypto.scryptSync(password, stored.salt, 64);
  const target = Buffer.from(stored.hash, 'hex');
  if (derived.length !== target.length) return false;
  return crypto.timingSafeEqual(derived, target);
}

function signSessionToken(expiresAt: number): string {
  const payload = `${expiresAt}.${crypto.randomBytes(12).toString('hex')}`;
  const sig = crypto.createHmac('sha256', RUNTIME_SECRET).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [expiresStr, nonce, sig] = parts;
  const expiresAt = Number(expiresStr);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;
  const payload = `${expiresStr}.${nonce}`;
  const expectedSig = crypto.createHmac('sha256', RUNTIME_SECRET).update(payload).digest('hex');
  const a = Buffer.from(sig, 'hex');
  const b = Buffer.from(expectedSig, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  const result: Record<string, string> = {};
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = decodeURIComponent(part.slice(idx + 1).trim());
    result[key] = val;
  }
  return result;
}

function isAuthenticatedRequest(req: Request): boolean {
  const cookies = parseCookies(req.headers.cookie);
  return verifySessionToken(cookies[COOKIE_NAME]);
}

function setSessionCookie(res: Response, token: string): void {
  const isProd = process.env.NODE_ENV === 'production';
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
  ];
  if (isProd) {
    parts.push('Secure');
  }
  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearSessionCookie(res: Response): void {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!isAuthenticatedRequest(req)) {
    res.status(401).json({ error: 'Administrator authentication required.' });
    return;
  }
  next();
}

async function storeUploadedImage(
  file: Express.Multer.File,
  folder = 'gallery'
): Promise<{ imageUrl: string; storagePath?: string }> {
  const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
  const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'].includes(ext) ? ext : '.jpg';
  const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${safeExt}`;
  const objectPath = `${folder}/${uniqueName}`;

  try {
    const { error: uploadErr } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(objectPath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (!uploadErr) {
      const { data: publicUrlData } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(objectPath);
      return {
        imageUrl: publicUrlData.publicUrl,
        storagePath: objectPath,
      };
    }
  } catch {
    // Fallback to local uploads directory if Supabase Storage bucket isn't ready yet
  }

  const localPath = path.join(UPLOADS_DIR, uniqueName);
  fs.writeFileSync(localPath, file.buffer);
  return { imageUrl: `/uploads/${uniqueName}` };
}

async function removeStoredImage(imageUrl: string, storagePath?: string): Promise<void> {
  if (storagePath) {
    try {
      await supabase.storage.from(SUPABASE_BUCKET).remove([storagePath]);
    } catch {
      // Ignore remote cleanup error
    }
  }
  if (imageUrl.startsWith('/uploads/')) {
    const filename = path.basename(imageUrl);
    const fullPath = path.join(UPLOADS_DIR, filename);
    if (fullPath.startsWith(UPLOADS_DIR) && fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
      } catch {
        // Ignore local cleanup error
      }
    }
  }
}

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB per image
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported image format. Please upload JPG, PNG, WebP, GIF, or AVIF files.'));
    }
  },
});

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '4mb' }));

  app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '7d' }));

  // Public site content endpoint (backed by Supabase + local sync)
  app.get('/api/site', async (_req, res) => {
    const data = await readSiteData();
    res.json(data);
  });

  // Supabase connection diagnostics
  app.get('/api/supabase/status', async (_req, res) => {
    const status = await getSupabaseDiagnostics();
    res.json(status);
  });

  // Force sync/seed current local site data & photos into Supabase
  app.post('/api/supabase/sync', requireAdmin, async (_req, res) => {
    const localData = readLocalSiteData();
    const result = await seedSupabaseFromSiteData(localData);
    const status = await getSupabaseDiagnostics();
    if (!result.ok) {
      res.status(400).json({ error: result.error || 'Unable to sync to Supabase.', status });
      return;
    }
    const fresh = await readSiteData();
    res.json({ ok: true, status, site: fresh });
  });

  // Admin auth status
  app.get('/api/admin/status', (req, res) => {
    res.json({
      authenticated: isAuthenticatedRequest(req),
      hasPasswordConfigured: hasConfiguredPassword(),
      usingEnvPassword: hasEnvPassword(),
    });
  });

  // First-time Admin password setup
  app.post('/api/admin/setup', (req, res) => {
    if (hasConfiguredPassword()) {
      res.status(409).json({ error: 'An administrator password is already configured.' });
      return;
    }
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    const record: StoredAdminAuth = {
      salt,
      hash,
      createdAt: new Date().toISOString(),
    };
    fs.writeFileSync(ADMIN_AUTH_FILE, JSON.stringify(record, null, 2), { mode: 0o600 });
    const token = signSessionToken(Date.now() + SESSION_TTL_MS);
    setSessionCookie(res, token);
    res.json({ authenticated: true });
  });

  // Admin login
  app.post('/api/admin/login', (req, res) => {
    if (!hasConfiguredPassword()) {
      res.status(400).json({ error: 'Administrator password has not been set up yet.' });
      return;
    }
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!verifyPassword(password)) {
      res.status(401).json({ error: 'Incorrect administrator password.' });
      return;
    }
    const token = signSessionToken(Date.now() + SESSION_TTL_MS);
    setSessionCookie(res, token);
    res.json({ authenticated: true });
  });

  // Admin logout
  app.post('/api/admin/logout', (_req, res) => {
    clearSessionCookie(res);
    res.json({ authenticated: false });
  });

  // Admin messages inbox (reads from Supabase contact_messages + local fallback)
  app.get('/api/admin/messages', requireAdmin, async (_req, res) => {
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && Array.isArray(data)) {
        const mapped: ContactMessageItem[] = data.map((row) => ({
          id: String(row.id),
          name: String(row.name),
          email: String(row.email),
          subject: String(row.subject),
          message: String(row.message),
          emailDelivered: Boolean(row.email_delivered),
          createdAt: String(row.created_at),
        }));
        res.json({ messages: mapped });
        return;
      }
    } catch {
      // Fallback to local messages file
    }

    const localMsgs = fs.existsSync(MESSAGES_FILE)
      ? (JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8')) as ContactMessageItem[])
      : [];
    res.json({ messages: localMsgs });
  });

  // Update entire site content
  app.put('/api/site', requireAdmin, async (req, res) => {
    const current = await readSiteData();
    const payload = req.body as Partial<SiteData>;
    const updated = await writeSiteSettingsToStore({
      profile: payload.profile ?? current.profile,
      about: payload.about ?? current.about,
      categories:
        Array.isArray(payload.categories) && payload.categories.length > 0
          ? payload.categories
          : current.categories,
      photos: Array.isArray(payload.photos) ? payload.photos : current.photos,
      education: payload.education ?? current.education,
      hobbies: Array.isArray(payload.hobbies) ? payload.hobbies : current.hobbies,
      achievements: payload.achievements ?? current.achievements,
      updatedAt: new Date().toISOString(),
    });
    res.json(updated);
  });

  // Upload a single image for profile, banner, hobbies, or certificates
  app.post('/api/upload-image', requireAdmin, (req, res) => {
    upload.single('file')(req, res, async (err) => {
      if (err) {
        res.status(400).json({ error: err instanceof Error ? err.message : 'Upload failed.' });
        return;
      }
      if (!req.file) {
        res.status(400).json({ error: 'No image file provided.' });
        return;
      }
      const stored = await storeUploadedImage(req.file, 'assets');
      res.json({ imageUrl: stored.imageUrl });
    });
  });

  // Upload multiple gallery photographs persistently to Supabase Storage & Postgres
  app.post('/api/photos/upload', requireAdmin, (req, res) => {
    upload.array('files', 20)(req, res, async (err) => {
      if (err) {
        res.status(400).json({ error: err instanceof Error ? err.message : 'Upload failed.' });
        return;
      }
      const files = (req.files as Express.Multer.File[]) || [];
      if (files.length === 0) {
        res.status(400).json({ error: 'Please select at least one photograph to upload.' });
        return;
      }

      const site = await readSiteData();
      const rawCategory = typeof req.body?.category === 'string' ? req.body.category.trim() : '';
      const category =
        rawCategory && site.categories.includes(rawCategory)
          ? rawCategory
          : site.categories[0] || 'Personal';
      const titleInput = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
      const description = typeof req.body?.description === 'string' ? req.body.description.trim() : '';
      const location = typeof req.body?.location === 'string' ? req.body.location.trim() : '';
      const dateTaken =
        typeof req.body?.dateTaken === 'string' && req.body.dateTaken
          ? req.body.dateTaken
          : new Date().toISOString().slice(0, 10);

      const newPhotos: PhotoItem[] = [];
      for (let idx = 0; idx < files.length; idx++) {
        const file = files[idx];
        const stored = await storeUploadedImage(file, 'gallery');
        const baseTitle = path
          .basename(file.originalname, path.extname(file.originalname))
          .replace(/[-_]+/g, ' ')
          .trim();
        const resolvedTitle = titleInput
          ? files.length > 1
            ? `${titleInput} (${idx + 1})`
            : titleInput
          : baseTitle || 'Untitled Photograph';

        newPhotos.push({
          id: `photo-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
          title: resolvedTitle,
          description: description || 'Uploaded photograph from personal collection.',
          category,
          imageUrl: stored.imageUrl,
          storagePath: stored.storagePath,
          dateTaken,
          location: location || undefined,
          featured: false,
          createdAt: new Date().toISOString(),
        });
      }

      // Insert into Supabase photos table if ready
      try {
        await supabase.from('photos').insert(newPhotos.map(mapPhotoItemToRow));
      } catch {
        // Local JSON still retains photo records if Supabase isn't initialized yet
      }

      const updated = writeLocalSiteData({
        ...site,
        photos: [...newPhotos, ...site.photos],
      });

      res.json({ added: newPhotos, site: updated });
    });
  });

  // Update photo metadata
  app.put('/api/photos/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const site = await readSiteData();
    const index = site.photos.findIndex((p) => p.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Photograph not found.' });
      return;
    }
    const existing = site.photos[index];
    const updatedPhoto: PhotoItem = {
      ...existing,
      title:
        typeof req.body?.title === 'string' && req.body.title.trim()
          ? req.body.title.trim()
          : existing.title,
      description:
        typeof req.body?.description === 'string'
          ? req.body.description.trim()
          : existing.description,
      category:
        typeof req.body?.category === 'string' && req.body.category.trim()
          ? req.body.category.trim()
          : existing.category,
      location:
        typeof req.body?.location === 'string' ? req.body.location.trim() : existing.location,
      dateTaken:
        typeof req.body?.dateTaken === 'string' && req.body.dateTaken
          ? req.body.dateTaken
          : existing.dateTaken,
      featured:
        typeof req.body?.featured === 'boolean' ? req.body.featured : existing.featured,
    };

    try {
      await supabase
        .from('photos')
        .update(mapPhotoItemToRow(updatedPhoto))
        .eq('id', id);
    } catch {
      // Continue with local sync
    }

    const nextPhotos = [...site.photos];
    nextPhotos[index] = updatedPhoto;
    const updated = writeLocalSiteData({ ...site, photos: nextPhotos });
    res.json({ photo: updatedPhoto, site: updated });
  });

  // Replace photograph image file
  app.post('/api/photos/:id/replace', requireAdmin, (req, res) => {
    upload.single('file')(req, res, async (err) => {
      if (err) {
        res.status(400).json({ error: err instanceof Error ? err.message : 'Replacement upload failed.' });
        return;
      }
      if (!req.file) {
        res.status(400).json({ error: 'Please select a replacement image file.' });
        return;
      }
      const id = String(req.params.id);
      const site = await readSiteData();
      const index = site.photos.findIndex((p) => p.id === id);
      if (index === -1) {
        res.status(404).json({ error: 'Photograph not found.' });
        return;
      }
      const oldPhoto = site.photos[index];
      const stored = await storeUploadedImage(req.file, 'gallery');
      await removeStoredImage(oldPhoto.imageUrl, oldPhoto.storagePath);

      const replacedPhoto: PhotoItem = {
        ...oldPhoto,
        imageUrl: stored.imageUrl,
        storagePath: stored.storagePath,
      };

      try {
        await supabase
          .from('photos')
          .update({
            image_url: replacedPhoto.imageUrl,
            storage_path: replacedPhoto.storagePath || null,
          })
          .eq('id', id);
      } catch {
        // Continue with local sync
      }

      const nextPhotos = [...site.photos];
      nextPhotos[index] = replacedPhoto;
      const updated = writeLocalSiteData({ ...site, photos: nextPhotos });
      res.json({ photo: replacedPhoto, site: updated });
    });
  });

  // Delete photograph
  app.delete('/api/photos/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const site = await readSiteData();
    const target = site.photos.find((p) => p.id === id);
    if (!target) {
      res.status(404).json({ error: 'Photograph not found.' });
      return;
    }

    await removeStoredImage(target.imageUrl, target.storagePath);

    try {
      await supabase.from('photos').delete().eq('id', id);
    } catch {
      // Continue with local sync
    }

    const updated = writeLocalSiteData({
      ...site,
      photos: site.photos.filter((p) => p.id !== id),
    });
    res.json({ site: updated });
  });

  // Manage photo categories
  app.post('/api/categories', requireAdmin, async (req, res) => {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    if (!name || name.length > 32) {
      res.status(400).json({ error: 'Category name must be between 1 and 32 characters.' });
      return;
    }
    const site = await readSiteData();
    if (site.categories.some((c) => c.toLowerCase() === name.toLowerCase())) {
      res.status(409).json({ error: 'That category already exists.' });
      return;
    }
    const updated = await writeSiteSettingsToStore({
      ...site,
      categories: [...site.categories, name],
    });
    res.json({ site: updated });
  });

  app.delete('/api/categories/:name', requireAdmin, async (req, res) => {
    const categoryName = decodeURIComponent(String(req.params.name));
    const site = await readSiteData();
    if (site.categories.length <= 1) {
      res.status(400).json({ error: 'At least one photo category must remain.' });
      return;
    }
    const remaining = site.categories.filter((c) => c !== categoryName);
    const fallbackCategory = remaining[0];
    const reassignedPhotos = site.photos.map((p) =>
      p.category === categoryName ? { ...p, category: fallbackCategory } : p
    );

    try {
      await supabase
        .from('photos')
        .update({ category: fallbackCategory })
        .eq('category', categoryName);
    } catch {
      // Continue with local sync
    }

    const updated = await writeSiteSettingsToStore({
      ...site,
      categories: remaining,
      photos: reassignedPhotos,
    });
    res.json({ site: updated });
  });

  // Contact service status (email relay + Supabase contact_messages table)
  app.get('/api/contact/status', async (_req, res) => {
    const emailConfigured = Boolean(
      process.env.RESEND_API_KEY &&
        process.env.RESEND_API_KEY.trim().length > 0 &&
        process.env.CONTACT_TO_EMAIL &&
        process.env.CONTACT_TO_EMAIL.trim().length > 0
    );

    let databaseReady = false;
    try {
      const { error } = await supabase.from('contact_messages').select('id').limit(1);
      databaseReady = !error;
    } catch {
      databaseReady = false;
    }

    res.json({
      configured: emailConfigured,
      provider: emailConfigured ? 'resend' : 'none',
      databaseReady,
    });
  });

  app.post('/api/contact', async (req, res) => {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    const subject = typeof req.body?.subject === 'string' ? req.body.subject.trim() : '';
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';

    if (name.length < 2 || name.length > 100) {
      res.status(400).json({ error: 'Please provide your full name (2–100 characters).' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }
    if (subject.length < 3 || subject.length > 150) {
      res.status(400).json({ error: 'Please provide a subject (3–150 characters).' });
      return;
    }
    if (message.length < 10 || message.length > 3000) {
      res.status(400).json({ error: 'Message must be between 10 and 3000 characters.' });
      return;
    }

    const resendApiKey = process.env.RESEND_API_KEY?.trim();
    const toEmail = process.env.CONTACT_TO_EMAIL?.trim();
    const fromEmail =
      process.env.CONTACT_FROM_EMAIL?.trim() || 'Personal Website <onboarding@resend.dev>';

    let emailDelivered = false;
    if (resendApiKey && toEmail) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [toEmail],
            reply_to: email,
            subject: `[Personal Website] ${subject}`,
            text: `From: ${name} <${email}>\nSubject: ${subject}\n\n${message}`,
          }),
        });

        if (!response.ok) {
          const errPayload = await response.text();
          res.status(502).json({
            error: `Email provider rejected delivery (${response.status}). Check your RESEND_API_KEY and verified sender address.`,
            details: errPayload,
          });
          return;
        }
        emailDelivered = true;
      } catch (error) {
        res.status(502).json({
          error: error instanceof Error ? error.message : 'Unable to reach email delivery service.',
        });
        return;
      }
    }

    const msgRecord = {
      id: `msg-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      name,
      email,
      subject,
      message,
      email_delivered: emailDelivered,
      created_at: new Date().toISOString(),
    };

    let savedToSupabase = false;
    try {
      const { error: insertErr } = await supabase.from('contact_messages').insert(msgRecord);
      savedToSupabase = !insertErr;
    } catch {
      savedToSupabase = false;
    }

    if (!emailDelivered && !savedToSupabase) {
      res.status(503).json({
        setupRequired: true,
        error:
          'Neither Supabase contact_messages table nor Resend email delivery is ready yet. Run supabase/schema.sql in your Supabase SQL Editor or configure RESEND_API_KEY and CONTACT_TO_EMAIL.',
      });
      return;
    }

    const existingMessages = fs.existsSync(MESSAGES_FILE)
      ? (JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8')) as ContactMessageItem[])
      : [];
    existingMessages.unshift({
      id: msgRecord.id,
      name,
      email,
      subject,
      message,
      emailDelivered,
      createdAt: msgRecord.created_at,
    });
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(existingMessages.slice(0, 100), null, 2), 'utf8');

    res.json({
      ok: true,
      emailDelivered,
      savedToSupabase,
      message: emailDelivered
        ? 'Your message was delivered via email and saved to Supabase.'
        : 'Your message was saved to the Supabase database (Admin Inbox). Configure RESEND_API_KEY to also send email alerts.',
    });
  });

  // Frontend serving
  const distDir = path.join(ROOT_DIR, 'dist');
  const isProduction =
    process.env.NODE_ENV === 'production' && fs.existsSync(path.join(distDir, 'index.html'));

  if (isProduction) {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
