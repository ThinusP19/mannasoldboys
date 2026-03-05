# SEO Quick Reference Card

## How to Add SEO to Any Page

### Basic Usage
```tsx
import SEO, { pageSEO } from '../components/SEO';

function MyPage() {
  return (
    <>
      <SEO
        title={pageSEO.home.title}
        description={pageSEO.home.description}
        keywords={pageSEO.home.keywords}
      />
      {/* Your page content */}
    </>
  );
}
```

---

## Pre-configured Page SEO

| Page | Usage |
|------|-------|
| Home | `pageSEO.home` |
| Stories | `pageSEO.stories` |
| Reunions | `pageSEO.reunions` |
| Memorials | `pageSEO.memorials` |
| Year Groups | `pageSEO.yearGroups` |
| Profile | `pageSEO.profile` |
| Contact | `pageSEO.contact` |
| Events | `pageSEO.events` |
| Register | `pageSEO.register` |
| Login | `pageSEO.login` |

---

## Custom Page SEO

```tsx
<SEO
  title="Your Page Title - Alumni Connect Hub"
  description="Compelling description under 160 characters that includes your main keyword"
  keywords="keyword1, keyword2, keyword3, keyword4"
  image="https://alumni.potchgim.co.za/your-image.jpg"
/>
```

---

## Article/Story SEO

```tsx
<SEO
  title="Alumni Success Story: John Doe"
  description="Read how John Doe went from Potch Gim to becoming a CEO..."
  keywords="alumni success, achievement, CEO, John Doe"
  type="article"
  article={true}
  author="Jane Smith"
  publishedTime={new Date().toISOString()}
  image="https://alumni.potchgim.co.za/john-doe.jpg"
/>
```

---

## SEO Best Practices Checklist

### Title Tags
- ✓ Include primary keyword
- ✓ 50-60 characters max
- ✓ Unique for each page
- ✓ Front-load important words
- ✗ Don't stuff keywords
- ✗ Don't use all caps

**Examples:**
```
✓ "Potch Gim Alumni Stories - Share Your Journey | Alumni Connect"
✗ "Page" (too short)
✗ "BEST ALUMNI STORIES POTCH GIM POTCHEFSTROOM ALUMNI BEST" (spam)
```

### Meta Descriptions
- ✓ 150-160 characters
- ✓ Include call-to-action
- ✓ Include primary keyword
- ✓ Make it compelling
- ✗ Don't duplicate across pages

**Examples:**
```
✓ "Join the Potch Gim Class of 2010 reunion. Reconnect with old friends, share memories, and celebrate 15 years. Register today!"
✗ "This is a page about reunions."
```

### Keywords
- ✓ 5-10 relevant keywords
- ✓ Include long-tail variations
- ✓ Mix broad and specific terms
- ✗ Don't repeat the same keyword
- ✗ Don't use unrelated keywords

**Examples:**
```
✓ "Potch Gim alumni, Potchefstroom reunion, class of 2010, school memories, alumni network"
✗ "alumni, school, reunion, alumni, potch, alumni, school, reunion" (repetitive)
```

### Images
- ✓ 1200x630px for social sharing
- ✓ Use descriptive file names
- ✓ Add alt text
- ✓ Compress before upload (< 200KB)
- ✓ Use WebP format when possible

---

## Social Media Preview

Test your page's social preview:
- **Facebook/LinkedIn:** https://developers.facebook.com/tools/debug/
- **Twitter:** https://cards-dev.twitter.com/validator

---

## Common SEO Props

```tsx
interface SEOProps {
  title?: string;              // Page title
  description?: string;        // Meta description
  keywords?: string;           // Comma-separated keywords
  image?: string;              // Full URL to OG image
  type?: string;               // 'website' or 'article'
  author?: string;             // Content author
  publishedTime?: string;      // ISO date string
  modifiedTime?: string;       // ISO date string
  article?: boolean;           // Enable article schema
  noindex?: boolean;           // Prevent indexing (for admin pages)
}
```

---

## Image Best Practices

### Social Sharing (Open Graph)
```
Dimensions: 1200 x 630 pixels
Aspect Ratio: 1.91:1
Format: JPG or PNG
Max Size: 8MB (aim for < 500KB)
```

