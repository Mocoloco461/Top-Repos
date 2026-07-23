import { Repository, List } from '@prisma/client';

export async function triggerWebhookForRepoAdd(list: List, repo: Repository): Promise<{ success: boolean; error?: string }> {
  if (!list.webhookUrl || list.webhookUrl.trim() === '') {
    console.log(`[Webhook] No Webhook URL defined for list "${list.name}". Skipping.`);
    return { success: false, error: 'No Webhook URL defined' };
  }

  let targetUrl = list.webhookUrl.trim();

  // If user entered localhost/127.0.0.1 from inside Docker, replace with host.docker.internal
  if (targetUrl.includes('localhost') || targetUrl.includes('127.0.0.1')) {
    targetUrl = targetUrl.replace('localhost', 'host.docker.internal').replace('127.0.0.1', 'host.docker.internal');
  }

  const payload = {
    event: 'repository_added',
    list: {
      id: list.id,
      name: list.name,
      description: list.description,
    },
    repository: {
      id: repo.id,
      owner: repo.owner,
      name: repo.name,
      fullName: repo.fullName,
      description: repo.description,
      language: repo.language,
      url: repo.url,
      stars: repo.stars,
      starsToday: repo.starsToday,
    },
    timestamp: new Date().toISOString(),
  };

  console.log(`[Webhook] Sending POST payload to ${targetUrl} for list "${list.name}"...`);

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GitHub-Trending-Explorer-Webhook/1.0',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[Webhook] POST to ${targetUrl} failed with status ${response.status}: ${errText}`);
      return { success: false, error: `HTTP ${response.status}: ${errText}` };
    }

    console.log(`[Webhook] Successfully delivered POST webhook to ${targetUrl}! Status: ${response.status}`);
    return { success: true };
  } catch (error: any) {
    console.error(`[Webhook] Delivery error for list "${list.name}" (${targetUrl}):`, error?.message || error);
    return { success: false, error: error?.message || 'Network error' };
  }
}
