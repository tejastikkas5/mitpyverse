'use server';

import { redirect } from 'next/navigation';
import { setAdminSession, clearAdminSession, setStudentSession, clearStudentSession } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';

// ADMIN ACTIONS
export async function adminLoginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  const expectedEmail = process.env.ADMIN_EMAIL || 'tejastikkas';
  const expectedPassword = process.env.ADMIN_PASSWORD || 'tejas@2545';

  if (email !== expectedEmail || password !== expectedPassword) {
    return { success: false, error: 'Invalid credentials.' };
  }

  await setAdminSession(email);
  redirect('/admin');
}

export async function adminLogoutAction() {
  await clearAdminSession();
  redirect('/admin/login');
}

// STUDENT ACTIONS
export async function studentLoginAction(formData: FormData) {
  const studentCode = (formData.get('studentCode') as string)?.trim().toUpperCase();
  const password = (formData.get('password') as string)?.trim();

  if (!studentCode || !password) {
    return { success: false, error: 'Student ID and password are required.' };
  }

  const supabase = createAdminClient();

  const { data: student, error } = await supabase
    .from('students')
    .select('*')
    .eq('student_code', studentCode)
    .single();

  if (error || !student) {
    return { success: false, error: 'Invalid credentials.' };
  }

  if (!student.is_active) {
    return { success: false, error: 'Your account is inactive. Please contact the administrator.' };
  }

  // Verify strict password match against bcrypt hash only
  const isMatch = await bcrypt.compare(password, student.password_hash);

  if (!isMatch) {
    return { success: false, error: 'Invalid password. Please enter the exact password assigned to your Student ID.' };
  }

  await setStudentSession({
    id: student.id,
    student_code: student.student_code,
    name: student.name,
  });

  redirect('/student/dashboard');
}

export async function studentLogoutAction() {
  await clearStudentStudentSession();
  redirect('/login');
}

async function clearStudentStudentSession() {
  await clearStudentSession();
}
