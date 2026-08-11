'use me';
'use client';

import { useState } from 'react';
import { assignStudentToTestOrSessionAction, removeStudentAssignmentAction, bulkAssignStudentsToTestAction } from '@/services/sessions';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';

interface TestStudentsClientProps {
  testId: string;
  assignments: any[];
  allStudents: any[];
  sessions: any[];
}

export function TestStudentsClient({
  testId,
  assignments,
  allStudents,
  sessions,
}: TestStudentsClientProps) {
  const [currentAssignments, setCurrentAssignments] = useState<any[]>(assignments);
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [selectedUnassignedIds, setSelectedUnassignedIds] = useState<string[]>([]);
  const [pickerSearch, setPickerSearch] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Filter unassigned students
  const assignedStudentIds = new Set(currentAssignments.map((a) => a.student_id));
  const unassignedStudents = allStudents.filter(
    (s) =>
      !assignedStudentIds.has(s.id) &&
      (s.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
        s.student_code.toLowerCase().includes(pickerSearch.toLowerCase()))
  );

  const allUnassignedSelected =
    unassignedStudents.length > 0 &&
    unassignedStudents.every((s) => selectedUnassignedIds.includes(s.id));

  function toggleSelectAllUnassigned() {
    if (allUnassignedSelected) {
      const setUnassigned = new Set(unassignedStudents.map((s) => s.id));
      setSelectedUnassignedIds((prev) => prev.filter((id) => !setUnassigned.has(id)));
    } else {
      const newSelected = new Set([...selectedUnassignedIds, ...unassignedStudents.map((s) => s.id)]);
      setSelectedUnassignedIds(Array.from(newSelected));
    }
  }

  function toggleSelectUnassignedStudent(id: string) {
    setSelectedUnassignedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  async function handleBulkAssign() {
    if (selectedUnassignedIds.length === 0) return;
    setLoading(true);

    const res = await bulkAssignStudentsToTestAction(testId, selectedUnassignedIds);

    if (res.success) {
      window.location.reload();
    } else {
      alert(res.error || 'Failed to assign selected students');
      setLoading(false);
    }
  }

  async function handleRemove(assignmentId: string) {
    if (!confirm('Remove student assignment from this test?')) return;
    const res = await removeStudentAssignmentAction(assignmentId, testId);
    if (res.success) {
      setCurrentAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
    } else {
      alert(res.error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Student Assignment to Test & Sessions</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Assign enrolled students to this test and optionally assign them to a specific session/batch.
          </p>
        </div>
      </div>

      {/* ASSIGN FORM / MULTI-SELECT TRIGGER */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Enrolled Students Pool</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {allStudents.length - currentAssignments.length} unassigned student(s) available for this test.
            </p>
          </div>

          <button
            onClick={() => setShowPickerModal(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
          >
            <span>➕ Multi-Select Students to Assign</span>
          </button>
        </div>
      </Card>

      {/* ASSIGNED STUDENTS LIST */}
      <Card className="p-0 overflow-hidden" title={`Assigned Students (${currentAssignments.length})`}>
        <div className="p-4 border-b border-slate-800">
          <Input
            placeholder="Search assigned students..."
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
            className="w-72"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="p-4">Student ID</th>
                <th className="p-4">Student Name</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {currentAssignments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    No students assigned to this test yet.
                  </td>
                </tr>
              ) : (
                currentAssignments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-semibold text-indigo-400">
                      {a.students?.student_code}
                    </td>
                    <td className="p-4 font-medium text-slate-100">{a.students?.name}</td>
                    <td className="p-4">
                      <Badge variant={a.status === 'submitted' ? 'success' : 'info'}>
                        {a.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemove(a.id)}
                        className="text-rose-400 hover:text-rose-300"
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
      {/* MULTI-SELECT STUDENT PICKER MODAL */}
      {showPickerModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">Select Students for Examination</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Select any number of students from your enrolled pool to grant access to this test.
                </p>
              </div>
              <button
                onClick={() => setShowPickerModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            {/* Picker Search & Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <Input
                placeholder="Search name or student ID..."
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                className="w-full sm:w-72"
              />

              <div className="text-xs font-bold text-slate-600">
                {selectedUnassignedIds.length} student(s) selected
              </div>
            </div>

            {/* Student Checkbox Table */}
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600 uppercase tracking-wider sticky top-0 bg-slate-50 z-10">
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={allUnassignedSelected}
                        onChange={toggleSelectAllUnassigned}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </th>
                    <th className="p-3">Student ID</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Course / Year</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {unassignedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400 font-medium">
                        No unassigned students available.
                      </td>
                    </tr>
                  ) : (
                    unassignedStudents.map((s) => {
                      const isSelected = selectedUnassignedIds.includes(s.id);
                      return (
                        <tr
                          key={s.id}
                          onClick={() => toggleSelectUnassignedStudent(s.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-indigo-50/80 font-medium' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="p-3 w-10 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectUnassignedStudent(s.id)}
                              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </td>
                          <td className="p-3 font-mono font-bold text-indigo-600 text-xs">{s.student_code}</td>
                          <td className="p-3 font-bold text-slate-900">{s.name}</td>
                          <td className="p-3 text-xs text-slate-500">{s.course || 'N/A'} {s.year ? `(${s.year})` : ''}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedUnassignedIds([])}
                className="text-xs text-slate-500 hover:text-slate-700 font-bold"
              >
                Clear Selection
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowPickerModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={loading || selectedUnassignedIds.length === 0}
                  onClick={handleBulkAssign}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  {loading ? 'Assigning...' : `Assign ${selectedUnassignedIds.length} Student(s)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
