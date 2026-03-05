import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  type?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  article?: boolean;
  noindex?: boolean;
}

const SEO = ({
  title,
  description,
  keywords,
  image = 'https://monnasoldboys.co.za/cropped-skool-wapen.png',
  type = 'website',
  author = 'Monnas Old Boys Association',
  publishedTime,
  modifiedTime,
  article = false,
  noindex = false
}: SEOProps) => {
  const location = useLocation();
  const baseUrl = 'https://monnasoldboys.co.za';
  const currentUrl = `${baseUrl}${location.pathname}`;

  const defaultTitle = 'Monnas Old Boys - Reunite, Network & Connect';
  const defaultDescription = 'Official alumni network for Monnas Old Boys. Connect with former classmates, share memories, attend reunions, and celebrate our heritage. Join the Monnas Old Boys community.';
  const defaultKeywords = 'Monnas Old Boys, Monnas Alumni, school reunion, alumni network, South African alumni, class reunion, school memories, alumni stories, Old Boys network';

  const metaTitle = title || defaultTitle;
  const metaDescription = description || defaultDescription;
  const metaKeywords = keywords || defaultKeywords;

  useEffect(() => {
    // Update document title
    document.title = metaTitle;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, property = false) => {
      const attribute = property ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);

      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }

      element.setAttribute('content', content);
    };

    // Update standard meta tags
    updateMetaTag('description', metaDescription);
    updateMetaTag('keywords', metaKeywords);

    // Update Open Graph tags
    updateMetaTag('og:title', metaTitle, true);
    updateMetaTag('og:description', metaDescription, true);
    updateMetaTag('og:url', currentUrl, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:type', type, true);

    // Update Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', metaTitle);
    updateMetaTag('twitter:description', metaDescription);
    updateMetaTag('twitter:url', currentUrl);
    updateMetaTag('twitter:image', image);
    updateMetaTag('twitter:image:alt', metaTitle);

    // Additional Open Graph tags
    updateMetaTag('og:site_name', 'Monnas Old Boys', true);
    updateMetaTag('og:locale', 'en_ZA', true);
    updateMetaTag('og:image:width', '1200', true);
    updateMetaTag('og:image:height', '630', true);
    updateMetaTag('og:image:alt', metaTitle, true);

    // Additional SEO meta tags
    updateMetaTag('author', author);
    updateMetaTag('robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    updateMetaTag('theme-color', '#1a1a1a');
    updateMetaTag('format-detection', 'telephone=no');
    updateMetaTag('revisit-after', '7 days');
    updateMetaTag('rating', 'general');
    updateMetaTag('distribution', 'global');

    // Article-specific Open Graph tags
    if (article) {
      updateMetaTag('og:type', 'article', true);
      if (publishedTime) {
        updateMetaTag('article:published_time', publishedTime, true);
      }
      if (modifiedTime) {
        updateMetaTag('article:modified_time', modifiedTime, true);
      }
      if (author) {
        updateMetaTag('article:author', author, true);
      }
    }

    // Update canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', currentUrl);

    // Add structured data (JSON-LD) for better SEO
    let structuredData = document.querySelector('script[type="application/ld+json"][data-dynamic="true"]');
    if (!structuredData) {
      structuredData = document.createElement('script');
      structuredData.setAttribute('type', 'application/ld+json');
      structuredData.setAttribute('data-dynamic', 'true');
      document.head.appendChild(structuredData);
    }

    const baseSchema: any = {
      '@context': 'https://schema.org',
      '@type': article ? 'Article' : 'WebPage',
      'name': metaTitle,
      'description': metaDescription,
      'url': currentUrl,
      'image': {
        '@type': 'ImageObject',
        'url': image,
        'width': 1200,
        'height': 630
      },
      'publisher': {
        '@type': 'Organization',
        'name': 'Monnas Old Boys Association',
        'logo': {
          '@type': 'ImageObject',
          'url': 'https://monnasoldboys.co.za/cropped-skool-wapen.png',
          'width': 250,
          'height': 250
        },
        'url': baseUrl,
        'sameAs': [
          'https://www.facebook.com/share/1AtzCwMT36/?mibextid=wwXIfr',
          'https://www.instagram.com/potchgimmies'
        ]
      },
      'inLanguage': 'en-ZA',
      'isAccessibleForFree': true
    };

    // Add article-specific fields
    if (article) {
      baseSchema.headline = metaTitle;
      baseSchema.author = {
        '@type': 'Person',
        'name': author
      };
      if (publishedTime) {
        baseSchema.datePublished = publishedTime;
      }
      if (modifiedTime) {
        baseSchema.dateModified = modifiedTime;
      }
      baseSchema.mainEntityOfPage = {
        '@type': 'WebPage',
        '@id': currentUrl
      };
    }

    // Create multiple schemas
    const schemas = [baseSchema];

    // Add Organization schema
    if (location.pathname === '/' || location.pathname === '/home') {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        'name': 'Monnas Old Boys Association',
        'alternateName': 'Monnas Old Boys',
        'description': 'Official alumni association for Monnas Old Boys, connecting graduates worldwide.',
        'url': baseUrl,
        'logo': 'https://monnasoldboys.co.za/cropped-skool-wapen.png',
        'sameAs': [
          'https://www.facebook.com/share/1AtzCwMT36/?mibextid=wwXIfr',
          'https://www.instagram.com/potchgimmies'
        ],
        'contactPoint': {
          '@type': 'ContactPoint',
          'contactType': 'Alumni Relations',
          'email': 'info@monnasoldboys.co.za',
          'availableLanguage': ['English', 'Afrikaans']
        }
      });

      // Add WebSite schema with search
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': 'Monnas Old Boys',
        'url': baseUrl,
        'potentialAction': {
          '@type': 'SearchAction',
          'target': `${baseUrl}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string'
        }
      });
    }

    // Add BreadcrumbList schema
    const pathParts = location.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      const breadcrumbItems = [
        {
          '@type': 'ListItem',
          'position': 1,
          'name': 'Home',
          'item': baseUrl
        }
      ];

      pathParts.forEach((part, index) => {
        breadcrumbItems.push({
          '@type': 'ListItem',
          'position': index + 2,
          'name': part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' '),
          'item': `${baseUrl}/${pathParts.slice(0, index + 1).join('/')}`
        });
      });

      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': breadcrumbItems
      });
    }

    structuredData.textContent = JSON.stringify(schemas.length === 1 ? schemas[0] : schemas);

  }, [metaTitle, metaDescription, metaKeywords, currentUrl, image, type, article, author, publishedTime, modifiedTime, location.pathname, noindex, baseUrl]);

  return null;
};

export default SEO;

// Helper function to generate page-specific SEO
export const pageSEO = {
  home: {
    title: 'Monnas Old Boys - Home',
    description: 'Welcome to the official Monnas Old Boys network. Reconnect with old friends, share your journey, and stay connected with the Monnas family.',
    keywords: 'Monnas Old Boys, Monnas alumni, alumni homepage, school network, Old Boys community'
  },
  stories: {
    title: 'Alumni Stories - Monnas Old Boys',
    description: 'Read inspiring stories from Monnas Old Boys alumni. Share your journey, achievements, and memories.',
    keywords: 'alumni stories, Monnas memories, school stories, graduate achievements, alumni testimonials'
  },
  reunions: {
    title: 'Reunions & Events - Monnas Old Boys',
    description: 'Join upcoming Monnas Old Boys reunions and alumni events. Reconnect with your classmates and celebrate our shared heritage.',
    keywords: 'school reunion, Monnas reunion, alumni events, class gathering, school anniversary, reunion registration'
  },
  memorials: {
    title: 'In Memoriam - Monnas Old Boys',
    description: 'Honoring and remembering members of the Monnas Old Boys family who have passed away. A place to share memories and pay tribute.',
    keywords: 'alumni memorial, in memoriam, Monnas tribute, remembering alumni, memorial page, condolences'
  },
  yearGroups: {
    title: 'Year Groups - Monnas Old Boys',
    description: 'Connect with your graduating class from Monnas. Find classmates and stay in touch with your year group.',
    keywords: 'year groups, graduating class, Monnas classes, class of, alumni directory, find classmates'
  },
  profile: {
    title: 'Your Profile - Monnas Old Boys',
    description: 'Manage your Monnas Old Boys alumni profile. Update your information and connect with fellow alumni.',
    keywords: 'alumni profile, user profile, update profile, alumni directory, Monnas members'
  },
  contact: {
    title: 'Contact Us - Monnas Old Boys',
    description: 'Get in touch with the Monnas Old Boys Association. We\'re here to help with your queries and suggestions.',
    keywords: 'contact alumni, get in touch, alumni support, contact Monnas, alumni association contact'
  },
  events: {
    title: 'Events Calendar - Monnas Old Boys',
    description: 'Stay updated with Monnas Old Boys alumni events, gatherings, and networking opportunities throughout the year.',
    keywords: 'alumni events, Monnas calendar, upcoming events, alumni gatherings, networking events, school events'
  },
  register: {
    title: 'Join Now - Monnas Old Boys Network',
    description: 'Register to join the official Monnas Old Boys network. Connect with alumni worldwide.',
    keywords: 'alumni registration, sign up, join alumni, register Monnas, create account, alumni membership'
  },
  login: {
    title: 'Login - Monnas Old Boys',
    description: 'Login to access your Monnas Old Boys account and connect with your fellow graduates.',
    keywords: 'alumni login, sign in, member login, Monnas login, access account'
  }
};
