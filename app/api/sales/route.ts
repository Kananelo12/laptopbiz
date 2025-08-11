import { NextRequest, NextResponse } from 'next/server';
import { getSales, saveSales, Sale, getLaptops, saveLaptops, getCommissions, saveCommissions, Commission } from '@/lib/data';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sales = await getSales();
    return NextResponse.json(sales);
  } catch (error) {
    console.error("GET /sales error:", error);
    return NextResponse.json(
      { error: 'Failed to fetch sales' },
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
    const sales = await getSales();
    const laptops = await getLaptops();

    // Find the laptop and update its status/quantity
    const laptop = laptops.find(l => l.id === body.laptopId);
    if (!laptop) {
      return NextResponse.json({ error: 'Laptop not found' }, { status: 404 });
    }

    if (laptop.status !== 'available' || laptop.quantity <= 0) {
      return NextResponse.json({ error: 'Laptop not available for sale' }, { status: 400 });
    }

    const newSale: Sale = {
      id: Date.now().toString(),
      laptopId: body.laptopId,
      clientId: body.clientId,
      salePrice: body.salePrice,
      paymentStatus: body.paymentStatus,
      paymentMethod: body.paymentMethod,
      saleDate: body.saleDate,
      commissionEarner: body.commissionEarner,
      commissionAmount: body.commissionAmount,
      createdAt: new Date().toISOString(),
    };

    // Update laptop quantity/status
    laptop.quantity -= 1;
    if (laptop.quantity === 0) {
      laptop.status = 'sold';
    }

    // Create commission if specified
    if (body.commissionEarner && body.commissionAmount) {
      const commissions = await getCommissions();
      const newCommission: Commission = {
        id: Date.now().toString() + '_comm',
        saleId: newSale.id,
        earnerName: body.commissionEarner,
        earnerContact: body.commissionEarner, // You might want to add a separate field for this
        amount: body.commissionAmount,
        paymentStatus: 'pending',
        createdAt: new Date().toISOString(),
      };
      commissions.push(newCommission);
      await saveCommissions(commissions);
    }

    sales.push(newSale);
    await saveSales(sales);
    await saveLaptops(laptops);

    return NextResponse.json(newSale, { status: 201 });
  } catch (error) {
    console.error("POST /sales error:", error);
    return NextResponse.json(
      { error: 'Failed to add sale' },
      { status: 500 }
    );
  }
}