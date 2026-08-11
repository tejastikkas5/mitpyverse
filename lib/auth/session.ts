import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'default-secret-change-me'
);

const ADMIN_COOKIE = 'mpv_admin_session';
const STUDENT_COOKIE = 'mpv_student_session';

export interface AdminSession {
  role: 'admin';
  email: string;
}

export interface StudentSession {
  role: 'student';
  student_id: string;
  student_code: string;
  student_name: string;
}

// ADMIN SESSION HELPERS
export async function setAdminSession(email: string) {
  const token = await new SignJWT({ role: 'admin', email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 12 * 60 * 60, // 12 hours
  });
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.role === 'admin') {
      return { role: 'admin', email: payload.email as string };
    }
  } catch {
    return null;
  }
  return null;
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}

// STUDENT SESSION HELPERS
export async function setStudentSession(student: { id: string; student_code: string; name: string }) {
  const token = await new SignJWT({
    role: 'student',
    student_id: student.id,
    student_code: student.student_code,
    student_name: student.name,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set(STUDENT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 12 * 60 * 60, // 12 hours
  });
}

export async function getStudentSession(): Promise<StudentSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(STUDENT_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.role === 'student') {
      return {
        role: 'student',
        student_id: payload.student_id as string,
        student_code: payload.student_code as string,
        student_name: payload.student_name as string,
      };
    }
  } catch {
    return null;
  }
  return null;
}

export async function clearStudentSession() {
  const cookieStore = await cookies();
  cookieStore.delete(STUDENT_COOKIE);
}
