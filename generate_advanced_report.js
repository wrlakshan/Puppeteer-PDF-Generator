const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');

async function generatePDF() {
  console.log('Starting PDF generation process...');
  
  let browser;
  try {
    // Download Chart.js locally
    console.log('Downloading Chart.js...');
    const chartJsResponse = await fetch('https://cdn.jsdelivr.net/npm/chart.js');
    const chartJsContent = await chartJsResponse.text();
    await fs.writeFile('chart.js', chartJsContent);
    console.log('Chart.js downloaded successfully.');

    // HTML content with inline Chart.js and multiple charts
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Advanced Sales Report</title>
        <script>${chartJsContent}</script>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .page { page-break-after: always; }
          h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
          h2 { color: #666; }
          .chart-container { width: 100%; max-width: 800px; margin: 20px auto; }
          table { border-collapse: collapse; width: 100%; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
        </style>
      </head>
      <body>
        <div class="page">
          <h1>Advanced Sales Report - 2024</h1>
          
          <h2>1. Monthly Sales Overview</h2>
          <div class="chart-container">
            <canvas id="monthlySalesChart"></canvas>
          </div>
          
          <h2>2. Product Category Performance</h2>
          <div class="chart-container">
            <canvas id="categoryPieChart"></canvas>
          </div>

          <h2>3. Quarterly Sales Data</h2>
          <table>
            <tr>
              <th>Quarter</th>
              <th>Total Sales ($)</th>
              <th>Growth (%)</th>
            </tr>
            <tr>
              <td>Q1</td>
              <td>250,000</td>
              <td>+5.2%</td>
            </tr>
            <tr>
              <td>Q2</td>
              <td>310,000</td>
              <td>+24.0%</td>
            </tr>
            <tr>
              <td>Q3</td>
              <td>280,000</td>
              <td>-9.7%</td>
            </tr>
            <tr>
              <td>Q4</td>
              <td>350,000</td>
              <td>+25.0%</td>
            </tr>
          </table>
        </div>

        <div class="page">
          <h2>4. Sales by Region</h2>
          <div class="chart-container">
            <canvas id="regionBarChart"></canvas>
          </div>

          <h2>5. Customer Satisfaction Trends</h2>
          <div class="chart-container">
            <canvas id="satisfactionLineChart"></canvas>
          </div>

          <h2>6. Top 5 Products</h2>
          <table>
            <tr>
              <th>Rank</th>
              <th>Product Name</th>
              <th>Units Sold</th>
              <th>Revenue ($)</th>
            </tr>
            <tr>
              <td>1</td>
              <td>Premium Widget</td>
              <td>5,200</td>
              <td>260,000</td>
            </tr>
            <tr>
              <td>2</td>
              <td>Deluxe Gadget</td>
              <td>4,800</td>
              <td>216,000</td>
            </tr>
            <tr>
              <td>3</td>
              <td>Super Gizmo</td>
              <td>3,500</td>
              <td>175,000</td>
            </tr>
            <tr>
              <td>4</td>
              <td>Mega Tool</td>
              <td>3,200</td>
              <td>128,000</td>
            </tr>
            <tr>
              <td>5</td>
              <td>Ultra Device</td>
              <td>2,900</td>
              <td>116,000</td>
            </tr>
          </table>
        </div>

        <script>
          document.addEventListener('DOMContentLoaded', function() {
            // 1. Monthly Sales Chart
            new Chart(document.getElementById('monthlySalesChart'), {
              type: 'line',
              data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                  label: 'Sales ($)',
                  data: [65000, 59000, 80000, 81000, 56000, 55000, 40000, 65000, 59000, 80000, 81000, 56000],
                  borderColor: 'rgb(75, 192, 192)',
                  tension: 0.1
                }]
              },
              options: {
                responsive: true,
                plugins: {
                  title: {
                    display: true,
                    text: 'Monthly Sales Trend'
                  }
                }
              }
            });

            // 2. Product Category Pie Chart
            new Chart(document.getElementById('categoryPieChart'), {
              type: 'pie',
              data: {
                labels: ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books'],
                datasets: [{
                  data: [30, 25, 20, 15, 10],
                  backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 206, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(153, 102, 255, 0.8)'
                  ]
                }]
              },
              options: {
                responsive: true,
                plugins: {
                  title: {
                    display: true,
                    text: 'Sales by Product Category'
                  }
                }
              }
            });

            // 4. Sales by Region Bar Chart
            new Chart(document.getElementById('regionBarChart'), {
              type: 'bar',
              data: {
                labels: ['North', 'South', 'East', 'West', 'Central'],
                datasets: [{
                  label: 'Sales ($)',
                  data: [250000, 180000, 200000, 220000, 150000],
                  backgroundColor: 'rgba(75, 192, 192, 0.8)'
                }]
              },
              options: {
                responsive: true,
                plugins: {
                  title: {
                    display: true,
                    text: 'Sales by Region'
                  }
                }
              }
            });

            // 5. Customer Satisfaction Line Chart
            new Chart(document.getElementById('satisfactionLineChart'), {
              type: 'line',
              data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                  label: 'Satisfaction Score',
                  data: [4.2, 4.3, 4.1, 4.4, 4.5, 4.3, 4.6, 4.7, 4.5, 4.8, 4.7, 4.9],
                  borderColor: 'rgb(255, 99, 132)',
                  tension: 0.1
                }]
              },
              options: {
                responsive: true,
                plugins: {
                  title: {
                    display: true,
                    text: 'Customer Satisfaction Trend'
                  }
                },
                scales: {
                  y: {
                    min: 3,
                    max: 5
                  }
                }
              }
            });

            document.getElementById('chartsRendered').textContent = 'true';
          });
        </script>
        <div id="chartsRendered" style="display:none;">false</div>
      </body>
      </html>
    `;

    console.log('Writing HTML content to temporary file...');
    await fs.writeFile('temp.html', htmlContent);

    console.log('Launching browser...');
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    console.log('Navigating to the HTML file...');
    await page.goto(`file://${path.resolve('temp.html')}`, { 
      waitUntil: 'networkidle0',
      timeout: 60000 // 60 seconds timeout
    });

    console.log('Waiting for charts to render...');
    await page.waitForFunction(
      () => document.getElementById('chartsRendered').textContent === 'true',
      { timeout: 60000 } // 60 seconds timeout
    );

    console.log('Charts rendered successfully. Generating PDF...');
    await page.pdf({ 
      path: 'advanced_report.pdf', 
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    console.log('PDF generated successfully!');
  } catch (error) {
    console.error('Error occurred:', error);
    if (error.name === 'TimeoutError') {
      console.log('Timeout occurred. Current page content:');
      if (browser) {
        const page = (await browser.pages())[0];
        console.log(await page.content());
      }
    }
    throw error;
  } finally {
    if (browser) {
      console.log('Closing browser...');
      await browser.close();
    }
    console.log('Cleaning up temporary files...');
    await fs.unlink('temp.html').catch(console.error);
    await fs.unlink('chart.js').catch(console.error);
  }
}

generatePDF()
  .then(() => console.log('Process completed successfully.'))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });