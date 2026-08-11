'use server';

import { createAdminClient } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

// Helper: Generate random 6-character uppercase password
function generatePassword(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // exclude ambiguous 0,O,1,I
  let pass = '';
  for (let i = 0; i < 6; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

// Helper: Generate next sequential student code (e.g. MPV26-001)
async function generateNextStudentCode(): Promise<string> {
  const supabase = createAdminClient();
  const yearPrefix = 'MPV26-';

  const { data } = await supabase
    .from('students')
    .select('student_code')
    .like('student_code', `${yearPrefix}%`)
    .order('student_code', { ascending: false })
    .limit(1);

  if (!data || data.length === 0) {
    return `${yearPrefix}001`;
  }

  const lastCode = data[0].student_code;
  const numPart = parseInt(lastCode.split('-')[1] || '0', 10);
  const nextNum = (numPart + 1).toString().padStart(3, '0');
  return `${yearPrefix}${nextNum}`;
}

export async function createStudentAction(formData: FormData) {
  const name = (formData.get('name') as string)?.trim();
  const email = (formData.get('email') as string)?.trim() || null;
  const phone = (formData.get('phone') as string)?.trim() || null;
  const course = (formData.get('course') as string)?.trim() || null;
  const year = (formData.get('year') as string)?.trim() || null;
  const division = (formData.get('division') as string)?.trim() || null;

  if (!name) {
    return { success: false, error: 'Student name is required.' };
  }

  const supabase = createAdminClient();
  const student_code = await generateNextStudentCode();
  const rawPassword = generatePassword();
  const password_hash = await bcrypt.hash(rawPassword, 10);

  const { data, error } = await supabase
    .from('students')
    .insert([
      {
        student_code,
        name,
        password_hash,
        email,
        phone,
        course,
        year,
        division,
        is_active: true,
      },
    ])
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/students');
  return {
    success: true,
    student: data,
    generatedPassword: rawPassword,
  };
}

export async function toggleStudentStatusAction(id: string, currentStatus: boolean) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('students')
    .update({ is_active: !currentStatus })
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/students');
  return { success: true };
}

export async function deleteStudentAction(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/students');
  return { success: true };
}

export async function deleteStudentsBulkAction(ids: string[]) {
  if (!ids || ids.length === 0) return { success: true, count: 0 };
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('students')
    .delete()
    .in('id', ids);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/students');
  return { success: true, count: ids.length };
}

export async function setStudentsStatusBulkAction(ids: string[], is_active: boolean) {
  if (!ids || ids.length === 0) return { success: true, count: 0 };
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('students')
    .update({ is_active })
    .in('id', ids);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/students');
  return { success: true, count: ids.length };
}

export async function resetStudentPasswordAction(id: string) {
  const supabase = createAdminClient();
  const rawPassword = generatePassword();
  const password_hash = await bcrypt.hash(rawPassword, 10);

  const { data, error } = await supabase
    .from('students')
    .update({ password_hash })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/students');
  return {
    success: true,
    studentCode: data.student_code,
    newPassword: rawPassword,
  };
}

export async function updateStudentAction(id: string, formData: FormData) {
  const name = (formData.get('name') as string)?.trim();
  const email = (formData.get('email') as string)?.trim() || null;
  const phone = (formData.get('phone') as string)?.trim() || null;
  const course = (formData.get('course') as string)?.trim() || null;
  const year = (formData.get('year') as string)?.trim() || null;
  const division = (formData.get('division') as string)?.trim() || null;

  if (!name) {
    return { success: false, error: 'Name is required.' };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('students')
    .update({ name, email, phone, course, year, division })
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/students');
  return { success: true };
}

export async function bulkImportStudentsAction(rows: Array<{
  name: string;
  email?: string;
  phone?: string;
  course?: string;
  year?: string;
  division?: string;
}>) {
  const supabase = createAdminClient();
  const results: Array<{ id?: string; student_code: string; name: string; rawPassword: string }> = [];
  let successful = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row.name || !row.name.trim()) {
      failed++;
      errors.push(`Row ${i + 1}: Name is required`);
      continue;
    }

    try {
      const student_code = await generateNextStudentCode();
      const rawPassword = generatePassword();
      const password_hash = await bcrypt.hash(rawPassword, 10);

      const { data: createdStudent, error } = await supabase.from('students').insert([
        {
          student_code,
          name: row.name.trim(),
          password_hash,
          email: row.email?.trim() || null,
          phone: row.phone?.trim() || null,
          course: row.course?.trim() || null,
          year: row.year?.trim() || null,
          division: row.division?.trim() || null,
          is_active: true,
        },
      ]).select().single();

      if (error) {
        failed++;
        errors.push(`Row ${i + 1} (${row.name}): ${error.message}`);
      } else {
        successful++;
        results.push({
          id: createdStudent.id,
          student_code,
          name: row.name.trim(),
          rawPassword,
        });
      }
    } catch (err: any) {
      failed++;
      errors.push(`Row ${i + 1}: ${err.message || 'Unknown error'}`);
    }
  }

  revalidatePath('/admin/students');
  return {
    success: true,
    total: rows.length,
    successful,
    failed,
    errors,
    results,
  };
}
