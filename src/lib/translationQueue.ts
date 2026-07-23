import { prisma } from './prisma';
import { callOpenRouterTranslation } from './openrouter';

export type TranslationPriority = 'high' | 'low';

export interface TranslationTask {
  id: string; // e.g., 'desc:repo-id' or 'readme:repo-id'
  repoId: string;
  type: 'description' | 'readme';
  readmeText?: string;
  priority: TranslationPriority;
  deferred?: {
    resolve: (value: string) => void;
    reject: (reason?: any) => void;
  };
}

class TranslationQueue {
  private queue: TranslationTask[] = [];
  private activeTaskIds: Set<string> = new Set();
  private maxConcurrency: number = 2;
  private runningCount: number = 0;

  /**
   * Adds a translation task to the queue.
   * If priority is 'high' (manual user request), it is placed FIRST IN QUEUE (at index 0).
   * If priority is 'low' (auto background task), it is placed at the end of the queue.
   */
  public enqueue(task: TranslationTask): Promise<string | void> {
    return new Promise<string | void>((resolve, reject) => {
      task.deferred = { resolve, reject };

      // Check if task is already in pending queue
      const existingIndex = this.queue.findIndex((t) => t.id === task.id);

      if (existingIndex !== -1) {
        if (task.priority === 'high') {
          // Upgrade existing task to high priority and move to top of queue!
          const [existingTask] = this.queue.splice(existingIndex, 1);
          existingTask.priority = 'high';
          existingTask.deferred = { resolve, reject };
          this.queue.unshift(existingTask); // First in queue!
        }
      } else if (!this.activeTaskIds.has(task.id)) {
        if (task.priority === 'high') {
          // Manual translation: Jump to the very front of the queue!
          this.queue.unshift(task);
        } else {
          // Auto translation: Append to back of queue
          this.queue.push(task);
        }
      } else {
        // Task is already actively running
        resolve();
        return;
      }

      this.processNext();
    });
  }

  private async processNext(): Promise<void> {
    if (this.runningCount >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }

    // Pick highest priority task (high priority tasks are always at the front due to unshift)
    const task = this.queue.shift();
    if (!task) return;

    this.runningCount++;
    this.activeTaskIds.add(task.id);

    try {
      // Mark repo as translating in database
      await prisma.repository.update({
        where: { id: task.repoId },
        data: { isTranslating: true },
      });

      let translatedText = '';

      if (task.type === 'description') {
        const repo = await prisma.repository.findUnique({ where: { id: task.repoId } });
        if (repo && repo.description) {
          translatedText = await callOpenRouterTranslation(repo.description, false);
          await prisma.repository.update({
            where: { id: task.repoId },
            data: {
              hebrewDescription: translatedText,
              isTranslating: false,
              translatedAt: new Date(),
            },
          });
        }
      } else if (task.type === 'readme' && task.readmeText) {
        translatedText = await callOpenRouterTranslation(task.readmeText, true);
        await prisma.repository.update({
          where: { id: task.repoId },
          data: {
            hebrewReadme: translatedText,
            isTranslating: false,
            translatedAt: new Date(),
          },
        });
      }

      if (task.deferred) {
        task.deferred.resolve(translatedText);
      }
    } catch (error) {
      console.error(`Translation task failed for ${task.id}:`, error);

      await prisma.repository.update({
        where: { id: task.repoId },
        data: { isTranslating: false },
      }).catch(() => {});

      if (task.deferred) {
        task.deferred.reject(error);
      }
    } finally {
      this.runningCount--;
      this.activeTaskIds.delete(task.id);
      this.processNext();
    }
  }
}

export const translationQueue = new TranslationQueue();

/**
 * Queue description translation.
 * Set priority='high' for manual user clicks (jumps to front of queue).
 */
export async function queueRepoDescriptionTranslation(
  repoId: string,
  priority: TranslationPriority = 'low'
): Promise<string | void> {
  const repo = await prisma.repository.findUnique({ where: { id: repoId } });
  if (!repo || !repo.description) return;
  if (repo.hebrewDescription && priority === 'low') return repo.hebrewDescription;

  return translationQueue.enqueue({
    id: `desc:${repoId}`,
    repoId,
    type: 'description',
    priority,
  });
}

/**
 * Queue README translation.
 * Set priority='high' for manual user clicks (jumps to front of queue).
 */
export async function queueRepoReadmeTranslation(
  repoId: string,
  readmeText: string,
  priority: TranslationPriority = 'low'
): Promise<string | void> {
  const repo = await prisma.repository.findUnique({ where: { id: repoId } });
  if (!repo) return;
  if (repo.hebrewReadme && priority === 'low') return repo.hebrewReadme;

  return translationQueue.enqueue({
    id: `readme:${repoId}`,
    repoId,
    type: 'readme',
    readmeText,
    priority,
  });
}
