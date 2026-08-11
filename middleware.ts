import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'default-secret-change-me'
);

const ADMIN_COOKIE = 'mpv_admin_session';
const STUDENT_COOKIE = 'mpv_student_session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Protect Admin Routes (/admin/* except /admin/login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload.role !== 'admin') {
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // If logged in admin visits /admin/login, redirect to /admin/dashboard
  if (pathname === '/admin/login') {
    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        if (payload.role === 'admin') {
          return NextResponse.redirect(new URL('/admin', request.url));
        }
      } catch {
        // invalid token, proceed to login
      }
    }
  }

  // 2. Protect Student Routes (/student/*)
  if (pathname.startsWith('/student')) {
    const token = request.cookies.get(STUDENT_COOKIE)?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload.role !== 'student') {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // If logged in student visits /login, redirect to /student/dashboard
  if (pathname === '/login') {
    const token = request.cookies.get(STUDENT_COOKIE)?.value;
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        if (payload.role === 'student') {
          return NextResponse.redirect(new URL('/student/dashboard', request.url));
        }
      } catch {
        // invalid token, proceed to login
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/student/:path*', '/login'],
};
