// src/utils/sipCalculator.js

export function calculateSIP({
  monthlySIP,
  annualRate,
  years,
  withdrawals = [],
}) {
  const sip = Math.max(0, Number(monthlySIP) || 0);
  const rate = Math.max(0, Number(annualRate) || 0);
  const totalYears = Math.max(1, Number(years) || 1);

  const monthlyRate = rate / 100 / 12;
  const totalMonths = totalYears * 12;

  // Normalize withdrawals
  const normalizedWithdrawals = withdrawals
    .map((withdrawal) => ({
      id: withdrawal.id,
      year: Math.max(
        1,
        Math.min(totalYears, Number(withdrawal.year) || 1)
      ),
      amount: Math.max(0, Number(withdrawal.amount) || 0),
    }))
    .filter((withdrawal) => withdrawal.amount > 0)
    .sort((a, b) => a.year - b.year);

  /*
    IMPORTANT:
    This calculator follows the calculation method used
    in the supplied PDF.

    The PDF does NOT compound the monthly return immediately.

    Example:

    Year 1:
      Month 1 balance = 10,000
      Return = 10,000 × 10% / 12 = 83.33

      Month 2 balance = 20,000
      Return = 20,000 × 10% / 12 = 166.67

      ...

      Month 12 balance = 1,20,000
      Return = 1,20,000 × 10% / 12 = 1,000

    Total Year 1 return ≈ ₹6,500

    Then:

      ₹1,20,000 + ₹6,500
      = ₹1,26,500

    Year 2 starts from ₹1,26,500.

    The accumulated return of the current year is NOT
    added to the balance until the end of that year.
  */

  let balance = 0;

  let totalDeposited = 0;
  let totalReturns = 0;
  let totalWithdrawn = 0;

  // Return accumulated during the current year.
  let currentYearReturns = 0;

  const monthlyReport = [];
  const yearlyReport = [];

  for (let month = 1; month <= totalMonths; month++) {
    const year = Math.ceil(month / 12);
    const monthInYear = ((month - 1) % 12) + 1;

    // --------------------------------------------------
    // 1. Add monthly SIP
    // --------------------------------------------------

    balance += sip;
    totalDeposited += sip;

    // --------------------------------------------------
    // 2. Calculate return
    //
    // IMPORTANT:
    // Return is calculated on the balance WITHOUT adding
    // previous months' returns of the same year.
    // --------------------------------------------------

    const returnEarned = balance * monthlyRate;

    currentYearReturns += returnEarned;
    totalReturns += returnEarned;

    // --------------------------------------------------
    // 3. Current month withdrawal
    //
    // Withdrawals are processed at the END of the selected
    // year, after the yearly return is added.
    // --------------------------------------------------

    let withdrawalAmount = 0;
    const withdrawalDetails = [];

    // --------------------------------------------------
    // 4. End of year
    // --------------------------------------------------

    if (monthInYear === 12) {
      // First add the accumulated yearly return
      balance += currentYearReturns;

      // Find withdrawals scheduled for this year
      const withdrawalsThisYear = normalizedWithdrawals.filter(
        (withdrawal) => withdrawal.year === year
      );

      for (const withdrawal of withdrawalsThisYear) {
        const actualWithdrawal = Math.min(
          withdrawal.amount,
          balance
        );

        balance -= actualWithdrawal;

        withdrawalAmount += actualWithdrawal;
        totalWithdrawn += actualWithdrawal;

        withdrawalDetails.push({
          ...withdrawal,
          requestedAmount: withdrawal.amount,
          actualAmount: actualWithdrawal,
        });
      }

      // Save yearly report
      const yearStartMonth = (year - 1) * 12;
      const yearMonths = monthlyReport.slice(
        yearStartMonth,
        yearStartMonth + 12
      );

      yearlyReport.push({
        year,

        // Amount invested during THIS year
        sipThisYear: yearMonths.reduce(
          (sum, row) => sum + row.amountDeposited,
          0
        ),

        // CUMULATIVE amount invested
        totalDeposited,

        // Return generated during THIS year
        returnsThisYear: currentYearReturns,

        // CUMULATIVE return
        totalReturns,

        // Withdrawal during this year
        withdrawal: withdrawalAmount,

        // CUMULATIVE withdrawal
        totalWithdrawn,

        // Balance after yearly return + withdrawal
        yearEndBalance: balance,

        withdrawalDetails,
      });

      // Reset yearly return accumulator
      currentYearReturns = 0;
    }

    // --------------------------------------------------
    // Monthly report
    //
    // The PDF displays the balance BEFORE adding the
    // current year's accumulated return, except on the
    // 12th month where the yearly return is credited.
    // --------------------------------------------------

    let monthEndBalance = balance;

    if (monthInYear !== 12) {
      monthEndBalance = balance;
    }

    monthlyReport.push({
      month,
      year,
      monthInYear,

      amountDeposited: sip,

      // Cumulative deposits
      cumulativeDeposited: totalDeposited,

      returnsEarned: returnEarned,

      withdrawal: withdrawalAmount,

      withdrawalDetails,

      monthEndBalance: Math.max(0, monthEndBalance),
    });
  }

  return {
    monthlyRate,

    totalDeposited,
    totalReturns,
    totalWithdrawn,

    finalValue: Math.max(0, balance),

    yearlyReport,
    monthlyReport,
  };
}