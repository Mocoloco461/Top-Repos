import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encryptApiKey, decryptApiKey } from '@/lib/crypto';

export async function GET() {
  try {
    const settings = await prisma.appSettings.findUnique({
      where: { id: 'global' },
    });

    const isKeyConfigured = Boolean(settings?.encryptedOpenRouterKey);
    let maskedKey = '';

    if (isKeyConfigured && settings?.encryptedOpenRouterKey) {
      const decrypted = decryptApiKey(settings.encryptedOpenRouterKey);
      if (decrypted && decrypted.length > 8) {
        maskedKey = `${decrypted.substring(0, 8)}••••••••${decrypted.slice(-4)}`;
      } else {
        maskedKey = '••••••••••••';
      }
    }

    return NextResponse.json({
      isKeyConfigured,
      maskedKey,
      openRouterModel: settings?.openRouterModel || 'google/gemini-2.5-flash',
      autoTranslate: settings?.autoTranslate || false,
    });
  } catch (error) {
    console.error('Error loading settings:', error);
    return NextResponse.json({ error: 'Failed to load app settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { openRouterApiKey, openRouterModel, autoTranslate } = body;

    let encryptedKey: string | undefined = undefined;

    if (openRouterApiKey && openRouterApiKey.trim() !== '' && !openRouterApiKey.includes('••••')) {
      encryptedKey = encryptApiKey(openRouterApiKey.trim());
    }

    const updatedSettings = await prisma.appSettings.upsert({
      where: { id: 'global' },
      update: {
        ...(encryptedKey !== undefined ? { encryptedOpenRouterKey: encryptedKey } : {}),
        ...(openRouterModel ? { openRouterModel } : {}),
        ...(autoTranslate !== undefined ? { autoTranslate: Boolean(autoTranslate) } : {}),
      },
      create: {
        id: 'global',
        encryptedOpenRouterKey: encryptedKey || null,
        openRouterModel: openRouterModel || 'google/gemini-2.5-flash',
        autoTranslate: Boolean(autoTranslate),
      },
    });

    if (updatedSettings.autoTranslate) {
      const { queueRepoDescriptionTranslation } = await import('@/lib/translation');
      const untranslatedRepos = await prisma.repository.findMany({
        where: { hebrewDescription: null, isTranslating: false },
      });
      untranslatedRepos.forEach((repo) => {
        queueRepoDescriptionTranslation(repo.id, 'low');
      });
    }

    return NextResponse.json({
      success: true,
      openRouterModel: updatedSettings.openRouterModel,
      autoTranslate: updatedSettings.autoTranslate,
      isKeyConfigured: Boolean(updatedSettings.encryptedOpenRouterKey),
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
