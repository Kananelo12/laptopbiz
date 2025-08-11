import { NextRequest, NextResponse } from 'next/server';
import { getCommissions, saveCommissions } from '@/lib/data';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const commissions = await getCommissions();
    
    const commissionIndex = commissions.findIndex(c => c.id === params.id);
    if (commissionIndex === -1) {
      return NextResponse.json({ error: 'Commission not found' }, { status: 404 });
    }

    // Update commission
    commissions[commissionIndex] = {
      ...commissions[commissionIndex],
      ...body,
    };

    await saveCommissions(commissions);

    return NextResponse.json(commissions[commissionIndex]);
  } catch (error) {
    console.error("PATCH /commissions/[id] error:", error);
    return NextResponse.json(
      { error: 'Failed to update commission' },
      { status: 500 }
    );
  }
}