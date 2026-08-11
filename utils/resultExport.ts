import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ResultRow } from '@/services/results';

function formatSeconds(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

// 1. Export Scoped Test Results as PDF
export function exportResultsPDF(
  testTitle: string,
  sessionScopeName: string,
  results: ResultRow[],
  analytics: any
) {
  const doc = new jsPDF();

  // Header Title
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text('MITPyVerse — Examination Results Report', 14, 18);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Test: ${testTitle}`, 14, 25);
  doc.text(`Session Scope: ${sessionScopeName}`, 14, 30);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 35);

  // Summary Analytics Card Box
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(245, 247, 250);
  doc.rect(14, 40, 182, 22, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  doc.text(`Total Submitted: ${analytics.totalSubmitted}`, 18, 47);
  doc.text(`Average Score: ${analytics.averageScore} / ${results[0]?.totalMarks || 0} (${analytics.averagePercentage}%)`, 18, 54);
  doc.text(`Highest Score: ${analytics.highestScore}`, 100, 47);
  doc.text(`Lowest Score: ${analytics.lowestScore}`, 100, 54);
  if (analytics.topper) {
    doc.text(`Topper: ${analytics.topper.studentName} (${analytics.topper.studentCode})`, 18, 60);
  }

  // Results Table Data
  const tableData = results.map((r) => [
    r.rank,
    r.studentCode,
    r.studentName,
    r.sessionName,
    `${r.score}/${r.totalMarks}`,
    `${r.percentage.toFixed(2)}%`,
    formatSeconds(r.timeTakenSeconds),
    r.violationsCount,
    r.status,
  ]);

  autoTable(doc, {
    startY: 68,
    head: [['Rank', 'Student ID', 'Student Name', 'Session', 'Score', '%', 'Time Taken', 'Violations', 'Status']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
  });

  const sanitizedTitle = testTitle.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`MITPyVerse_${sanitizedTitle}_Results_${Date.now()}.pdf`);
}

// 2. Export Scoped Test Results as Excel (.xlsx)
export function exportResultsExcel(
  testTitle: string,
  sessionScopeName: string,
  results: ResultRow[]
) {
  const worksheetData = results.map((r) => ({
    Rank: r.rank,
    'Student ID': r.studentCode,
    'Student Name': r.studentName,
    Session: r.sessionName,
    Score: r.score,
    'Total Marks': r.totalMarks,
    'Percentage (%)': r.percentage,
    'Time Taken': formatSeconds(r.timeTakenSeconds),
    'Started At': r.startedAt ? new Date(r.startedAt).toLocaleString() : 'N/A',
    'Submitted At': r.submittedAt ? new Date(r.submittedAt).toLocaleString() : 'N/A',
    Violations: r.violationsCount,
    Status: r.status,
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Exam Results');

  const sanitizedTitle = testTitle.replace(/[^a-zA-Z0-9]/g, '_');
  XLSX.writeFile(workbook, `MITPyVerse_${sanitizedTitle}_Results_${Date.now()}.xlsx`);
}
