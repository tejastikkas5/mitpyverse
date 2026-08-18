import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ResultRow, AnswerSheetRow } from '@/services/results';

function formatSeconds(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

// 1. Export Results as PDF
export function exportResultsPDF(testTitle: string, sessionScopeName: string, results: ResultRow[], analytics: any) {
  const doc = new jsPDF();
  doc.setFontSize(18); doc.setTextColor(40, 40, 40);
  doc.text('MITPyVerse — Examination Results Report', 14, 18);
  doc.setFontSize(10); doc.setTextColor(100, 100, 100);
  doc.text(`Test: ${testTitle}`, 14, 25);
  doc.text(`Session Scope: ${sessionScopeName}`, 14, 30);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 35);
  doc.setDrawColor(200,200,200); doc.setFillColor(245,247,250);
  doc.rect(14, 40, 182, 22, 'FD');
  doc.setFontSize(9); doc.setTextColor(50, 50, 50);
  doc.text(`Total Submitted: ${analytics.totalSubmitted}`, 18, 47);
  doc.text(`Average Score: ${analytics.averageScore} / ${results[0]?.totalMarks || 0} (${analytics.averagePercentage}%)`, 18, 54);
  doc.text(`Highest Score: ${analytics.highestScore}`, 100, 47);
  doc.text(`Lowest Score: ${analytics.lowestScore}`, 100, 54);
  if (analytics.topper) {
    doc.text(`Topper: ${analytics.topper.studentName} (${analytics.topper.studentCode})`, 18, 60);
  }
  const tableData = results.map((r) => [
    r.rank, r.studentCode, r.studentName, r.sessionName,
    `${r.score}/${r.totalMarks}`, `${r.percentage.toFixed(2)}%`,
    formatSeconds(r.timeTakenSeconds), r.violationsCount, r.status,
  ]);
  autoTable(doc, {
    startY: 68,
    head: [['Rank', 'Student ID', 'Student Name', 'Session', 'Score', '%', 'Time Taken', 'Violations', 'Status']],
    body: tableData, theme: 'striped',
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
  });
  const sanitizedTitle = testTitle.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`MITPyVerse_${sanitizedTitle}_Results_${Date.now()}.pdf`);
}

// 2. Export Results as Excel
export function exportResultsExcel(testTitle: string, sessionScopeName: string, results: ResultRow[]) {
  const worksheetData = results.map((r) => ({
    Rank: r.rank, 'Student ID': r.studentCode, 'Student Name': r.studentName,
    Session: r.sessionName, Score: r.score, 'Total Marks': r.totalMarks,
    'Percentage (%)': r.percentage, 'Time Taken': formatSeconds(r.timeTakenSeconds),
    'Started At': r.startedAt ? new Date(r.startedAt).toLocaleString() : 'N/A',
    'Submitted At': r.submittedAt ? new Date(r.submittedAt).toLocaleString() : 'N/A',
    Violations: r.violationsCount, Status: r.status,
  }));
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Exam Results');
  const sanitizedTitle = testTitle.replace(/[^a-zA-Z0-9]/g, '_');
  XLSX.writeFile(workbook, `MITPyVerse_${sanitizedTitle}_Results_${Date.now()}.xlsx`);
}

// 3. Export Answer Sheet as Excel
export function exportAnswerSheetExcel(testTitle: string, rows: AnswerSheetRow[]) {
  if (!rows || rows.length === 0) return;
  const worksheetData = rows.map((student) => {
    const base: Record<string, any> = {
      'Student ID': student.studentCode, 'Student Name': student.studentName, Session: student.sessionName,
    };
    student.answers.forEach((ans, idx) => {
      const qLabel = `Q${idx + 1}`;
      base[`${qLabel} - Question`] = ans.questionText;
      base[`${qLabel} - Option A`] = ans.optionA;
      base[`${qLabel} - Option B`] = ans.optionB;
      base[`${qLabel} - Option C`] = ans.optionC;
      base[`${qLabel} - Option D`] = ans.optionD;
      base[`${qLabel} - Correct Answer`] = ans.correctOption || 'N/A';
      base[`${qLabel} - Student Selected`] = ans.selectedOption || 'Not Answered';
      base[`${qLabel} - Result`] = ans.selectedOption ? (ans.isCorrect ? 'Correct' : 'Wrong') : 'Skipped';
      base[`${qLabel} - Marks Earned`] = ans.isCorrect ? ans.marks : 0;
    });
    base['Bonus Marks'] = student.bonusMarks; base['Total Score'] = student.score;
    base['Total Marks'] = student.totalMarks; base['Percentage (%)'] = student.percentage;
    return base;
  });
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Answer Sheet');
  const sanitizedTitle = testTitle.replace(/[^a-zA-Z0-9]/g, '_');
  XLSX.writeFile(workbook, `MITPyVerse_${sanitizedTitle}_AnswerSheet_${Date.now()}.xlsx`);
}

// 4. Export Answer Sheet as PDF
export function exportAnswerSheetPDF(testTitle: string, rows: AnswerSheetRow[]) {
  if (!rows || rows.length === 0) return;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });
  doc.setFontSize(16); doc.setTextColor(40, 40, 40);
  doc.text('MITPyVerse — Student Answer Sheet', 14, 16);
  doc.setFontSize(9); doc.setTextColor(100, 100, 100);
  doc.text(`Test: ${testTitle}`, 14, 22);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 27);
  doc.text(`Total Students: ${rows.length}`, 14, 32);
  const head: string[][] = [[
    'Student ID', 'Name', 'Session',
    ...rows[0].answers.map((_, i) => `Q${i + 1} Selected`),
    ...rows[0].answers.map((_, i) => `Q${i + 1} Result`),
    'Bonus', 'Score', '%',
  ]];
  const body = rows.map((student) => [
    student.studentCode, student.studentName, student.sessionName,
    ...student.answers.map((a) => a.selectedOption || '-'),
    ...student.answers.map((a) => a.selectedOption ? (a.isCorrect ? 'OK' : 'X') : '-'),
    student.bonusMarks,
    `${student.score}/${student.totalMarks}`,
    `${student.percentage.toFixed(1)}%`,
  ]);
  autoTable(doc, {
    startY: 38, head, body, theme: 'striped',
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold', fontSize: 7 },
    styles: { fontSize: 6.5, cellPadding: 1.5, overflow: 'linebreak' },
    columnStyles: { 0: { cellWidth: 22 }, 1: { cellWidth: 30 }, 2: { cellWidth: 22 } },
  });
  const sanitizedTitle = testTitle.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`MITPyVerse_${sanitizedTitle}_AnswerSheet_${Date.now()}.pdf`);
}
