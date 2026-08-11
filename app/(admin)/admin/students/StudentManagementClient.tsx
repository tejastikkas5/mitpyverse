'use me';
'use client';

import { useState, useEffect } from 'react';
import {
  createStudentAction,
  toggleStudentStatusAction,
  resetStudentPasswordAction,
  bulkImportStudentsAction,
  deleteStudentAction,
  deleteStudentsBulkAction,
  setStudentsStatusBulkAction,
} from '@/services/students';
import { exportCredentialsPDF, exportCredentialsExcel, CredentialExportRow } from '@/utils/credentialExport';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Student } from '@/types/database';

interface StudentManagementProps {
  initialStudents: Student[];
}

export function StudentManagementClient({ initialStudents }: StudentManagementProps) {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Multi-Selection State (Gallery-style selection)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Hydrate local storage saved passwords after client mount to prevent SSR hydration mismatch
  useEffect(() => {
    try {
      const savedPasses = JSON.parse(localStorage.getItem('student_passwords') || '{}');
      if (Object.keys(savedPasses).length > 0) {
        setStudents((prev) =>
          prev.map((s) => ({
            ...s,
            raw_password: savedPasses[s.id] || s.raw_password || null,
          }))
        );
      }
    } catch {
      // Ignore JSON parse errors
    }
  }, []);
  
  // Modals & Notices
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [createdCredential, setCreatedCredential] = useState<CredentialExportRow | null>(null);
  const [resetCredential, setResetCredential] = useState<CredentialExportRow | null>(null);
  const [bulkExportList, setBulkExportList] = useState<CredentialExportRow[] | null>(null);
  const [bulkLog, setBulkLog] = useState<{ total: number; successful: number; failed: number; errors: string[] } | null>(null);

  const [loading, setLoading] = useState(false);

  // Filtered list
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.student_code.toLowerCase().includes(search.toLowerCase()) ||
      (s.email && s.email.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && s.is_active) ||
      (statusFilter === 'inactive' && !s.is_active);

    return matchesSearch && matchesStatus;
  });

  // Handle Add Student
  async function handleAddStudent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await createStudentAction(formData);

    if (result.success && result.student && result.generatedPassword) {
      // Save password to localStorage immediately
      try {
        const savedPasses = JSON.parse(localStorage.getItem('student_passwords') || '{}');
        savedPasses[result.student.id] = result.generatedPassword;
        localStorage.setItem('student_passwords', JSON.stringify(savedPasses));
      } catch (err) {
        console.error(err);
      }

      setStudents((prev) => [{ ...result.student, raw_password: result.generatedPassword }, ...prev]);
      setCreatedCredential({
        student_code: result.student.student_code,
        name: result.student.name,
        rawPassword: result.generatedPassword,
      });
      setShowAddModal(false);
    } else {
      alert(result.error || 'Failed to create student');
    }
    setLoading(false);
  }

  // Handle Toggle Active
  async function handleToggleStatus(student: Student) {
    const res = await toggleStudentStatusAction(student.id, student.is_active);
    if (res.success) {
      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? { ...s, is_active: !s.is_active } : s))
      );
    } else {
      alert(res.error);
    }
  }

  // Handle Single Delete
  async function handleDeleteStudent(student: Student) {
    if (!confirm(`Are you sure you want to PERMANENTLY DELETE ${student.name} (${student.student_code})? This action cannot be undone.`)) return;
    setLoading(true);
    const res = await deleteStudentAction(student.id);
    if (res.success) {
      setStudents((prev) => prev.filter((s) => s.id !== student.id));
      setSelectedIds((prev) => prev.filter((id) => id !== student.id));
    } else {
      alert(res.error || 'Failed to delete student');
    }
    setLoading(false);
  }

  // Multi-select helpers
  const allFilteredSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((s) => selectedIds.includes(s.id));

  function toggleSelectAll() {
    if (allFilteredSelected) {
      const filteredSet = new Set(filteredStudents.map((s) => s.id));
      setSelectedIds((prev) => prev.filter((id) => !filteredSet.has(id)));
    } else {
      const newSelected = new Set([...selectedIds, ...filteredStudents.map((s) => s.id)]);
      setSelectedIds(Array.from(newSelected));
    }
  }

  function toggleSelectStudent(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  // Handle Bulk Actions
  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to PERMANENTLY DELETE ${selectedIds.length} selected student(s)? This action cannot be undone.`)) return;
    
    setLoading(true);
    const res = await deleteStudentsBulkAction(selectedIds);
    if (res.success) {
      const deletedSet = new Set(selectedIds);
      setStudents((prev) => prev.filter((s) => !deletedSet.has(s.id)));
      setSelectedIds([]);
    } else {
      alert(res.error || 'Failed to delete selected students');
    }
    setLoading(false);
  }

  async function handleBulkStatusChange(is_active: boolean) {
    if (selectedIds.length === 0) return;
    const actionName = is_active ? 'Activate' : 'Deactivate';
    if (!confirm(`Are you sure you want to ${actionName} ${selectedIds.length} selected student(s)?`)) return;

    setLoading(true);
    const res = await setStudentsStatusBulkAction(selectedIds, is_active);
    if (res.success) {
      const selectedSet = new Set(selectedIds);
      setStudents((prev) =>
        prev.map((s) => (selectedSet.has(s.id) ? { ...s, is_active } : s))
      );
    } else {
      alert(res.error || `Failed to ${actionName.toLowerCase()} selected students`);
    }
    setLoading(false);
  }

  // Handle Password Reset
  async function handleResetPassword(student: Student) {
    if (!confirm(`Reset password for ${student.name} (${student.student_code})?`)) return;
    const res = await resetStudentPasswordAction(student.id);
    if (res.success && res.newPassword) {
      // Persist in localStorage so refresh keeps the new password
      try {
        const savedPasses = JSON.parse(localStorage.getItem('student_passwords') || '{}');
        savedPasses[student.id] = res.newPassword;
        localStorage.setItem('student_passwords', JSON.stringify(savedPasses));
      } catch (e) {
        console.error(e);
      }

      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? { ...s, raw_password: res.newPassword } : s))
      );
      setResetCredential({
        student_code: student.student_code,
        name: student.name,
        rawPassword: res.newPassword,
      });
    } else {
      alert(res.error);
    }
  }

  // Handle CSV Import
  async function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const text = await file.text();
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

    if (lines.length <= 1) {
      alert('CSV file is empty or only contains header');
      setLoading(false);
      return;
    }

    // CSV parser (assumes headers: name, email, phone, course, year, division)
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const nameIdx = headers.indexOf('name');
    const emailIdx = headers.indexOf('email');
    const phoneIdx = headers.indexOf('phone');
    const courseIdx = headers.indexOf('course');
    const yearIdx = headers.indexOf('year');
    const divIdx = headers.indexOf('division');

    if (nameIdx === -1) {
      alert('CSV must contain a "name" column header');
      setLoading(false);
      return;
    }

    const rowsToInsert = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim());
      if (cols.length > nameIdx && cols[nameIdx]) {
        rowsToInsert.push({
          name: cols[nameIdx],
          email: emailIdx !== -1 ? cols[emailIdx] : undefined,
          phone: phoneIdx !== -1 ? cols[phoneIdx] : undefined,
          course: courseIdx !== -1 ? cols[courseIdx] : undefined,
          year: yearIdx !== -1 ? cols[yearIdx] : undefined,
          division: divIdx !== -1 ? cols[divIdx] : undefined,
        });
      }
    }

    const res = await bulkImportStudentsAction(rowsToInsert);
    setLoading(false);

    if (res.success) {
      // Persist all newly generated passwords into localStorage
      try {
        const savedPasses = JSON.parse(localStorage.getItem('student_passwords') || '{}');
        res.results.forEach((r: any) => {
          if (r.id && r.rawPassword) {
            savedPasses[r.id] = r.rawPassword;
          }
        });
        localStorage.setItem('student_passwords', JSON.stringify(savedPasses));
      } catch (err) {
        console.error(err);
      }

      setBulkLog({
        total: res.total,
        successful: res.successful,
        failed: res.failed,
        errors: res.errors,
      });
      setBulkExportList(res.results);
      setShowBulkModal(false);
      window.location.reload(); // Refresh student list
    } else {
      alert('Failed to import CSV');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Students Management</h1>
          <p className="text-sm text-slate-400 mt-1">
            Total Enrolled: <span className="font-semibold text-slate-200">{students.length}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => setShowBulkModal(true)} variant="outline">
            📥 Import CSV
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            ➕ Add Single Student
          </Button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <Card className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-80">
          <Input
            placeholder="Search name, student ID, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 uppercase font-semibold">Status:</span>
          {(['all', 'active', 'inactive'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </Card>

      {/* One-Time Generated Credential Notice */}
      {createdCredential && (
        <Card className="border-emerald-500/30 bg-emerald-950/20">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="success">Student Created Successfully</Badge>
                <span className="text-xs text-amber-400">⚠️ Displayed once — write down or export</span>
              </div>
              <div className="mt-3 space-y-1 text-sm text-slate-200">
                <div>Name: <span className="font-semibold text-white">{createdCredential.name}</span></div>
                <div>Student ID: <span className="font-mono text-indigo-400 font-bold">{createdCredential.student_code}</span></div>
                <div>Temporary Password: <span className="font-mono text-amber-400 font-bold text-base px-2 py-0.5 bg-slate-900 rounded">{createdCredential.rawPassword}</span></div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => exportCredentialsPDF([createdCredential])}>
                📄 PDF
              </Button>
              <Button size="sm" variant="outline" onClick={() => exportCredentialsExcel([createdCredential])}>
                📊 Excel
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setCreatedCredential(null)}>
                Dismiss
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Password Reset Notice */}
      {resetCredential && (
        <Card className="border-amber-500/30 bg-amber-950/20">
          <div className="flex items-start justify-between">
            <div>
              <Badge variant="warning">Password Reset Successfully</Badge>
              <div className="mt-3 space-y-1 text-sm text-slate-200">
                <div>Student ID: <span className="font-mono text-indigo-400 font-bold">{resetCredential.student_code}</span></div>
                <div>New Temporary Password: <span className="font-mono text-amber-400 font-bold text-base px-2 py-0.5 bg-slate-900 rounded">{resetCredential.rawPassword}</span></div>
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setResetCredential(null)}>
              Dismiss
            </Button>
          </div>
        </Card>
      )}

      {/* Bulk Import Result Export Panel */}
      {bulkExportList && bulkExportList.length > 0 && (
        <Card className="border-indigo-500/30 bg-indigo-950/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-indigo-300">Bulk Credentials Ready for Export</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Export generated logins for {bulkExportList.length} students now before closing.
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => exportCredentialsPDF(bulkExportList)}>
                Export All PDF
              </Button>
              <Button size="sm" variant="secondary" onClick={() => exportCredentialsExcel(bulkExportList)}>
                Export All Excel
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setBulkExportList(null)}>
                Close
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Bulk Action Bar (Appears when items are selected) */}
      {selectedIds.length > 0 && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-fadeIn">
          <div className="flex items-center gap-2 text-indigo-950 font-bold text-sm">
            <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-black">
              {selectedIds.length}
            </span>
            <span>{selectedIds.length} student(s) selected</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkStatusChange(true)}
              disabled={loading}
              className="border-emerald-300 text-emerald-700 bg-white hover:bg-emerald-50"
            >
              ⚡ Activate Selected ({selectedIds.length})
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkStatusChange(false)}
              disabled={loading}
              className="border-amber-300 text-amber-700 bg-white hover:bg-amber-50"
            >
              ⏸️ Deactivate Selected ({selectedIds.length})
            </Button>

            <Button
              size="sm"
              variant="danger"
              onClick={handleBulkDelete}
              disabled={loading}
            >
              🗑️ Delete Selected ({selectedIds.length})
            </Button>

            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-slate-500 hover:text-slate-700 font-bold px-2 py-1"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Student Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="p-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    title="Select All Students"
                  />
                </th>
                <th className="p-4">Student ID</th>
                <th className="p-4">Name</th>
                <th className="p-4">Password</th>
                <th className="p-4">Course / Year</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No students found matching filters.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const isSelected = selectedIds.includes(s.id);
                  return (
                    <tr
                      key={s.id}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-indigo-50/50 dark:bg-indigo-950/20'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="p-4 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectStudent(s.id)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-4 font-mono font-semibold text-indigo-400">{s.student_code}</td>
                      <td className="p-4 font-medium text-slate-100">{s.name}</td>
                      <td className="p-4 font-mono font-bold text-amber-400">
                        <span className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded tracking-widest text-sm">
                          {s.raw_password || '123456'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400 text-xs">
                        {s.course || 'N/A'} {s.year ? `(${s.year})` : ''}
                      </td>
                      <td className="p-4">
                        {s.is_active ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="danger">Inactive</Badge>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResetPassword(s)}
                        >
                          🔑 Reset Pass
                        </Button>
                        <Button
                          size="sm"
                          variant={s.is_active ? 'danger' : 'primary'}
                          onClick={() => handleToggleStatus(s)}
                        >
                          {s.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDeleteStudent(s)}
                          title="Delete Student"
                          className="bg-rose-700 hover:bg-rose-800 text-white"
                        >
                          🗑️ Delete
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ADD STUDENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md">
            <Card title="Add New Student" subtitle="Student ID and password will be generated automatically">
              <form onSubmit={handleAddStudent} className="space-y-3">
                <Input label="Full Name *" name="name" required placeholder="e.g. Ashitosh Deshmukh" />
                <Input label="Email (Optional)" name="email" type="email" placeholder="student@mit.edu" />
                <Input label="Phone (Optional)" name="phone" placeholder="+91 9876543210" />
                <div className="grid grid-cols-3 gap-2">
                  <Input label="Course" name="course" placeholder="B.Tech" />
                  <Input label="Year" name="year" placeholder="3rd" />
                  <Input label="Div" name="division" placeholder="A" />
                </div>
                <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-slate-800">
                  <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Student'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      )}

      {/* BULK IMPORT MODAL */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md">
            <Card title="Bulk Import Students (CSV)" subtitle="Upload CSV file with columns: name, email, phone, course, year, division">
              <div className="space-y-4">
                <div className="p-4 border-2 border-dashed border-slate-800 rounded-lg text-center bg-slate-950">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvUpload}
                    disabled={loading}
                    className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Format: Header row required. First column must be <code className="text-indigo-400">name</code>. Unique Student IDs & 6-char passwords auto-generated.
                </p>
                <div className="flex justify-end pt-2">
                  <Button type="button" variant="ghost" onClick={() => setShowBulkModal(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
