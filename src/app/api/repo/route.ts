import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { queueRepoReadmeTranslation } from '@/lib/translation';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get('owner');
  const name = searchParams.get('name');

  if (!owner || !name) {
    return NextResponse.json({ error: 'Owner and name are required' }, { status: 400 });
  }

  const fullName = `${owner}/${name}`;

  try {
    let repo = await prisma.repository.findUnique({
      where: { fullName },
      include: { listItems: { include: { list: true } } },
    });

    if (!repo) {
      // Create record if viewing a direct link
      repo = await prisma.repository.create({
        data: {
          owner,
          name,
          fullName,
          url: `https://github.com/${fullName}`,
          avatarUrl: `https://github.com/${owner}.png`,
        },
        include: { listItems: { include: { list: true } } },
      });
    }

    // Fetch README from GitHub if missing or older than 1 day
    let readmeText = repo.readmeContent || '';
    if (!readmeText) {
      const branches = ['main', 'master'];
      let fetchedReadme = '';

      for (const branch of branches) {
        const readmeUrl = `https://raw.githubusercontent.com/${fullName}/${branch}/README.md`;
        const res = await fetch(readmeUrl, { cache: 'no-store' });
        if (res.ok) {
          fetchedReadme = await res.text();
          break;
        }
      }

      if (fetchedReadme) {
        readmeText = fetchedReadme;
        await prisma.repository.update({
          where: { id: repo.id },
          data: { readmeContent: fetchedReadme },
        });
        repo.readmeContent = fetchedReadme;
      }
    }

    // Check autoTranslate setting
    const settings = await prisma.appSettings.findUnique({ where: { id: 'global' } });
    const autoTranslate = Boolean(settings?.autoTranslate);
    if (autoTranslate && readmeText && !repo.hebrewReadme && !repo.isTranslating) {
      queueRepoReadmeTranslation(repo.id, readmeText, 'low');
    }

    return NextResponse.json({ repo, readme: readmeText, autoTranslate });
  } catch (error) {
    console.error(`Error loading repo ${fullName}:`, error);
    return NextResponse.json({ error: 'Failed to load repository details' }, { status: 500 });
  }
}

