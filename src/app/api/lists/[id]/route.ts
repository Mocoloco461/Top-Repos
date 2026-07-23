import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const list = await prisma.list.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            repository: true,
          },
          orderBy: { addedAt: 'desc' },
        },
      },
    });

    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    return NextResponse.json({ list });
  } catch (error) {
    console.error('Error fetching list details:', error);
    return NextResponse.json({ error: 'Failed to fetch list details' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, description, webhookUrl } = body;

    const updatedList = await prisma.list.update({
      where: { id: params.id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        description: description !== undefined ? description?.trim() || null : undefined,
        webhookUrl: webhookUrl !== undefined ? webhookUrl?.trim() || null : undefined,
      },
    });

    return NextResponse.json({ list: updatedList });
  } catch (error) {
    console.error('Error updating list settings:', error);
    return NextResponse.json({ error: 'Failed to update list settings' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.list.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting list:', error);
    return NextResponse.json({ error: 'Failed to delete list' }, { status: 500 });
  }
}
