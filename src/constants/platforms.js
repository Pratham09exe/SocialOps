/**
 * Standardized SocialOps social media platforms, categories, formats, and industries.
 * Exactly 7 platforms are supported:
 * 1. Instagram (instagram)
 * 2. Facebook (facebook)
 * 3. YouTube (youtube)
 * 4. LinkedIn (linkedin)
 * 5. WhatsApp Business (whatsapp_business)
 * 6. X (formerly Twitter) (x)
 * 7. Pinterest (pinterest)
 */

export const SOCIAL_PLATFORMS = [
  {
    id: 'instagram',
    name: 'Instagram',
    shortName: 'Instagram',
    badgeClass: 'badge-instagram',
    color: '#E1306C',
    formats: ['Image Post', 'Reel', 'Carousel', 'Story']
  },
  {
    id: 'facebook',
    name: 'Facebook',
    shortName: 'Facebook',
    badgeClass: 'badge-facebook',
    color: '#1877F2',
    formats: ['Image Post', 'Text Post', 'Reel', 'Video', 'Story', 'Photo Album']
  },
  {
    id: 'youtube',
    name: 'YouTube',
    shortName: 'YouTube',
    badgeClass: 'badge-youtube',
    color: '#FF0000',
    formats: ['Long-form Video', 'Shorts', 'Tutorial', 'Interview', 'Community Post']
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    shortName: 'LinkedIn',
    badgeClass: 'badge-linkedin',
    color: '#0A66C2',
    formats: ['Text Post', 'Image Post', 'Document Carousel', 'Article', 'Infographic', 'Video']
  },
  {
    id: 'whatsapp_business',
    name: 'WhatsApp Business',
    shortName: 'WhatsApp',
    badgeClass: 'badge-whatsapp_business',
    color: '#25D366',
    formats: ['Status Image', 'Status Video', 'Product Catalogue Update', 'Promotional Message', 'Business Announcement']
  },
  {
    id: 'x',
    name: 'X (formerly Twitter)',
    shortName: 'X',
    badgeClass: 'badge-x',
    color: '#0F1419',
    formats: ['Text Post', 'Thread', 'Image Post', 'Video', 'Infographic']
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    shortName: 'Pinterest',
    badgeClass: 'badge-pinterest',
    color: '#E60023',
    formats: ['Standard Pin', 'Video Pin', 'Product Pin', 'Infographic', 'Multi-page Visual Pin']
  }
];

export const SUPPORTED_PLATFORM_IDS = SOCIAL_PLATFORMS.map(p => p.id);

export const PLATFORM_NAMES_MAP = SOCIAL_PLATFORMS.reduce((acc, p) => {
  acc[p.id] = p.name;
  return acc;
}, {});

// The 10 standardized Content Categories
export const CONTENT_CATEGORIES = [
  'Educational',
  'Promotional',
  'Informational',
  'Entertainment',
  'Branding',
  'Engagement',
  'Product Showcase',
  'Testimonials',
  'Behind the Scenes',
  'Thought Leadership'
];

// The 13 standardized Industry options
export const INDUSTRY_OPTIONS = [
  'IT / Software / Technology',
  'Education',
  'Healthcare',
  'Restaurant / Food',
  'Fashion / Clothing',
  'Real Estate',
  'E-commerce',
  'Manufacturing',
  'Influencer / Content Creator',
  'Entrepreneur / Startup',
  'Professional Services',
  'Retail / Local Business',
  'Other'
];

// Content Request Call to Action (CTA) options
export const CTA_OPTIONS = [
  'Visit Website',
  'Contact Business',
  'Buy Product',
  'Book Appointment',
  'Follow Social Account',
  'Send Message',
  'Register for Event',
  'Other'
];

// Content Request Statuses
export const REQUEST_STATUSES = [
  'Submitted',
  'Under Review',
  'Assigned',
  'In Progress',
  'Submitted for Approval',
  'Approved',
  'Changes Requested',
  'Completed'
];

export function normalizePlatform(raw) {
  if (!raw || typeof raw !== 'string') return 'instagram';
  const val = raw.trim().toLowerCase();

  if (val.includes('insta')) return 'instagram';
  if (val.includes('facebook') || val === 'fb') return 'facebook';
  if (val.includes('youtube') || val === 'yt') return 'youtube';
  if (val.includes('linkedin')) return 'linkedin';
  if (val.includes('whatsapp')) return 'whatsapp_business';
  if (val === 'x' || val.includes('twitter') || val === 'twitter/x') return 'x';
  if (val.includes('pin')) return 'pinterest';

  return 'instagram';
}

export function getPlatformMeta(platformIdOrName) {
  const norm = normalizePlatform(platformIdOrName);
  return SOCIAL_PLATFORMS.find(p => p.id === norm) || SOCIAL_PLATFORMS[0];
}
