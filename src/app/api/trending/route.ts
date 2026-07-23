import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncTrendingReposToDatabase } from '@/lib/scraper';
import { queueRepoDescriptionTranslation } from '@/lib/translation';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const since = (searchParams.get('since') as 'daily' | 'weekly' | 'monthly') || 'daily';
  const language = searchParams.get('language') || undefined;
  const forceRefresh = searchParams.get('refresh') === 'true';

  try {
    // Check DB for existing repos for this since filter
    let repos = await prisma.repository.findMany({
      where: {
        trendingSince: since,
        ...(language ? { language: { equals: language, mode: 'insensitive' } } : {}),
      },
      orderBy: { starsToday: 'desc' },
      include: {
        listItems: true,
      },
    });

    // If empty or forceRefresh or cache is older than 30 mins, trigger scrape
    const shouldScrape =
      repos.length === 0 ||
      forceRefresh ||
      (repos[0]?.lastScrapedAt &&
        Date.now() - new Date(repos[0].lastScrapedAt).getTime() > 30 * 60 * 1000);

    if (shouldScrape) {
      try {
        await syncTrendingReposToDatabase(since, language);

        // Fetch refreshed repos
        repos = await prisma.repository.findMany({
          where: {
            trendingSince: since,
            ...(language ? { language: { equals: language, mode: 'insensitive' } } : {}),
          },
          orderBy: { starsToday: 'desc' },
          include: {
            listItems: true,
          },
        });
      } catch (scrapeErr) {
        console.error('Background scrape failed, falling back to cached DB data:', scrapeErr);
      }
    }

    // Check if autoTranslate is enabled in global AppSettings
    const settings = await prisma.appSettings.findUnique({ where: { id: 'global' } });
    const autoTranslate = Boolean(settings?.autoTranslate);
    if (autoTranslate) {
      // Auto queue translations for untranslated repos on Explore page with HIGH priority
      repos.forEach((repo) => {
        if (!repo.hebrewDescription && !repo.isTranslating) {
          queueRepoDescriptionTranslation(repo.id, 'high');
          repo.isTranslating = true;
        }
      });
    }

    return NextResponse.json({
      repos,
      autoTranslate,
      lastUpdated: repos[0]?.lastScrapedAt || new Date(),
    });
  } catch (error) {
    console.error('Error fetching trending repos:', error);
    return NextResponse.json({ error: 'Failed to fetch trending repositories' }, { status: 500 });
  }
}

