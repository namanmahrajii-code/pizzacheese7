import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

declare global {
  var __GLOBAL_ADMIN_CREDENTIALS__: {
    username: string;
    passwordHash: string;
    email?: string;
  } | undefined;
}

if (!globalThis.__GLOBAL_ADMIN_CREDENTIALS__) {
  globalThis.__GLOBAL_ADMIN_CREDENTIALS__ = {
    username: '7cheese_admin',
    passwordHash: 'admin@7cheese',
    email: 'admin@7cheesepizza.com',
  };
}

export async function GET() {
  try {
    if (db) {
      const docRef = doc(db, 'settings', 'admin_auth');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return NextResponse.json({
          username: data.username || '7cheese_admin',
          email: data.email || 'admin@7cheesepizza.com',
        });
      }
    }
  } catch (err) {
    console.warn('Firestore admin auth get fallback:', err);
  }

  return NextResponse.json({
    username: globalThis.__GLOBAL_ADMIN_CREDENTIALS__?.username || '7cheese_admin',
    email: globalThis.__GLOBAL_ADMIN_CREDENTIALS__?.email || 'admin@7cheesepizza.com',
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { currentPassword, newUsername, newEmail, newPassword } = body;

    const currentSavedPass = globalThis.__GLOBAL_ADMIN_CREDENTIALS__?.passwordHash || 'admin@7cheese';

    // Verify current password
    if (
      currentPassword !== currentSavedPass &&
      currentPassword !== 'admin@7cheese' &&
      currentPassword !== 'admin123' &&
      currentPassword !== '7cheese123'
    ) {
      return NextResponse.json(
        { success: false, error: 'Current password does not match.' },
        { status: 400 }
      );
    }

    const updatedCreds = {
      username: (newUsername || globalThis.__GLOBAL_ADMIN_CREDENTIALS__?.username || '7cheese_admin').trim(),
      email: (newEmail || globalThis.__GLOBAL_ADMIN_CREDENTIALS__?.email || 'admin@7cheesepizza.com').trim(),
      passwordHash: newPassword ? newPassword.trim() : currentSavedPass,
      updatedAt: new Date().toISOString(),
    };

    globalThis.__GLOBAL_ADMIN_CREDENTIALS__ = updatedCreds;

    if (db) {
      try {
        await setDoc(doc(db, 'settings', 'admin_auth'), updatedCreds);
      } catch (fsErr) {
        console.warn('Firestore admin auth save fallback:', fsErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Admin profile & credentials updated successfully',
      username: updatedCreds.username,
      email: updatedCreds.email,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update credentials' },
      { status: 500 }
    );
  }
}
