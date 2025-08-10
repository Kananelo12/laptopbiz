import { NextRequest, NextResponse } from 'next/server';
import { getLaptops, saveLaptops, Laptop } from '@/lib/data';
import { getUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const laptops = await getLaptops();
    return NextResponse.json(laptops);
  } catch (error) {
    console.error("GET /laptops error:", error);
    return NextResponse.json(
      { error: 'Failed to fetch laptops' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const laptops = await getLaptops();

    const newLaptop: Laptop = {
      id: Date.now().toString(),
      corporateBrand: body.corporateBrand,
      productBrand: body.productBrand,
      performanceTier: body.performanceTier,
      generation: body.generation,
      sku: body.sku,
      purchasePrice: body.purchasePrice,
      conditionNotes: body.conditionNotes || '',
      quantity: body.quantity,
      status: 'available',
      purchaseDate: body.purchaseDate,
      createdAt: new Date().toISOString(),
    };

    laptops.push(newLaptop);
    await saveLaptops(laptops);

    return NextResponse.json(newLaptop, { status: 201 });
  } catch (error) {
    console.error("POST /laptops error:", error);
    return NextResponse.json(
      { error: 'Failed to add laptop' },
      { status: 500 }
    );
  }
}
