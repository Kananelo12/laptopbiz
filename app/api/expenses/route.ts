import { NextRequest, NextResponse } from 'next/server';
import { getExpenses, saveExpenses, Expense } from '@/lib/data';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const expenses = await getExpenses();
    return NextResponse.json(expenses);
  } catch (error) {
    console.error("GET /expenses error:", error);
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
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
    const expenses = await getExpenses();

    const newExpense: Expense = {
      id: Date.now().toString(),
      date: body.date,
      category: body.category,
      description: body.description,
      amount: body.amount,
      tripBatch: body.tripBatch,
      createdAt: new Date().toISOString(),
    };

    expenses.push(newExpense);
    await saveExpenses(expenses);

    return NextResponse.json(newExpense, { status: 201 });
  } catch (error) {
    console.error("POST /expenses error:", error);
    return NextResponse.json(
      { error: 'Failed to add expense' },
      { status: 500 }
    );
  }
}