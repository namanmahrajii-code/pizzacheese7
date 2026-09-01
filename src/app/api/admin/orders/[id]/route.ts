import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    // Try updating in Prisma
    try {
      await prisma.order.update({
        where: { id },
        data: { status },
      });
    } catch (e) {
      console.warn('Prisma status update fallback to memory:', e);
    }

    // Update in global store
    if (globalThis.__GLOBAL_ORDERS__) {
      const idx = globalThis.__GLOBAL_ORDERS__.findIndex((o: any) => o.id === id);
      if (idx > -1) {
        globalThis.__GLOBAL_ORDERS__[idx].status = status;
      }
    }

    return NextResponse.json({ success: true, id, status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update order status' }, { status: 500 });
  }
}
