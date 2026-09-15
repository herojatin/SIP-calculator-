import React, { useMemo, useState } from "react";

import { calculateSIP } from "./utils/sipCalculator";
import { downloadSIPPDF, downloadSIPExcel } from "./utils/sipExport";


function formatINR(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.round(value || 0));
}

/*
  Summary card
*/

function MetricCard({
  label,
  value,
  note,
  type = "",
}) {
  return (
    <div className={`metric-card ${type}`}>
      <div className="metric-label">
        {label}
      </div>

      <div className="metric-value">
        {value}
      </div>

      {note && (
        <div className="metric-note">
          {note}
        </div>
      )}
    </div>
  );
}

/*
  Growth chart
*/

function GrowthChart({ data }) {
  if (!data || data.length === 0) {
    return null;
  }

  const width = 900;

  const height = 300;

  const paddingX = 45;

  const paddingY = 30;

  const values = data.map(
    (item) => item.yearEndBalance
  );

  const maxValue = Math.max(
    ...values,
    1
  );

  const points = data.map(
    (item, index) => {
      const x =
        paddingX +
        (index /
          Math.max(
            data.length - 1,
            1
          )) *
          (width -
            paddingX * 2);

      const y =
        height -
        paddingY -
        (item.yearEndBalance /
          maxValue) *
          (height -
            paddingY * 2);

      return `${x},${y}`;
    }
  );

  return (
    <div className="chart-wrap">

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="growth-chart"
      >

        {/* Grid lines */}

        {[0, 0.25, 0.5, 0.75, 1].map(
          (ratio) => {
            const y =
              height -
              paddingY -
              ratio *
                (height -
                  paddingY * 2);

            return (
              <line
                key={ratio}
                x1={paddingX}
                y1={y}
                x2={
                  width -
                  paddingX
                }
                y2={y}
                className="grid-line"
              />
            );
          }
        )}

        {/* Main line */}

        <polyline
          points={points.join(" ")}
          className="chart-line"
        />

        {/* Points */}

        {data.map(
          (item, index) => {
            const [x, y] =
              points[index]
                .split(",")
                .map(Number);

            const hasWithdrawal =
              item.withdrawal > 0;

            return (
              <g
                key={item.year}
              >
                <circle
                  cx={x}
                  cy={y}
                  r={
                    hasWithdrawal
                      ? 5
                      : 3
                  }
                  className={
                    hasWithdrawal
                      ? "chart-dot withdrawal-dot"
                      : "chart-dot"
                  }
                />

                {(
                  item.year === 1 ||
                  item.year ===
                    data.length ||
                  hasWithdrawal
                ) && (
                  <text
                    x={x}
                    y={height - 8}
                    textAnchor="middle"
                    className="axis-text"
                  >
                    Y{item.year}
                  </text>
                )}
              </g>
            );
          }
        )}

      </svg>

      {data.some(
        (item) =>
          item.withdrawal > 0
      ) && (
        <div className="chart-note">
          ● Highlighted points indicate
          years with withdrawals.
        </div>
      )}

    </div>
  );
}

