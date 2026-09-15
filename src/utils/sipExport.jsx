
// src/utils/sipExport.js

import * as XLSX from "xlsx-js-style";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* =====================================================
   FORMAT NUMBER
===================================================== */

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  });
}

/* =====================================================
   EXCEL FORMATTING
===================================================== */

function formatExcelSheet(sheet, columnWidths) {
  // Set column widths
  sheet["!cols"] = columnWidths.map((width) => ({
    wch: width,
  }));

  if (!sheet["!ref"]) {
    return;
  }

  const range = XLSX.utils.decode_range(sheet["!ref"]);

  /* ---------------------------------------------------
     CENTER EVERY CELL
  --------------------------------------------------- */

  for (let row = range.s.r; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({
        r: row,
        c: col,
      });

      const cell = sheet[cellAddress];

      if (!cell) {
        continue;
      }

      cell.s = {
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: true,
        },
      };
    }
  }

  /* ---------------------------------------------------
     HEADER ROW
  --------------------------------------------------- */

  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({
      r: 0,
      c: col,
    });

    const cell = sheet[cellAddress];

    if (!cell) {
      continue;
    }

    cell.s = {
      font: {
        bold: true,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
    };
  }
}

/* =====================================================
   DOWNLOAD EXCEL
===================================================== */

export function downloadSIPExcel(result) {
  const {
    totalDeposited,
    totalReturns,
    totalWithdrawn,
    finalValue,
    yearlyReport,
    monthlyReport,
  } = result;

  const workbook = XLSX.utils.book_new();

  /* ===================================================
     SUMMARY SHEET
  =================================================== */

  const summaryData = [
    ["SIP Investment Report"],
    [],
    ["Total Deposited", totalDeposited],
    ["Total Returns", totalReturns],
    ["Total Withdrawn", totalWithdrawn],
    ["Final Value", finalValue],
  ];

  const summarySheet =
    XLSX.utils.aoa_to_sheet(summaryData);

  formatExcelSheet(summarySheet, [
    30,
    25,
  ]);

  XLSX.utils.book_append_sheet(
    workbook,
    summarySheet,
    "Summary"
  );

  /* ===================================================
     YEARLY REPORT
  =================================================== */

  const yearlyData = yearlyReport.map((row) => ({
    Year: row.year,

    "SIP This Year": Math.round(
      row.sipThisYear
    ),

    "Total Deposited": Math.round(
      row.totalDeposited
    ),

    "Returns This Year": Math.round(
      row.returnsThisYear
    ),

    "Total Returns": Math.round(
      row.totalReturns
    ),

    Withdrawal: Math.round(
      row.withdrawal
    ),

    "Total Withdrawn": Math.round(
      row.totalWithdrawn
    ),

    "Year End Balance": Math.round(
      row.yearEndBalance
    ),
  }));

  const yearlySheet =
    XLSX.utils.json_to_sheet(yearlyData);

  formatExcelSheet(yearlySheet, [
    10, // Year
    20, // SIP This Year
    20, // Total Deposited
    22, // Returns This Year
    20, // Total Returns
    18, // Withdrawal
    20, // Total Withdrawn
    23, // Year End Balance
  ]);

  XLSX.utils.book_append_sheet(
    workbook,
    yearlySheet,
    "Yearly Report"
  );

  /* ===================================================
     MONTHLY REPORT
  =================================================== */

  const monthlyData = monthlyReport.map((row) => ({
    Month: row.month,

    Year: row.year,

    "Month in Year": row.monthInYear,

    "Amount Deposited": Math.round(
      row.amountDeposited
    ),

    "Cumulative Deposited": Math.round(
      row.cumulativeDeposited
    ),

    "Returns Earned": Math.round(
      row.returnsEarned
    ),

    Withdrawal: Math.round(
      row.withdrawal
    ),

    "Month End Balance": Math.round(
      row.monthEndBalance
    ),
  }));

  const monthlySheet =
    XLSX.utils.json_to_sheet(monthlyData);

  formatExcelSheet(monthlySheet, [
    12, // Month
    10, // Year
    18, // Month in Year
    21, // Amount Deposited
    23, // Cumulative Deposited
    20, // Returns Earned
    18, // Withdrawal
    23, // Month End Balance
  ]);

  XLSX.utils.book_append_sheet(
    workbook,
    monthlySheet,
    "Monthly Report"
  );

  /* ===================================================
     DOWNLOAD
  =================================================== */

  XLSX.writeFile(
    workbook,
    "SIP-Investment-Report.xlsx"
  );
}

