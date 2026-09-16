// src/utils/sipExport.js

import * as XLSX from "xlsx-js-style";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* =====================================================
   FORMAT NUMBER
===================================================== */

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-AE", {
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
        ...(cell.s || {}),

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
      ...(cell.s || {}),

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
   APPLY AED FORMAT TO EXCEL CELLS
===================================================== */

function applyAEDFormat(sheet, columns) {
  if (!sheet["!ref"]) {
    return;
  }

  const range = XLSX.utils.decode_range(sheet["!ref"]);

  for (let row = range.s.r; row <= range.e.r; row++) {
    // Skip header row
    if (row === 0) {
      continue;
    }

    columns.forEach((col) => {
      const cellAddress = XLSX.utils.encode_cell({
        r: row,
        c: col,
      });

      const cell = sheet[cellAddress];

      if (!cell || typeof cell.v !== "number") {
        return;
      }

      cell.z = '"AED" #,##0';
    });
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

  // Apply AED formatting to summary values
  [1].forEach((col) => {
    for (let row = 2; row <= 5; row++) {
      const cellAddress = XLSX.utils.encode_cell({
        r: row,
        c: col,
      });

      const cell = summarySheet[cellAddress];

      if (cell && typeof cell.v === "number") {
        cell.z = '"AED" #,##0';
      }
    }
  });

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
    10,
    20,
    20,
    22,
    20,
    18,
    20,
    23,
  ]);

  /*
    Columns:
    0 = Year
    1 = SIP This Year
    2 = Total Deposited
    3 = Returns This Year
    4 = Total Returns
    5 = Withdrawal
    6 = Total Withdrawn
    7 = Year End Balance
  */

  applyAEDFormat(yearlySheet, [
    1,
    2,
    3,
    4,
    5,
    6,
    7,
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
    12,
    10,
    18,
    21,
    23,
    20,
    18,
    23,
  ]);

  /*
    Columns:
    0 = Month
    1 = Year
    2 = Month in Year
    3 = Amount Deposited
    4 = Cumulative Deposited
    5 = Returns Earned
    6 = Withdrawal
    7 = Month End Balance
  */

  applyAEDFormat(monthlySheet, [
    3,
    4,
    5,
    6,
    7,
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
    `Total Deposited: AED ${formatNumber(
      totalDeposited
    )}`,
    14,
    28
  );

  doc.text(
    `Total Returns: AED ${formatNumber(
      totalReturns
    )}`,
    75,
    28
  );

  doc.text(
    `Total Withdrawn: AED ${formatNumber(
      totalWithdrawn
    )}`,
    140,
    28
  );

  doc.text(
    `Final Value: AED ${formatNumber(
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

      `AED ${formatNumber(
        row.sipThisYear
      )}`,

      `AED ${formatNumber(
        row.totalDeposited
      )}`,

      `AED ${formatNumber(
        row.returnsThisYear
      )}`,

      `AED ${formatNumber(
        row.totalReturns
      )}`,

      `AED ${formatNumber(
        row.withdrawal
      )}`,

      `AED ${formatNumber(
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

      `AED ${formatNumber(
        row.amountDeposited
      )}`,

      `AED ${formatNumber(
        row.cumulativeDeposited
      )}`,

      `AED ${formatNumber(
        row.returnsEarned
      )}`,

      `AED ${formatNumber(
        row.withdrawal
      )}`,

      `AED ${formatNumber(
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