function App() {

  /*
    Main inputs
  */

  const [
    monthlySIP,
    setMonthlySIP,
  ] = useState(10000);

  const [
    annualRate,
    setAnnualRate,
  ] = useState(10);

  const [
    years,
    setYears,
  ] = useState(20);

  /*
    Withdrawal state
  */

  const [
    withdrawals,
    setWithdrawals,
  ] = useState([]);

  const [
    withdrawalYear,
    setWithdrawalYear,
  ] = useState(10);

  const [
    withdrawalAmount,
    setWithdrawalAmount,
  ] = useState(1000000);

  /*
    Active report
  */

  const [
    activeTab,
    setActiveTab,
  ] = useState("yearly");

  /*
    Calculate SIP whenever
    input changes.
  */

  const result = useMemo(
    () =>
      calculateSIP({
        monthlySIP,
        annualRate,
        years,
        withdrawals,
      }),
    [
      monthlySIP,
      annualRate,
      years,
      withdrawals,
    ]
  );

  /*
    Add withdrawal
  */

  function addWithdrawal() {

    const year =
      Number(withdrawalYear);

    const amount =
      Number(withdrawalAmount);

    if (
      !year ||
      year < 1 ||
      year > years
    ) {
      alert(
        `Withdrawal year must be between 1 and ${years}.`
      );

      return;
    }

    if (
      !amount ||
      amount <= 0
    ) {
      alert(
        "Please enter a valid withdrawal amount."
      );

      return;
    }

    const newWithdrawal = {
      id:
        `${Date.now()}-${Math.random()}`,

      year,

      amount,
    };

    setWithdrawals(
      (current) => [
        ...current,
        newWithdrawal,
      ]
    );

    setWithdrawalAmount("");
  }

  /*
    Delete withdrawal
  */

  function removeWithdrawal(id) {
    setWithdrawals(
      (current) =>
        current.filter(
          (item) =>
            item.id !== id
        )
    );
  }

  /*
    Clear all withdrawals
  */

  function clearWithdrawals() {
    setWithdrawals([]);
  }

  /*
    Return percentage
  */

  const returnPercentage =
    result.totalDeposited > 0
      ? (result.totalReturns /
          result.totalDeposited) *
        100
      : 0;

  return (
    <div className="app">

      {/* ================= HEADER ================= */}

      <header className="hero">

        <div className="hero-inner">

          <div>

            <span className="eyebrow">
              FINANCIAL CALCULATOR
            </span>

            <h1>
              SIP Calculator
            </h1>

            <p>
              Calculate SIP growth,
              yearly returns,
              cumulative investment
              and withdrawals.
            </p>

          </div>

          <div className="hero-badge">
            SIP
          </div>

        </div>

      </header>

      <main className="container">

        {/* ================= INPUTS ================= */}

        <section className="panel">

          <div className="section-heading">

            <div>

              <h2>
                Investment Details
              </h2>

              <p>
                Enter your monthly
                investment, expected
                return and investment
                period.
              </p>

            </div>

          </div>

          <div className="input-grid">

            {/* Monthly SIP */}

            <label className="field">

              <span>
                Monthly SIP
              </span>

              <div className="input-prefix">

                <span>₹</span>

                <input
                  type="number"
                  min="0"
                  step="500"
                  value={
                    monthlySIP
                  }
                  onChange={(e) =>
                    setMonthlySIP(
                      Number(
                        e.target.value
                      )
                    )
                  }
                />

              </div>

            </label>

            {/* Return */}

            <label className="field">

              <span>
                Expected Return
              </span>

              <div className="input-suffix">

                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={
                    annualRate
                  }
                  onChange={(e) =>
                    setAnnualRate(
                      Number(
                        e.target.value
                      )
                    )
                  }
                />

                <span>%</span>

              </div>

            </label>

            {/* Years */}

            <label className="field">

              <span>
                Investment Period
              </span>

              <div className="input-suffix">

                <input
                  type="number"
                  min="1"
                  max="100"
                  value={years}
                  onChange={(e) =>
                    setYears(
                      Math.max(
                        1,
                        Number(
                          e.target.value
                        )
                      )
                    )
                  }
                />

                <span>
                  Years
                </span>

              </div>

            </label>

          </div>

        </section>

        {/* ================= SUMMARY ================= */}

        <section className="summary-grid">

          <MetricCard
            label="Total Invested"
            value={formatINR(
              result.totalDeposited
            )}
            note={`${formatINR(
              monthlySIP
            )} × 12 × ${years}`}
          />

          <MetricCard
            label="Total Returns"
            value={formatINR(
              result.totalReturns
            )}
            note={`${returnPercentage.toFixed(
              1
            )}% of total invested`}
            type="returns"
          />

          <MetricCard
            label="Total Withdrawn"
            value={formatINR(
              result.totalWithdrawn
            )}
            note={
              withdrawals.length
                ? `${
                    withdrawals.length
                  } withdrawal${
                    withdrawals.length >
                    1
                      ? "s"
                      : ""
                  }`
                : "No withdrawals"
            }
            type="withdrawal"
          />

          <MetricCard
            label="Final Value"
            value={formatINR(
              result.finalValue
            )}
            note="Value remaining at the end"
            type="final"
          />

        </section>

        {/* ================= CHART ================= */}

        <section className="panel">

          <div className="section-heading">

            <div>

              <h2>
                Investment Growth
              </h2>

              <p>
                Year-end balance after
                SIP contributions,
                returns and withdrawals.
              </p>

            </div>

          </div>

          <GrowthChart
            data={
              result.yearlyReport
            }
          />

        </section>

        {/* ================= WITHDRAWALS ================= */}

        <section className="panel">

          <div className="section-heading">

            <div>

              <h2>
                Withdrawals
              </h2>

              <p>
                The withdrawal is
                applied at the end of
                the selected year.
                Future returns are
                calculated on the
                remaining balance.
              </p>

            </div>

            {withdrawals.length >
              0 && (
              <button
                className="text-button"
                onClick={
                  clearWithdrawals
                }
              >
                Clear all
              </button>
            )}

          </div>

          <div className="withdrawal-form">

            {/* Withdrawal Year */}

            <label className="field">

              <span>
                Withdrawal Year
              </span>

              <input
                type="number"
                min="1"
                max={years}
                value={
                  withdrawalYear
                }
                onChange={(e) =>
                  setWithdrawalYear(
                    Number(
                      e.target.value
                    )
                  )
                }
              />

            </label>

            {/* Withdrawal Amount */}

            <label className="field">

              <span>
                Withdrawal Amount
              </span>

              <div className="input-prefix">

                <span>₹</span>

                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={
                    withdrawalAmount
                  }
                  onChange={(e) =>
                    setWithdrawalAmount(
                      Number(
                        e.target.value
                      )
                    )
                  }
                />

              </div>

            </label>

            <button
              className="primary-button"
              onClick={
                addWithdrawal
              }
            >
              + Add Withdrawal
            </button>

          </div>

          {/* Withdrawal list */}

          {withdrawals.length ===
          0 ? (

            <div className="empty-state">

              No withdrawals added.
              Add one above to see
              its effect on future
              calculations.

            </div>

          ) : (

            <div className="withdrawal-list">

              {withdrawals
                .slice()
                .sort(
                  (a, b) =>
                    a.year - b.year
                )
                .map(
                  (item) => (

                    <div
                      className="withdrawal-row"
                      key={item.id}
                    >

                      <div>

                        <strong>
                          Year{" "}
                          {item.year}
                        </strong>

                        <span>
                          Withdrawal
                        </span>

                      </div>

                      <strong>
                        {formatINR(
                          item.amount
                        )}
                      </strong>

                      <button
                        className="delete-button"
                        onClick={() =>
                          removeWithdrawal(
                            item.id
                          )
                        }
                      >
                        ×
                      </button>

                    </div>

                  )
                )}

            </div>

          )}

        </section>

        {/* ================= REPORT ================= */}

        <section className="panel">

          <div className="report-header">

            <div className="section-heading">

              <div>

                <h2>
                  Investment Report
                </h2>

                <p>
                  Total Deposited is
                  cumulative. SIP This
                  Year shows only that
                  year's contribution.
                </p>

              </div>

            </div>

            <div className="tabs">

              <button
                className={
                  activeTab ===
                  "yearly"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveTab(
                    "yearly"
                  )
                }
              >
                Yearly Report
              </button>

              <button
                className={
                  activeTab ===
                  "monthly"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveTab(
                    "monthly"
                  )
                }
              >
                Monthly Report
              </button>

            </div>

            <div className="export-buttons">
  <button
    type="button"
    className="text-button"
    onClick={() => downloadSIPPDF(result)}
  >
    Download PDF
  </button>

  <button
    type="button"
    className="primary-button"
    onClick={() => downloadSIPExcel(result)}
  >
    Download Excel
  </button>
</div>

          </div>

          {/* ================= YEARLY ================= */}

          {activeTab ===
          "yearly" ? (

            <div className="table-container">

              <table>

                <thead>

                  <tr>

                    <th>
                      Year
                    </th>

                    <th>
                      SIP This Year
                    </th>

                    <th>
                      Total Deposited
                    </th>

                    <th>
                      Returns Earned
                    </th>

                    <th>
                      Withdrawal
                    </th>

                    <th>
                      Year End Balance
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {result.yearlyReport.map(
                    (row) => (

                      <tr
                        key={row.year}
                        className={
                          row.withdrawal >
                          0
                            ? "withdrawal-year"
                            : ""
                        }
                      >

                        <td>
                          {row.year}
                        </td>

                        <td>
                          {formatINR(
                            row.sipThisYear
                          )}
                        </td>

                        <td>
                          {formatINR(
                            row.totalDeposited
                          )}
                        </td>

                        <td>
                          {formatINR(
                            row.returnsThisYear
                          )}
                        </td>

                        <td>

                          {row.withdrawal >
                          0 ? (
                            <span className="withdrawal-value">
                              −{" "}
                              {formatINR(
                                row.withdrawal
                              )}
                            </span>
                          ) : (
                            "—"
                          )}

                        </td>

                        <td className="balance-cell">
                          {formatINR(
                            row.yearEndBalance
                          )}
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

                <tfoot>

                  <tr>

                    <th>
                      Total
                    </th>

                    <th>
                      {formatINR(
                        result.totalDeposited
                      )}
                    </th>

                    <th>
                      {formatINR(
                        result.totalDeposited
                      )}
                    </th>

                    <th>
                      {formatINR(
                        result.totalReturns
                      )}
                    </th>

                    <th>
                      {formatINR(
                        result.totalWithdrawn
                      )}
                    </th>

                    <th>
                      {formatINR(
                        result.finalValue
                      )}
                    </th>

                  </tr>

                </tfoot>

              </table>

            </div>

          ) : (

            /* ================= MONTHLY ================= */

            <div className="table-container">

              <table>

                <thead>

                  <tr>

                    <th>
                      Month
                    </th>

                    <th>
                      Year
                    </th>

                    <th>
                      Amount Deposited
                    </th>

                    <th>
                      Cumulative Deposited
                    </th>

                    <th>
                      Returns Earned
                    </th>

                    <th>
                      Withdrawal
                    </th>

                    <th>
                      Month End Balance
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {result.monthlyReport.map(
                    (row) => (

                      <tr
                        key={row.month}
                        className={
                          row.withdrawal >
                          0
                            ? "withdrawal-year"
                            : ""
                        }
                      >

                        <td>
                          {row.month}
                        </td>

                        <td>
                          {row.year}
                        </td>

                        <td>
                          {formatINR(
                            row.amountDeposited
                          )}
                        </td>

                        <td>
                          {formatINR(
                            row.cumulativeDeposited
                          )}
                        </td>

                        <td>
                          {formatINR(
                            row.returnsEarned
                          )}
                        </td>

                        <td>

                          {row.withdrawal >
                          0 ? (
                            <span className="withdrawal-value">
                              −{" "}
                              {formatINR(
                                row.withdrawal
                              )}
                            </span>
                          ) : (
                            "—"
                          )}

                        </td>

                        <td className="balance-cell">
                          {formatINR(
                            row.monthEndBalance
                          )}
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

        {/* ================= EXPLANATION ================= */}

        <section className="logic-note">

          <h3>
            How the calculation works
          </h3>

          <p>
            Every month, the SIP is
            added to the investment
            balance and the monthly
            return is calculated. At
            the end of a withdrawal
            year, the withdrawal is
            deducted. From the next
            month onward, returns are
            calculated on the reduced
            balance plus new SIP
            contributions.
          </p>

        </section>

      </main>

      <footer>
        SIP Calculator • React
      </footer>

    </div>
  );
}

export default App;

