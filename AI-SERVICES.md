# AI Services & Agent Orchestration

## Overview

This project uses AI agents for nearly everything: development, content generation, marketing creative, copy, legal docs, and eventually product features. This document maps every AI touchpoint and how to invoke it.

---

## Development Agent (Claude Code)

**Role:** Primary builder. Writes all code, configures infrastructure, deploys.

**Model:** Claude Opus 4.6 (or Sonnet 4.5 for faster iteration)

**Instructions:** See `CLAUDE.md` in project root.

**Capabilities:**
- Write HTML/CSS/JS
- Configure Supabase schema via SQL
- Create PWA manifest, service worker
- Git operations (commit, push, branch)
- File system operations
- Run local dev server
- Debug and fix issues

---

## Content Generation

### Landing Page Copy

**Service:** Claude API (or Claude Code inline)
**Prompt template:**
```
System: You are a conversion copywriter for talent.stlucia.studio, a mobile-first
HR platform in Saint Lucia. Write compelling, warm, professional copy that
motivates Caribbean professionals to create their profiles. Tone: empowering,
modern, culturally aware. No corporate jargon. Short punchy sentences.

User: Write the landing page copy. Sections needed:
1. Hero headline + subheadline + CTA
2. "How it works" (3 steps)
3. Features (4 benefits with icons)
4. Social proof / stats section
5. Final CTA section
6. Footer tagline
```

### Social Media Posts (batch)

**Service:** Claude API
**Generate:** 30 posts at once, scheduled for 30 days
```
System: You are a social media manager for a Saint Lucia talent platform.
Create engaging, concise posts for Facebook/Instagram/TikTok. Each post must
drive signups to talent.stlucia.studio. Mix content types: tips, facts,
motivation, platform updates, testimonials. Caribbean English tone.

User: Generate 30 social media posts. For each, provide:
- Platform(s): FB / IG / TikTok / All
- Caption (max 200 characters)
- Extended text (max 500 characters, for FB)
- Hashtags (5-8)
- Suggested visual description (for image generation)
- Content type: fact / tip / motivation / update / testimonial
```

### Email Sequences

**Service:** Claude API
**Generate:** Welcome series, nudge sequences
```
System: You are an email copywriter for talent.stlucia.studio. Write warm,
encouraging emails that feel personal, not corporate. Each email should have
one clear CTA. Subject lines must be compelling (under 50 chars). Keep body
under 150 words.

User: Write a 5-email welcome sequence:
E1: Welcome (send immediately after signup)
E2: Complete your profile (Day 2)
E3: Record your video resume (Day 4)
E4: Share with friends (Day 7)
E5: Employers are coming (Day 14)
```

### Legal Documents

**Service:** Claude API
**Generate:** Privacy policy, terms of service
```
System: You are a legal document writer. Create clear, readable legal
documents for a Caribbean HR tech platform (talent.stlucia.studio) that
collects personal data, video recordings, and resumes. Must comply with
international data protection standards. Jurisdiction: Saint Lucia (common
law system). Include GDPR-equivalent protections even though Saint Lucia
isn't EU — this builds trust.

User: Write a Privacy Policy covering: data collection (personal info,
video, resumes), data use, data sharing, data storage, user rights (access,
delete, export), cookies, third-party services (Supabase, analytics),
contact information, policy updates. Keep it readable — use plain English
headings and short paragraphs.
```

### Blog Content / SEO

**Service:** Claude API
**Generate:** Weekly blog posts for SEO and social sharing
```
System: You are a content writer for a Saint Lucia talent platform. Write
informative, SEO-optimized articles about the Saint Lucia job market, career
development, and professional growth in the Caribbean. Include specific data
points, practical advice, and always end with a CTA to create a profile.

User: Write an 800-word article: "Top 10 In-Demand Jobs in Saint Lucia 2026"
Include: job title, average salary range (EC$), growth outlook, required
skills, and why it matters. Use H2 headings for each job. Add an intro and
conclusion with CTA.
```

---

## Image Generation

### Ad Creatives

**Service:** DALL-E 3, Midjourney, or Flux (via API)

**Prompt templates:**

