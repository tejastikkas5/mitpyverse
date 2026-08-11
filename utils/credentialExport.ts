import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export interface CredentialExportRow {
  student_code: string;
  name: string;
  rawPassword: string;
}

export function exportCredentialsPDF(credentials: CredentialExportRow[]) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text('MITPyVerse — Student Credentials', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
  doc.text('CONFIDENTIAL — Distribute to assigned students prior to examination', 14, 34);

  const tableData = credentials.map((item, idx) => [
    idx + 1,
    item.student_code,
    item.name,
    item.rawPassword,
  ]);

  autoTable(doc, {
    startY: 40,
    head: [['#', 'Student ID', 'Student Name', 'Temporary Password']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 4 },
  });

  doc.save(`MITPyVerse_Credentials_${Date.now()}.pdf`);
}

export function exportCredentialsExcel(credentials: CredentialExportRow[]) {
  const worksheetData = credentials.map((item) => ({
    'Student ID': item.student_code,
    'Student Name': item.name,
    'Temporary Password': item.rawPassword,
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Credentials');

  XLSX.writeFile(workbook, `MITPyVerse_Credentials_${Date.now()}.xlsx`);
}
