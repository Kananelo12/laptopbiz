import { NextRequest, NextResponse } from 'next/server';
import { getClients, saveClients, Client } from '@/lib/data';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clients = await getClients();
    return NextResponse.json(clients);
  } catch (error) {
    console.error("GET /clients error:", error);
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
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
    const clients = await getClients();

    const newClient: Client = {
      id: Date.now().toString(),
      name: body.name,
      phone: body.phone,
      email: body.email || '',
      referralSource: body.referralSource || '',
      purchaseHistory: [],
      supportTickets: [],
      createdAt: new Date().toISOString(),
    };

    clients.push(newClient);
    await saveClients(clients);

    return NextResponse.json(newClient, { status: 201 });
  } catch (error) {
    console.error("POST /clients error:", error);
    return NextResponse.json(
      { error: 'Failed to add client' },
      { status: 500 }
    );
  }
}