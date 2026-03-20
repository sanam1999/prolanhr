export const handleDownloadPDF = (totalPayroll, avgSalary, activeEmployees ) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payroll Report</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 40px; color: #111; }
            h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
            .subtitle { font-size: 12px; color: #666; margin-bottom: 28px; }
            .stats { display: flex; gap: 16px; margin-bottom: 28px; }
            .stat-card { flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
            .stat-label { font-size: 11px; color: #666; margin-bottom: 4px; }
            .stat-value { font-size: 18px; font-weight: 700; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; }
            thead tr { background: #f3f4f6; }
            th { text-align: left; padding: 10px 12px; font-size: 11px; color: #666; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
            th:last-child { text-align: right; }
            td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; }
            td:last-child { text-align: right; font-weight: 600; }
            .footer-row td { border-top: 2px solid #e5e7eb; font-weight: 700; background: #f9fafb; }
            .footer { margin-top: 40px; font-size: 11px; color: #999; text-align: center; }
            @media print {
              body { padding: 20px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Payroll Report</h1>
          <p class="subtitle">Generated on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

          <div class="stats">
            <div class="stat-card">
              <div class="stat-label">Total Payroll</div>
              <div class="stat-value">$${totalPayroll.toLocaleString()}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Average Salary</div>
              <div class="stat-value">$${avgSalary.toLocaleString()}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Active Employees</div>
              <div class="stat-value">${activeEmployees.length}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Employee</th>
                <th>Department</th>
                <th>Salary</th>
              </tr>
            </thead>
            <tbody>
              ${activeEmployees.map((emp, i) => `
                <tr>
                  <td style="color:#999">${i + 1}</td>
                  <td>${emp.fullName}</td>
                  <td style="color:#555">${emp.department.name}</td>
                  <td>$${emp.salary.toLocaleString()}</td>
                </tr>
              `).join("")}
              <tr class="footer-row">
                <td colspan="3">Total Payroll</td>
                <td>$${totalPayroll.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">This report is auto-generated and is for internal use only.</div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
    };
};
