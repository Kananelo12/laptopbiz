import { NextRequest, NextResponse } from 'next/server';
import { getCommissions, saveCommissions, Commission } from '@/lib/data';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const commissions = await getCommissions();
    return NextResponse.json(commissions);
  } catch (error) {
    console.error("GET /commissions error:", error);
    return NextResponse.json(
      { error: 'Failed to fetch commissions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const commissions = await getCommissions();

    const newCommission: Commission = {
      id: Date.now().toString(),
      saleId: body.saleId,
      earnerName: body.earnerName,
      earnerContact: body.earnerContact,
      amount: body.amount,
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
    };

    commissions.push(newCommission);
    await saveCommissions(commissions);

    return NextResponse.json(newCommission, { status: 201 });
  } catch (error) {
    console.error("POST /commissions error:", error);
    return NextResponse.json(
      { error: 'Failed to add commission' },
      { status: 500 }
    );
  }
}