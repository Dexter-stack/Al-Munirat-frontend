import type { Course } from "./academic";

/**
 * Matches Backend-Almunirah/API_DOCUMENTATION.md §11 exactly (the public-
 * content batch, live). Backed by a flat key-value settings store — every
 * key from `config('settings.defaults')` is always present, `null` when
 * unset. No admin management endpoint exists yet (seed-only values).
 */
export interface PublicSettings {
  site_name: string | null;
  site_name_arabic: string | null;
  tagline: string | null;
  tagline_arabic: string | null;
  description: string | null;
  description_arabic: string | null;
  logo_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_address: string | null;
  contact_address_arabic: string | null;
  social_facebook: string | null;
  social_twitter: string | null;
  social_instagram: string | null;
  social_youtube: string | null;
  social_whatsapp: string | null;
  established_year: string | null;
}

/**
 * `/public/home` deliberately omits featured_events/hajj_umrah_teaser —
 * those modules don't exist on the backend yet. Don't stub them here as
 * empty arrays; that would claim a feature exists with no data, which
 * isn't true. Extend this type when the backend's shape grows.
 */
export interface PublicHomePayload {
  settings: PublicSettings;
  featured_courses: Course[];
}

export interface ContactInfo {
  email: string | null;
  phone: string | null;
  address: string | null;
  arabic_address: string | null;
  social: {
    facebook: string | null;
    twitter: string | null;
    instagram: string | null;
    youtube: string | null;
    whatsapp: string | null;
  };
}

export interface EventItem {
  id: number;
  slug: string;
  title: string;
  arabic_title?: string;
  content: string;
  arabic_content?: string;
  excerpt?: string;
  category: string;
  featured_image_url?: string;
  is_published: boolean;
  event_date?: string | null;
  published_at: string;
}

export interface HajjUmrahPackage {
  id: number;
  slug: string;
  type: "hajj" | "umrah";
  title: string;
  arabic_title?: string;
  description: string;
  arabic_description?: string;
  price?: number;
  currency?: string;
  duration_days?: number;
  featured_image_url?: string;
  is_published: boolean;
}

export interface HajjUmrahFaq {
  id: number;
  question: string;
  arabic_question?: string;
  answer: string;
  arabic_answer?: string;
}

export interface HajjUmrahAnnouncement {
  id: number;
  title: string;
  arabic_title?: string;
  body: string;
  arabic_body?: string;
  published_at: string;
}