/* =====================================================
   DOWNLOAD PDF
===================================================== */

export function downloadSIPPDF(result) {
  const {
    totalDeposited,
    totalReturns,
    totalWithdrawn,
    finalValue,
    yearlyReport,
    monthlyReport,
  } = result;

  const doc = new jsPDF("landscape");

  /* ===================================================
     TITLE
  =================================================== */

  doc.setFontSize(18);

  doc.text(
    "SIP Investment Report",
    14,
    18
  );

  /* ===================================================
     SUMMARY
  =================================================== */

  doc.setFontSize(10);

  doc.text(
    `Total Deposited: Rs. ${formatNumber(
      totalDeposited
    )}`,
    14,
    28
  );

  doc.text(
    `Total Returns: Rs. ${formatNumber(
      totalReturns
    )}`,
    75,
    28
  );

  doc.text(
    `Total Withdrawn: Rs. ${formatNumber(
      totalWithdrawn
    )}`,
    140,
    28
  );

  doc.text(
    `Final Value: Rs. ${formatNumber(
      finalValue
    )}`,
    220,
    28
  );

  /* ===================================================
     YEARLY REPORT
  =================================================== */

  doc.setFontSize(13);

  doc.text(
    "Yearly Report",
    14,
    40
  );

  const yearlyRows = yearlyReport.map(
    (row) => [
      row.year,
      `Rs. ${formatNumber(
        row.sipThisYear
      )}`,
      `Rs. ${formatNumber(
        row.totalDeposited
      )}`,
      `Rs. ${formatNumber(
        row.returnsThisYear
      )}`,
      `Rs. ${formatNumber(
        row.totalReturns
      )}`,
      `Rs. ${formatNumber(
        row.withdrawal
      )}`,
      `Rs. ${formatNumber(
        row.yearEndBalance
      )}`,
    ]
  );

  autoTable(doc, {
    startY: 44,

    head: [[
      "Year",
      "SIP This Year",
      "Total Deposited",
      "Returns This Year",
      "Total Returns",
      "Withdrawal",
      "Year End Balance",
    ]],

    body: yearlyRows,

    styles: {
      fontSize: 8,
      halign: "center",
      valign: "middle",
    },

    headStyles: {
      fontSize: 8,
      halign: "center",
      valign: "middle",
    },

    margin: {
      left: 14,
      right: 14,
    },
  });

  /* ===================================================
     MONTHLY REPORT
  =================================================== */

  doc.addPage();

  doc.setFontSize(15);

  doc.text(
    "Monthly Report",
    14,
    18
  );

  const monthlyRows = monthlyReport.map(
    (row) => [
      row.month,
      row.year,
      row.monthInYear,
      `Rs. ${formatNumber(
        row.amountDeposited
      )}`,
      `Rs. ${formatNumber(
        row.cumulativeDeposited
      )}`,
      `Rs. ${formatNumber(
        row.returnsEarned
      )}`,
      `Rs. ${formatNumber(
        row.withdrawal
      )}`,
      `Rs. ${formatNumber(
        row.monthEndBalance
      )}`,
    ]
  );

  autoTable(doc, {
    startY: 23,

    head: [[
      "Month",
      "Year",
      "Month in Year",
      "Amount Deposited",
      "Cumulative Deposited",
      "Returns Earned",
      "Withdrawal",
      "Month End Balance",
    ]],

    body: monthlyRows,

    styles: {
      fontSize: 7,
      halign: "center",
      valign: "middle",
    },

    headStyles: {
      fontSize: 7,
      halign: "center",
      valign: "middle",
    },

    margin: {
      left: 10,
      right: 10,
    },
  });

  /* ===================================================
     DOWNLOAD
  =================================================== */

  doc.save(
    "SIP-Investment-Report.pdf"
  );
}

