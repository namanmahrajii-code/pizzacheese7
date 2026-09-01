import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    const validId = process.env.ADMIN_ID || 'admin';
    const validPass = process.env.ADMIN_PASSWORD || '7cheese123';

    if (
      (username === '7cheese_admin' && (password === 'admin@7cheese' || password === 'admin123' || password === '7cheese123')) ||
      (username === 'admin' && (password === 'admin123' || password === '7cheese123' || password === 'admin@7cheese')) ||
      (username === validId && password === validPass)
    ) {
      const response = NextResponse.json({ success: true, message: 'Authentication successful' });
      response.cookies.set('7cheese_admin_session', 'authenticated_admin_token', {
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24, // 24 hours
        sameSite: 'lax',
      });
      return response;
    }

    return NextResponse.json({ success: false, message: 'Invalid Admin ID or Password' }, { status: 401 });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
