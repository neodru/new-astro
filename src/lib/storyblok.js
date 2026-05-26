import { StoryblokClient } from "@storyblok/js";

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export const storyblokClient = new StoryblokClient({
  accessToken: import.meta.env.STORYBLOK_API_TOKEN,
  cache: {
    type: "memory",
  },
});

// ---------------------------------------------------------------------------
// JSDoc type definitions
// These mirror the Storyblok component schemas in src/storyblok/schemas/.
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} SbAsset
 * @property {string} filename
 * @property {string} alt
 * @property {string} [title]
 */

/**
 * @typedef {Object} ServiceStory
 * @property {string}   _uid
 * @property {string}   component        - "service"
 * @property {string}   name             - Display name
 * @property {string}   slug             - URL slug
 * @property {string}   description      - Short description (card / meta)
 * @property {any}      long_description - Storyblok richtext blob
 * @property {string}   icon_path        - SVG <path d="…"> string
 * @property {string}   cta_text         - Button label
 * @property {string}   cta_href         - Internal link (e.g. /boarding)
 * @property {SbAsset}  featured_image
 * @property {number}   order            - Sort order (lower = first)
 */

/**
 * @typedef {Object} TrainerStory
 * @property {string}   _uid
 * @property {string}   component        - "trainer"
 * @property {string}   full_name
 * @property {string}   title            - e.g. "Head Trainer"
 * @property {string}   bio              - Short bio (card)
 * @property {any}      long_bio         - Storyblok richtext blob
 * @property {string[]} disciplines      - Array of discipline strings
 * @property {SbAsset}  headshot
 * @property {number}   years_experience
 * @property {string}   certifications   - Comma-separated or plain text
 */

/**
 * @typedef {Object} NewsStory
 * @property {string}   _uid
 * @property {string}   component        - "news"
 * @property {string}   title
 * @property {string}   excerpt          - Short summary for listing / meta
 * @property {any}      body             - Storyblok richtext blob
 * @property {SbAsset}  cover_image
 * @property {string}   published_date   - ISO 8601 string
 * @property {string}   author           - Author display name
 * @property {string}   category         - e.g. "Events", "Training", "Community"
 */

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

/**
 * Fetch a single story by its full slug.
 * Returns null when the token is missing or the story is not found.
 *
 * @param {string} slug
 * @returns {Promise<any|null>}
 */
export async function getStory(slug = "home") {
  if (!import.meta.env.STORYBLOK_API_TOKEN) return null;
  try {
    const response = await storyblokClient.get(`cdn/stories/${slug}`);
    return response.data.story ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch multiple stories filtered by Storyblok component type.
 * Returns an empty array when the token is missing or the request fails.
 *
 * @param {string} componentType - The Storyblok component name (e.g. "service")
 * @param {{ perPage?: number; sortBy?: string; startsWith?: string }} [opts]
 * @returns {Promise<any[]>}
 */
async function getStoriesByType(componentType, opts = {}) {
  if (!import.meta.env.STORYBLOK_API_TOKEN) return [];
  const { perPage = 25, sortBy = "content.order:asc", startsWith } = opts;
  try {
    const params = {
      per_page: perPage,
      sort_by: sortBy,
      filter_query: {
        component: { in: componentType },
      },
    };
    if (startsWith) params.starts_with = startsWith;
    const response = await storyblokClient.get("cdn/stories", params);
    return response.data.stories ?? [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Service helpers
// ---------------------------------------------------------------------------

/**
 * Fetch all Service stories, ordered by `content.order`.
 *
 * @returns {Promise<import("@storyblok/js").ISbStoryData<ServiceStory>[]>}
 */
export async function getServices() {
  return getStoriesByType("service", { sortBy: "content.order:asc" });
}

// ---------------------------------------------------------------------------
// Trainer helpers
// ---------------------------------------------------------------------------

/**
 * Fetch all Trainer stories.
 *
 * @returns {Promise<import("@storyblok/js").ISbStoryData<TrainerStory>[]>}
 */
export async function getTrainers() {
  return getStoriesByType("trainer", { sortBy: "content.full_name:asc" });
}

// ---------------------------------------------------------------------------
// News helpers
// ---------------------------------------------------------------------------

/**
 * Fetch news article listing (newest first).
 *
 * @param {{ perPage?: number }} [opts]
 * @returns {Promise<import("@storyblok/js").ISbStoryData<NewsStory>[]>}
 */
export async function getNewsArticles(opts = {}) {
  return getStoriesByType("news", {
    perPage: opts.perPage ?? 20,
    sortBy: "content.published_date:desc",
    startsWith: "news/",
  });
}

/**
 * Fetch a single news article by slug.
 * Expects the story to live at `news/{slug}` in Storyblok.
 *
 * @param {string} slug
 * @returns {Promise<import("@storyblok/js").ISbStoryData<NewsStory>|null>}
 */
export async function getNewsArticle(slug) {
  return getStory(`news/${slug}`);
}

// ---------------------------------------------------------------------------
// Static path helpers (used by Astro getStaticPaths)
// ---------------------------------------------------------------------------

/**
 * Returns `{ params: { slug } }` objects for every published news article.
 * Safe to call during build even when no token is configured.
 *
 * @returns {Promise<{ params: { slug: string } }[]>}
 */
export async function getNewsStaticPaths() {
  const articles = await getNewsArticles();
  return articles.map((story) => ({
    params: { slug: story.slug },
  }));
}
