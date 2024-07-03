const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

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

    // HTML content with inline Chart.js
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PDF Report</title>
        <script>${chartJsContent}</script>
        <style>
          body { font-family: Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>Sales Report</h1>
        
        <h2>Monthly Sales Chart</h2>
        <canvas id="salesChart" width="400" height="200"></canvas>
        
        <h2>Sales Data Table</h2>
        <table>
          <tr>
            <th>Month</th>
            <th>Sales ($)</th>
          </tr>
          <tr><td>January</td><td>10000</td></tr>
          <tr><td>February</td><td>15000</td></tr>
          <tr><td>March</td><td>20000</td></tr>
          <tr><td>April</td><td>18000</td></tr>
        </table>

        <script>
          document.addEventListener('DOMContentLoaded', function() {
            const ctx = document.getElementById('salesChart').getContext('2d');
            new Chart(ctx, {
              type: 'bar',
              data: {
                labels: ['January', 'February', 'March', 'April'],
                datasets: [{
                  label: 'Sales ($)',
                  data: [10000, 15000, 20000, 18000],
                  backgroundColor: 'rgba(75, 192, 192, 0.6)'
                }]
              },
              options: {
                scales: {
                  y: {
                    beginAtZero: true
                  }
                },
                animation: false,
                responsive: false
              }
            });
            document.getElementById('chartRendered').textContent = 'true';
          });
        </script>
        <div id="chartRendered" style="display:none;">false</div>
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
      timeout: 60000 // Increase timeout to 60 seconds
    });

    console.log('Waiting for chart to render...');
    await page.waitForFunction(
      () => document.getElementById('chartRendered').textContent === 'true',
      { timeout: 60000 } // Increase timeout to 60 seconds
    );

    console.log('Chart rendered successfully. Generating PDF...');
    await page.pdf({ path: 'output.pdf', format: 'A4' });

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