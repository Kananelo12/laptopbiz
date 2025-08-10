import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUsers } from '@/lib/data';
import { createToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    
    const users = await getUsers();
    console.log("All users: ", users);
    const user = users.find(u => u.username === username);
    console.log("this.user: ", user);
    
    if (!user) {
      return NextResponse.json({ error: 'User does not exist' }, { status: 401 });
    }
    
    // For demo purposes, we'll use a simple password check
    // In production, you would use bcrypt.compare(password, user.password)
    const isValidPassword = user.password === password; // Simple password for demo
    
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    const token = await createToken({ 
      userId: user.id, 
      username: user.username,
      name: user.name 
    });
    
    const response = NextResponse.json({ 
      success: true,
      user: { id: user.id, username: user.username, name: user.name }
    });
    
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    });
    
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}