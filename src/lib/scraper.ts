import * as cheerio from 'cheerio';
import { prisma } from './prisma';

export interface ScrapedRepo {
  owner: string;
  name: string;
  fullName: string;
  url: string;
  description: string;
  language: string;
  languageColor: string;
  stars: number;
  starsToday: number;
  forks: number;
  avatarUrl: string;
  bannerUrl?: string | null;
  trendingSince: string;
}

/**
 * Checks if an image URL is a concrete product screenshot/banner,
 * excluding badges, shields, star counters, avatars, and generic opengraph cards.
 */
export function isConcreteImage(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();

  // Exclude generic opengraph stat cards, badges, shields, and avatars
  if (
    lower.includes('opengraph.githubassets.com') ||
    lower.includes('shields.io') ||
    lower.includes('badge') ||
    lower.includes('github-readme-stats') ||
    lower.includes('github-profile-summary') ||
    lower.includes('avatars.githubusercontent.com') ||
    lower.includes('travis-ci') ||
    lower.includes('circleci') ||
    lower.includes('codecov') ||
    lower.includes('workflow') ||
    lower.includes('license') ||
    lower.includes('npm/v') ||
    lower.includes('downloads') ||
    lower.includes('stars.svg') ||
    lower.includes('forks.svg') ||
    lower.includes('commits.svg')
  ) {
    return false;
  }

  return true;
}

/**
 * Helper to extract the first CONCRETE image URL from README text (screenshots, UI previews, diagrams)
 */
