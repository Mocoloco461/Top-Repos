import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { queueRepoDescriptionTranslation, queueRepoReadmeTranslation } from '@/lib/translation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repoId, type = 'description' } = body;

    if (!repoId) {
      return NextResponse.json({ error: 'repoId is required' }, { status: 400 });
    }

    const repo = await prisma.repository.findUnique({ where: { id: repoId } });
    if (!repo) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }

    if (type === 'description') {
      if (repo.hebrewDescription) {
        return NextResponse.json({
          translatedText: repo.hebrewDescription,
          isTranslating: false,
        });
      }
      // Manual translation request -> High priority (first in queue)
      const translatedText = await queueRepoDescriptionTranslation(repo.id, 'high');
      return NextResponse.json({
        translatedText: translatedText || undefined,
        isTranslating: false,
        message: 'Translation completed with high priority',
      });
    } else if (type === 'readme') {
      if (repo.hebrewReadme) {
        return NextResponse.json({
          translatedText: repo.hebrewReadme,
          isTranslating: false,
        });
      }
      if (!repo.readmeContent) {
        return NextResponse.json({ error: 'README content not available yet' }, { status: 400 });
      }
      // Manual translation request -> High priority (first in queue)
      const translatedText = await queueRepoReadmeTranslation(repo.id, repo.readmeContent, 'high');
      return NextResponse.json({
        translatedText: translatedText || undefined,
        isTranslating: false,
        message: 'README translation completed with high priority',
      });
    }

    return NextResponse.json({ error: 'Invalid translation type' }, { status: 400 });
  } catch (error: any) {
    console.error('Translation route error:', error);
    return NextResponse.json({ error: error.message || 'Failed to trigger translation' }, { status: 500 });
  }
}