### General Images
```
Homepage Hero: 1920 x 1080 px
Profile Photos: 400 x 400 px (square)
Event Banners: 1200 x 400 px
Thumbnails: 300 x 200 px
```

---

## Quick SEO Wins

1. **Immediate:**
   - Add SEO component to all pages ✓
   - Submit sitemap to Google
   - Set up Google Analytics

2. **This Week:**
   - Write compelling meta descriptions
   - Optimize 5 most important pages
   - Add alt text to all images

3. **This Month:**
   - Create 5 blog posts
   - Build 10 backlinks
   - Improve page speed

---

## Testing Your SEO

### Before Publishing:
```bash
1. Check title length (50-60 chars)
2. Check description length (150-160 chars)
3. Test social preview (Facebook debugger)
4. Validate structured data (Google Rich Results)
5. Check mobile preview
6. Test page load speed (< 3 seconds)
```

### Tools:
- Lighthouse (in Chrome DevTools): F12 → Lighthouse → Generate Report
- Google Search Console: Monitor after publishing
- PageSpeed Insights: https://pagespeed.web.dev/

---

## Example Implementation

```tsx
// src/pages/Stories.tsx
import React from 'react';
import SEO, { pageSEO } from '../components/SEO';

function Stories() {
  return (
    <div>
      {/* SEO Component - Always first */}
      <SEO
        title={pageSEO.stories.title}
        description={pageSEO.stories.description}
        keywords={pageSEO.stories.keywords}
        type="website"
      />

      {/* Page Content */}
      <h1>Alumni Stories</h1>
      <p>Read inspiring stories from our community...</p>
      {/* ... rest of content */}
    </div>
  );
}

export default Stories;
```

```tsx
// src/pages/StoryDetail.tsx
import React from 'react';
import SEO from '../components/SEO';

function StoryDetail({ story }) {
  return (
    <div>
      {/* Dynamic SEO for each story */}
      <SEO
        title={`${story.title} - Alumni Stories`}
        description={story.excerpt}
        keywords={`${story.author}, alumni story, ${story.yearGroup}, Potch Gim`}
        type="article"
        article={true}
        author={story.author}
        publishedTime={story.publishedDate}
        modifiedTime={story.modifiedDate}
        image={story.featuredImage}
      />

      <article>
        <h1>{story.title}</h1>
        <p>{story.content}</p>
      </article>
    </div>
  );
}

export default StoryDetail;
```

---

## Keyword Research Cheat Sheet

### Primary Keywords (High Priority)
```
- Potchefstroom Gymnasium alumni
- Potch Gim alumni network
- Potchefstroom school reunion
- Potch Gim events
- Potchefstroom Gymnasium history
```

### Long-tail Keywords (Easy Wins)
```
- how to find Potch Gim classmates
- Potchefstroom Gymnasium reunion 2025
- join Potch Gim alumni association
- Potchefstroom school memories
- Potch Gim year groups
```

### Location-based Keywords
```
- Potchefstroom alumni network
- North West alumni South Africa
- Potchefstroom education
```

---

## Emergency SEO Checklist

If your page isn't ranking:

- [ ] Is the page indexed? (Google: `site:alumni.potchgim.co.za/page`)
- [ ] Does it have a unique title and description?
- [ ] Is it in the sitemap?
- [ ] Does it have quality content (300+ words)?
- [ ] Are there internal links to it?
- [ ] Is the page speed acceptable (< 3s)?
- [ ] Is it mobile-friendly?
- [ ] Does it have any errors in Search Console?

---

## Quick Commands

```bash
# Build and check SEO
npm run build
npm run preview

# Test in Lighthouse
# Open Chrome DevTools (F12) → Lighthouse → Generate Report

# Check what Google sees
# Google Search: site:alumni.potchgim.co.za
```

---

## Need More Help?

- Full Guide: See `SEO_GUIDE.md`
- Component: `src/components/SEO.tsx`
- Page Configs: `src/components/SEO.tsx` (line 128)
- Sitemap: `public/sitemap.xml`
- Robots: `public/robots.txt`

---

**Pro Tip:** The best SEO is great content. Focus on creating valuable, unique content that your alumni will want to share!
