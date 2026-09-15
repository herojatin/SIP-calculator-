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
    CALCULATION METHOD

    The calculator follows the calculation method used
    in the supplied SIP calculation reference.

    Monthly SIP is added every month.

    Monthly return:
        Current balance × monthly rate

    The return generated during a year is accumulated
    separately.

    The accumulated return is added to the balance
    only at the end of that year.

    Withdrawals are also processed at the end of the
    selected year, after the yearly return is credited.
  */

  let balance = 0;

  let totalDeposited = 0;
  let totalReturns = 0;
  let totalWithdrawn = 0;

  // Return accumulated during the current year
  let currentYearReturns = 0;

  // Deposit accumulated during the current year
  let currentYearDeposits = 0;

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
    currentYearDeposits += sip;

    // --------------------------------------------------
    // 2. Calculate monthly return
    // --------------------------------------------------

    const returnEarned = balance * monthlyRate;

    currentYearReturns += returnEarned;
    totalReturns += returnEarned;

    // --------------------------------------------------
    // 3. Default monthly values
    // --------------------------------------------------

    let withdrawalAmount = 0;
    const withdrawalDetails = [];

    let monthEndBalance = balance;

    // --------------------------------------------------
    // 4. End of year processing
    // --------------------------------------------------

    if (monthInYear === 12) {
      // Add accumulated return of the complete year
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

      // Balance after yearly return and withdrawals
      monthEndBalance = balance;
    }

    // --------------------------------------------------
    // 5. Add monthly report FIRST
    //
    // IMPORTANT:
    // The 12th month must be added before creating the
    // yearly report. This fixes SIP This Year:
    //
    // ₹10,000 × 12 = ₹1,20,000
    // --------------------------------------------------

    monthlyReport.push({
      month,
      year,
      monthInYear,

      amountDeposited: sip,

      // Cumulative deposits
      cumulativeDeposited: totalDeposited,

      // Return generated in this month
      returnsEarned: returnEarned,

      // Withdrawal made at year-end
      withdrawal: withdrawalAmount,

      withdrawalDetails,

      // Balance after year-end processing on month 12
      monthEndBalance: Math.max(0, monthEndBalance),
    });

    // --------------------------------------------------
    // 6. Create yearly report AFTER month 12 is added
    // --------------------------------------------------

    if (monthInYear === 12) {
      yearlyReport.push({
        year,

        // FIX:
        // This is now calculated from all 12 months
        // including month 12.
        sipThisYear: currentYearDeposits,

        // Cumulative amount invested
        totalDeposited,

        // Return generated during this year
        returnsThisYear: currentYearReturns,

        // Cumulative return
        totalReturns,

        // Withdrawal during this year
        withdrawal: withdrawalAmount,

        // Cumulative withdrawal
        totalWithdrawn,

        // Balance after yearly return + withdrawal
        yearEndBalance: Math.max(0, balance),

        withdrawalDetails,
      });

      // Reset yearly counters
      currentYearDeposits = 0;
      currentYearReturns = 0;
    }
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