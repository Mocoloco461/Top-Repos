import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { triggerWebhookForRepoAdd } from '@/lib/webhook';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { repositoryId } = body;

    if (!repositoryId) {
      return NextResponse.json({ error: 'repositoryId is required' }, { status: 400 });
    }

    const list = await prisma.list.findUnique({ where: { id: params.id } });
    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    const repo = await prisma.repository.findUnique({ where: { id: repositoryId } });
    if (!repo) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }

    // Add to list if not already present
    const item = await prisma.repoInList.upsert({
      where: {
        listId_repositoryId: {
          listId: params.id,
          repositoryId,
        },
      },
      update: {},
      create: {
        listId: params.id,
        repositoryId,
      },
    });

    // Await Webhook dispatch to ensure delivery completes before response returns
    const webhookResult = await triggerWebhookForRepoAdd(list, repo);

    return NextResponse.json({ item, webhookResult, success: true }, { status: 201 });
  } catch (error) {
    console.error('Error adding repository to list:', error);
    return NextResponse.json({ error: 'Failed to add repository to list' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const repositoryId = searchParams.get('repositoryId');

    if (!repositoryId) {
      return NextResponse.json({ error: 'repositoryId is required' }, { status: 400 });
    }

    await prisma.repoInList.delete({
      where: {
        listId_repositoryId: {
          listId: params.id,
          repositoryId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing repository from list:', error);
    return NextResponse.json({ error: 'Failed to remove repository from list' }, { status: 500 });
  }
}
