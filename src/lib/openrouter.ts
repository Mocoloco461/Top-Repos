import { prisma } from './prisma';
import { decryptApiKey } from './crypto';

export interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message: string;
  };
}

export async function callOpenRouterTranslation(text: string, isReadme = false): Promise<string> {
  if (!text || text.trim().length === 0) return '';

  const settings = await prisma.appSettings.findUnique({
    where: { id: 'global' },
  });

  if (!settings || !settings.encryptedOpenRouterKey) {
    throw new Error('OpenRouter API key is not configured in Settings.');
  }

  const apiKey = decryptApiKey(settings.encryptedOpenRouterKey);
  if (!apiKey) {
    throw new Error('Failed to decrypt OpenRouter API key.');
  }

  const model = settings.openRouterModel || 'google/gemini-2.5-flash';

  const systemPrompt = isReadme
    ? `You are an expert technical translator specializing in software engineering documentation. Translate the following GitHub repository README documentation into natural, fluent Hebrew. Preserve all markdown structure, code blocks, technical commands, URLs, HTML tags, and inline code formatting unchanged. Ensure the Hebrew phrasing reads naturally with proper technical terminology.`
    : `You are an expert technical translator. Translate the following short software repository description into concise, accurate Hebrew. Keep technical terms or product names as standard industry terms. Return ONLY the Hebrew translation text without quotes or preamble.`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://github-trending-explorer.local',
      'X-Title': 'GitHub Trending Explorer',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errText}`);
  }

  const data: OpenRouterResponse = await response.json();
  const result = data.choices?.[0]?.message?.content?.trim();

  if (!result) {
    throw new Error('OpenRouter returned an empty translation response.');
  }

  return result;
}
