# Talent by St. Lucia Studio — Setup Guide

Follow these steps in order to get the platform live at `talent.stlucia.studio`.

---

## Step 1: Create Supabase Project

1. Go to **https://supabase.com** and sign up / log in
2. Click **New Project**
3. Settings:
   - **Organization:** Create one or use existing
   - **Project name:** `talent-stlucia`
   - **Database password:** Generate a strong one and save it
   - **Region:** `US East (North Virginia)` — closest to Caribbean
4. Wait for the project to provision (~2 minutes)
5. Once ready, go to **Settings → API** and copy:
   - **Project URL** — looks like `https://abcdefgh.supabase.co`
   - **anon (public) key** — starts with `eyJhbG...`

### 1b: Run the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Open the file `setup/supabase-schema.sql` from this project
4. Copy the ENTIRE contents and paste into the SQL Editor
5. Click **Run** — this creates all tables, indexes, RLS policies, storage buckets, and seed data
6. You should see "Success" with no errors
7. Verify by going to **Table Editor** — you should see: `profiles`, `experiences`, `education`, `video_questions`, `events`, `waitlist`

### 1c: Create Storage Buckets

The SQL migration creates storage buckets automatically, but verify they exist:

1. Go to **Storage** in the sidebar
2. You should see 3 buckets: `photos`, `videos`, `resumes`
3. If they don't exist, create them manually:
   - Click **New Bucket**
   - Name: `photos` / Public: **ON**
   - Name: `videos` / Public: **ON**
   - Name: `resumes` / Public: **ON**

### 1d: Configure Authentication

1. Go to **Authentication → Providers**
2. **Email** should be enabled by default. Ensure:
   - Enable Email provider: **ON**
   - Confirm email: **OFF** (for faster signups during MVP)
   - Enable sign up: **ON**
3. Go to **Authentication → URL Configuration**
4. Set:
   - **Site URL:** `https://talent.stlucia.studio`
   - **Redirect URLs:** Add these:
     - `https://talent.stlucia.studio/dashboard.html`
     - `https://talent.stlucia.studio/signup.html`
     - `http://localhost:*` (for local testing)

---

## Step 2: Set Up Google OAuth

This lets users sign up / log in with their Google account.

### 2a: Create Google Cloud Project

1. Go to **https://console.cloud.google.com**
2. Sign in with the Google account you want to use as admin
3. Click the project dropdown (top bar) → **New Project**
   - Name: `Talent St Lucia`
   - Click **Create**
4. Select the new project from the dropdown

### 2b: Configure OAuth Consent Screen

1. Go to **APIs & Services → OAuth consent screen**
2. Select **External** → Click **Create**
3. Fill in:
   - **App name:** `Talent by St. Lucia Studio`
   - **User support email:** your email
   - **App logo:** optional (upload later)
   - **App domain:** `https://talent.stlucia.studio`
   - **Authorized domains:** Add `stlucia.studio` and `supabase.co`
   - **Developer contact:** your email
4. Click **Save and Continue**
5. **Scopes:** Click **Add or Remove Scopes**, select:
   - `openid`
   - `email`
   - `profile`
6. Click **Save and Continue**
7. **Test users:** Add your own email for testing, then **Save and Continue**
8. **Summary:** Review and click **Back to Dashboard**

### 2c: Create OAuth Credentials

1. Go to **APIs & Services → Credentials**
2. Click **+ Create Credentials → OAuth client ID**
3. Settings:
   - **Application type:** Web application
   - **Name:** `Talent StLucia Web`
   - **Authorized JavaScript origins:** Add:
     - `https://talent.stlucia.studio`
     - `http://localhost:8000` (for local dev)
   - **Authorized redirect URIs:** Add:
     - `https://<YOUR_SUPABASE_PROJECT>.supabase.co/auth/v1/callback`
     (Replace `<YOUR_SUPABASE_PROJECT>` with your actual Supabase project ref, e.g., `https://abcdefgh.supabase.co/auth/v1/callback`)
4. Click **Create**
5. Copy the **Client ID** and **Client Secret**

### 2d: Add Google Provider to Supabase

1. Back in Supabase dashboard, go to **Authentication → Providers**
2. Find **Google** and expand it
3. Toggle **Enable Sign in with Google** to ON
4. Paste:
   - **Client ID:** from Google Cloud
   - **Client Secret:** from Google Cloud
5. Click **Save**

### 2e: Publish the OAuth App (when ready for public)

Initially, Google OAuth is in "testing" mode (only test users can log in). When ready for public:

1. Go to **Google Cloud → OAuth consent screen**
2. Click **Publish App**
3. You may need to verify the app if requesting sensitive scopes (for basic login, usually instant approval)

---

## Step 3: Update App Credentials

1. Open `assets/js/supabase.js` in your code editor
2. Replace the placeholder values at the top:

```javascript
var SUPABASE_URL = 'https://YOUR_ACTUAL_PROJECT.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbG...YOUR_ACTUAL_ANON_KEY';
```

3. Save the file

---

## Step 4: Set Up Domain (Cloudflare DNS)

Your domain `stlucia.studio` is likely managed by Cloudflare. To point `talent.stlucia.studio` to GitHub Pages:

### 4a: GitHub Pages Setup

1. Go to your GitHub repo: **https://github.com/ibak-app/hr-stlucia-studio**
2. Go to **Settings → Pages**
3. Under **Source**, select:
   - **Branch:** `master`
   - **Folder:** `/ (root)`
4. Click **Save**
5. Under **Custom domain**, enter: `talent.stlucia.studio`
6. Click **Save** (it will say DNS check pending)
7. Check **Enforce HTTPS** once DNS is configured