export function extractFirstImageUrl(readme: string, fullName: string, branch = 'main'): string | null {
  if (!readme) return null;

  // Match all markdown images ![alt](url) and HTML <img src="url">
  const mdRegex = /!\[.*?\]\((https?:\/\/[^\s\)]+|\/[^\s\)]+|[^\s\)]+\.(?:png|jpg|jpeg|gif|svg|webp))\)/gi;
  const htmlRegex = /<img[^>]+src=["'](https?:\/\/[^"']+|\/[^"']+|[^"']+\.(?:png|jpg|jpeg|gif|svg|webp))["']/gi;

  const candidateUrls: string[] = [];

  let match;
  while ((match = mdRegex.exec(readme)) !== null) {
    candidateUrls.push(match[1]);
  }
  while ((match = htmlRegex.exec(readme)) !== null) {
    candidateUrls.push(match[1]);
  }

  for (let rawUrl of candidateUrls) {
    rawUrl = rawUrl.trim().replace(/^["']|["']$/g, '');

    let resolvedUrl = '';
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      if (rawUrl.includes('github.com') && rawUrl.includes('/blob/')) {
        resolvedUrl = rawUrl.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
      } else {
        resolvedUrl = rawUrl;
      }
    } else {
      const cleanPath = rawUrl.replace(/^\.\//, '').replace(/^\//, '');
      resolvedUrl = `https://raw.githubusercontent.com/${fullName}/${branch}/${cleanPath}`;
    }

    if (isConcreteImage(resolvedUrl)) {
      return resolvedUrl;
    }
  }

  return null;
}

/**
 * Fetches the GitHub repository's custom og:image or README screenshot, returning null if only generic stats exist
 */
export async function getRepoBannerUrl(fullName: string): Promise<string | null> {
  // First attempt: check README for concrete screenshot/image
  const branches = ['main', 'master'];
  for (const branch of branches) {
    try {
      const readmeRes = await fetch(`https://raw.githubusercontent.com/${fullName}/${branch}/README.md`, {
        cache: 'no-store',
      });
      if (readmeRes.ok) {
        const readmeText = await readmeRes.text();
        const extracted = extractFirstImageUrl(readmeText, fullName, branch);
        if (extracted) return extracted;
      }
    } catch (err) {
      // Ignore fetch error
    }
  }

  // Second attempt: check repository og:image (only if custom uploaded repository image)
  try {
    const res = await fetch(`https://github.com/${fullName}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      cache: 'no-store',
    });

    if (res.ok) {
      const html = await res.text();
      const $ = cheerio.load(html);
      const ogImage = $('meta[property="og:image"]').attr('content');
      if (
        ogImage &&
        isConcreteImage(ogImage) &&
        ogImage.includes('repository-images.githubusercontent.com')
      ) {
        return ogImage;
      }
    }
  } catch (err) {
    // Ignore fetch error
  }

  return null;
}

/**
 * Scrapes GitHub Trending page for a given date range (daily, weekly, monthly) and optional language filter.
 */
export async function scrapeGitHubTrending(
  since: 'daily' | 'weekly' | 'monthly' = 'daily',
  language?: string
): Promise<ScrapedRepo[]> {
  const langPath = language ? `/${encodeURIComponent(language)}` : '';
  const url = `https://github.com/trending${langPath}?since=${since}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`GitHub Trending request failed with status: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const repos: ScrapedRepo[] = [];

  $('article.Box-row').each((_, element) => {
    const titleAnchor = $(element).find('h2.h3 a').first();
    const href = titleAnchor.attr('href') || '';
    const fullPath = href.replace(/^\//, '').trim();

    if (!fullPath || !fullPath.includes('/')) return;

    const parts = fullPath.split('/');
    const owner = parts[0];
    const name = parts[1];
    const repoUrl = `https://github.com/${fullPath}`;

    const description = $(element).find('p').text().trim();
    const language = $(element).find('[itemprop="programmingLanguage"]').text().trim() || 'Unknown';
    const langColorStyle = $(element).find('.repo-language-color').attr('style') || '';
    const colorMatch = langColorStyle.match(/background-color:\s*(#[0-9a-fA-F]{3,6})/);
    const languageColor = colorMatch ? colorMatch[1] : '#8b949e';

    let totalStars = 0;
    let totalForks = 0;
    const stargazersText = $(element).find(`a[href$="/stargazers"]`).text().replace(/,/g, '').trim();
    if (stargazersText) {
      totalStars = parseInt(stargazersText, 10) || 0;
    }

    const forksText = $(element).find(`a[href$="/forks"]`).text().replace(/,/g, '').trim();
    if (forksText) {
      totalForks = parseInt(forksText, 10) || 0;
    }

    let starsToday = 0;
    const periodText = $(element).find('.float-sm-right').text().trim();
    const periodMatch = periodText.match(/([\d,]+)\s*stars/i);
    if (periodMatch) {
      starsToday = parseInt(periodMatch[1].replace(/,/g, ''), 10) || 0;
    }

    const avatarImg = $(element).find('img.avatar').first();
    let avatarUrl = avatarImg.attr('src') || `https://github.com/${owner}.png`;
    if (avatarUrl.startsWith('/')) {
      avatarUrl = `https://github.com${avatarUrl}`;
    }

    repos.push({
      owner,
      name,
      fullName: fullPath,
      url: repoUrl,
      description,
      language,
      languageColor,
      stars: totalStars,
      starsToday,
      forks: totalForks,
      avatarUrl,
      bannerUrl: null,
      trendingSince: since,
    });
  });

  return repos;
}

/**
 * Syncs trending repositories to the PostgreSQL database.
 */
export async function syncTrendingReposToDatabase(
  since: 'daily' | 'weekly' | 'monthly' = 'daily',
  language?: string
) {
  const scrapedRepos = await scrapeGitHubTrending(since, language);

  for (const repo of scrapedRepos) {
    // Get concrete screenshot / banner image only
    const bannerUrl = await getRepoBannerUrl(repo.fullName);

    await prisma.repository.upsert({
      where: { fullName: repo.fullName },
      update: {
        description: repo.description,
        language: repo.language,
        languageColor: repo.languageColor,
        stars: repo.stars,
        starsToday: repo.starsToday,
        forks: repo.forks,
        avatarUrl: repo.avatarUrl,
        bannerUrl,
        trendingSince: since,
        lastScrapedAt: new Date(),
      },
      create: {
        owner: repo.owner,
        name: repo.name,
        fullName: repo.fullName,
        url: repo.url,
        description: repo.description,
        language: repo.language,
        languageColor: repo.languageColor,
        stars: repo.stars,
        starsToday: repo.starsToday,
        forks: repo.forks,
        avatarUrl: repo.avatarUrl,
        bannerUrl,
        trendingSince: since,
        lastScrapedAt: new Date(),
      },
    });
  }

  return scrapedRepos;
}