```
# Hero image for landing page
Professional Caribbean woman smiling confidently while looking at her
smartphone, tropical office with palm trees visible through large windows,
warm golden hour lighting, clean modern interior, photorealistic,
high quality --ar 16:9

# Facebook ad - local talent
Young Saint Lucian professional man in business casual, standing in front
of Castries harbour, holding smartphone showing a talent profile app,
confident expression, vibrant Caribbean colors, photorealistic --ar 4:5

# Instagram ad - video resume concept
Split screen: left side shows traditional paper resume (boring, gray),
right side shows person speaking into smartphone camera (vibrant, colorful,
confident), modern graphic design style --ar 1:1

# TikTok cover - career tips series
Bold text "CAREER TIPS 🇱🇨" over blurred tropical background, modern
graphic design, teal and gold color scheme, clean typography --ar 9:16

# Relocation audience
Digital nomad working on laptop at a Caribbean beachside cafe, Saint Lucia
Pitons visible in background, tropical plants, relaxed professional
setting, golden hour, photorealistic --ar 4:5
```

### App Screenshots (for ads)

**Service:** Claude Code (generate HTML mockups) → Screenshot tool
- Create mockup HTML pages showing the app in use
- Screenshot at mobile dimensions (390x844)
- Use for ad creatives and app store-style previews

### Icons & Illustrations

**Service:** DALL-E 3 or SVG generation via Claude
- Feature icons (video camera, profile, skills, search)
- Sector icons (tourism, tech, finance, healthcare)
- Step illustrations (1-2-3 signup flow)

---

## Video Generation

### TikTok / Reels Content

**Option A:** Screen recordings of the app (Claude Code generates the demo)
**Option B:** AI-generated video (Runway, Pika, Kling)
**Option C:** AI avatar presenting (HeyGen, Synthesia)

**For MVP, prioritize Option A** — screen recordings are fastest and most authentic.

**Process:**
1. Claude Code builds a demo profile with realistic data
2. Record screen (Chrome DevTools device mode, 390x844)
3. Add text overlays and music in CapCut or similar
4. Export at 1080x1920, 15-30 seconds

### Video Resume Demo

Create a demo video resume to show users what a good one looks like:
- Use AI avatar (HeyGen) or ask for a real volunteer
- 60 seconds, answering "Tell us about yourself"
- Professional but warm delivery
- Show on landing page and in the recording screen

---

## AI-Powered Product Features (Phase 5)

### Resume Builder AI

**Service:** Claude API (via Supabase Edge Function)
```
System: You are a resume writing assistant. Given bullet points about
someone's experience, generate a polished professional summary (150-200
words) suitable for a Caribbean job market. Tone: confident, professional,
specific. Highlight transferable skills and quantified achievements.

User: Bullet points:
- Worked at Sandals Regency as front desk manager 5 years
- Managed team of 12
- Improved guest satisfaction score from 82 to 94
- Fluent in English and French
- Computer skills: Microsoft Office, Opera PMS
```

### Skill Extraction from PDF

**Service:** Claude API (via Edge Function)
```
System: Extract skills, job titles, company names, education, and years
of experience from this resume text. Return as structured JSON matching
our profile schema: { skills: [], experiences: [], education: [],
headline: "", summary: "" }

User: [Extracted text from PDF]
```

### AI Matching

**Service:** Claude API or OpenAI embeddings
- Embed all talent profiles (skills + summary + video transcript)
- Embed job descriptions
- Cosine similarity matching
- Return top 20 matches with relevance score

---

## Cost Estimates (AI Services)

| Service | Usage (Month 1) | Est. Cost |
|---------|-----------------|-----------|
| Claude API (content gen) | ~50 requests | $5-10 |
| DALL-E 3 (ad images) | ~20 images | $5-10 |
| Claude API (resume builder, Phase 5) | ~500 requests | $15-25 |
| HeyGen (demo video, optional) | 1 video | $0-25 |
| Plausible Analytics | 1 site | $0 (self-host) or $9/mo |
| Supabase | Free tier | $0 |
| GitHub Pages | Free | $0 |
| **Total** | | **$10-80/mo** |

---

## Agent Coordination

If multiple agents are working on this project:

| Agent | Role | Context Needed |
|-------|------|----------------|
| **Main (Claude Code)** | Full-stack development, deployment | CLAUDE.md, full codebase |
| **Content Agent** | Copy, blog posts, social media | MARKETING.md, brand voice |
| **Design Agent** | Image generation, mockups | Design system from CLAUDE.md |
| **Marketing Agent** | Ad management, analytics | MARKETING.md, platform access |

**Handoff protocol:**
1. Main agent writes code and deploys
2. Content agent generates all text content → saves as JSON or .md files
3. Main agent integrates content into pages
4. Design agent generates images → saves to assets/images/
5. Main agent integrates images, optimizes, deploys
6. Marketing agent manages campaigns externally (Facebook Ads Manager, etc.)
