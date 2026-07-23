import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const lists = await prisma.list.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        items: {
          include: {
            repository: true,
          },
        },
      },
    });

    return NextResponse.json({ lists });
  } catch (error) {
    console.error('Error fetching lists:', error);
    return NextResponse.json({ error: 'Failed to fetch lists' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, webhookUrl } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'List name is required' }, { status: 400 });
    }

    const newList = await prisma.list.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        webhookUrl: webhookUrl?.trim() || null,
      },
      include: { items: true },
    });

    return NextResponse.json({ list: newList }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A list with this name already exists' }, { status: 400 });
    }
    console.error('Error creating list:', error);
    return NextResponse.json({ error: 'Failed to create list' }, { status: 500 });
  }
}