### 4b: Cloudflare DNS

1. Log in to **https://dash.cloudflare.com**
2. Select the `stlucia.studio` domain
3. Go to **DNS → Records**
4. Add a CNAME record:
   - **Type:** CNAME
   - **Name:** `talent`
   - **Target:** `ibak-app.github.io`
   - **Proxy status:** DNS only (gray cloud) — **IMPORTANT:** Turn proxy OFF for GitHub Pages
   - **TTL:** Auto
5. Click **Save**
6. Wait 5-15 minutes for DNS propagation
7. Go back to GitHub Pages settings — the DNS check should now pass
8. Enable **Enforce HTTPS**

### 4c: Verify

1. Visit `https://talent.stlucia.studio` in your browser
2. You should see the landing page with HTTPS (padlock icon)
3. The CNAME file in the repo ensures GitHub Pages uses the custom domain

---

## Step 5: Set Up Plausible Analytics

1. Go to **https://plausible.io** and sign up (14-day free trial, then $9/month)
   - Alternative: use the self-hosted version or switch to another privacy-friendly analytics
2. Add a new site: `talent.stlucia.studio`
3. The tracking script is already added to all pages:
   ```html
   <script defer data-domain="talent.stlucia.studio" src="https://plausible.io/js/script.js"></script>
   ```
4. No further configuration needed — Plausible auto-detects page views

---

## Step 6: Set Up Facebook Pixel (Optional)

1. Go to **https://business.facebook.com** → Events Manager
2. Click **Connect Data Sources → Web → Facebook Pixel**
3. Name it: `Talent StLucia Pixel`
4. Copy the **Pixel ID** (a number like `123456789012345`)
5. In ALL HTML files, find `YOUR_PIXEL_ID` and replace with your actual Pixel ID:
   ```javascript
   fbq('init','123456789012345');
   ```
6. Files to update (search and replace `YOUR_PIXEL_ID` in all):
   - index.html
   - signup.html
   - login.html
   - dashboard.html
   - profile.html
   - video.html
   - success.html
   - employers.html
   - privacy.html
   - terms.html

---

## Step 7: Create Social Media Accounts

### Facebook Page
1. Go to **https://facebook.com/pages/create**
2. Page name: `Talent by St. Lucia Studio`
3. Category: `Employment Agency` or `Recruiter`
4. Add description, profile photo, cover image
5. URL: try to get `facebook.com/TalentStLucia`

### Instagram
1. Create a new Instagram account: `@talent.stlucia`
2. Set up as Business account
3. Link to the Facebook Page

### TikTok
1. Create: `@talent.stlucia`
2. Bio: "Saint Lucia's talent platform. Create your free profile. 🇱🇨"
3. Link: `talent.stlucia.studio`

---

## Step 8: Test Everything

### Local Testing
1. Start a local server:
   ```bash
   # Using Python
   python -m http.server 8000

   # Or using Node.js
   npx serve .
   ```
2. Open `http://localhost:8000`
3. Test the full flow:
   - [ ] Landing page loads correctly
   - [ ] Click "Get Started" → goes to signup
   - [ ] Sign up with email → account created
   - [ ] Sign up with Google → redirects and creates profile
   - [ ] Profile page loads with user data
   - [ ] Can edit and save profile
   - [ ] Dashboard shows completeness score
   - [ ] Video recorder opens camera (HTTPS required for production)
   - [ ] Employers page waitlist form works
   - [ ] Privacy & Terms pages render correctly

### Mobile Testing
1. Open Chrome DevTools → Toggle Device Toolbar (Ctrl+Shift+M)
2. Test at 390px width (iPhone 14)
3. Test at 360px width (smaller Android)
4. Test all forms, buttons, and scrolling

### Production Testing
1. After deploying to `talent.stlucia.studio`:
   - [ ] HTTPS works (padlock icon)
   - [ ] All pages load
   - [ ] Signup creates account in Supabase
   - [ ] Google OAuth works end-to-end
   - [ ] Video recording works on mobile (requires HTTPS)
   - [ ] Share buttons work on success page
   - [ ] Analytics tracking appears in Plausible

---

## Quick Reference

| Service | URL | Purpose |
|---------|-----|---------|
| Supabase Dashboard | https://supabase.com/dashboard | Database, Auth, Storage |
| Google Cloud Console | https://console.cloud.google.com | OAuth credentials |
| GitHub Repo | https://github.com/ibak-app/hr-stlucia-studio | Code, deployment |
| Cloudflare DNS | https://dash.cloudflare.com | Domain management |
| Plausible Analytics | https://plausible.io | Traffic analytics |
| Facebook Business | https://business.facebook.com | Pixel, Ads |

---

## Troubleshooting

### "Supabase not initialized" errors
- Check that `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `supabase.js` are correct
- Verify the Supabase CDN script loads (check browser console)

### Google OAuth not working
- Verify redirect URI matches exactly: `https://<project>.supabase.co/auth/v1/callback`
- Check that the Google provider is enabled in Supabase Auth settings
- Ensure the OAuth consent screen is published (not in testing mode) for public users

### DNS not resolving
- Ensure Cloudflare proxy is OFF (gray cloud) for the `talent` CNAME record
- Wait up to 30 minutes for propagation
- Verify with: `nslookup talent.stlucia.studio`

### Video recording not working
- Camera access requires HTTPS (won't work on HTTP except localhost)
- Check browser permissions for camera and microphone
- Safari may require MP4 format — the code handles this fallback

### Storage upload errors
- Verify storage buckets exist: `photos`, `videos`, `resumes`
- Check RLS policies are applied (run the schema SQL)
- File size limits: photos 5MB, videos 100MB, resumes 10MB
