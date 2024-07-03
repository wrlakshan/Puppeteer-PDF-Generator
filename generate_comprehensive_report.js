const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');

async function generatePDF() {
  console.log('Starting PDF generation process...');
  
  let browser;
  try {
    // Download required libraries
    console.log('Downloading required libraries...');
    const chartJsResponse = await fetch('https://cdn.jsdelivr.net/npm/chart.js');
    const chartJsContent = await chartJsResponse.text();
    const mermaidResponse = await fetch('https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js');
    const mermaidContent = await mermaidResponse.text();
    await fs.writeFile('chart.js', chartJsContent);
    await fs.writeFile('mermaid.js', mermaidContent);
    console.log('Libraries downloaded successfully.');

    // HTML content with inline Chart.js, Mermaid, and multiple charts
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Comprehensive Sales Report</title>
        <script>${chartJsContent}</script>
        <script>${mermaidContent}</script>
        <script src="https://cdn.jsdelivr.net/npm/chartjs-chart-matrix@1.2.0/dist/chartjs-chart-matrix.min.js"></script>
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
          .mermaid { width: 100%; max-width: 800px; margin: 20px auto; }
          img { max-width: 100%; height: auto; display: block; margin: 20px auto; }
        </style>
      </head>
      <body>
        <div class="page">
          <h1>Comprehensive Sales Report - 2024</h1>
          <h2>1. Sales Performance Overview</h2>
          <div class="chart-container">
            <canvas id="salesOverviewChart"></canvas>
          </div>
          <h2>2. Product Category Distribution</h2>
          <div class="chart-container">
            <canvas id="categoryTreemapChart"></canvas>
          </div>
          <h2>3. Sales Process Flowchart</h2>
          <div class="mermaid">
            graph TD
              A[Lead Generation] --> B{Qualified?}
              B -->|Yes| C[Initial Contact]
              B -->|No| D[Nurture Lead]
              C --> E[Product Demo]
              E --> F{Interested?}
              F -->|Yes| G[Proposal]
              F -->|No| H[Follow-up]
              G --> I[Negotiation]
              I --> J{Closed?}
              J -->|Yes| K[Sale Complete]
              J -->|No| L[Lost Opportunity]
              H --> M[Re-engage]
              M --> F
          </div>
        </div>

        <div class="page">
          <h2>4. Customer Segmentation</h2>
          <div class="chart-container">
            <canvas id="segmentationBubbleChart"></canvas>
          </div>
          <h2>5. Sales Team Performance Heatmap</h2>
          <div class="chart-container">
            <canvas id="performanceHeatmapChart"></canvas>
          </div>
          <h2>6. Global Sales Distribution</h2>
          <img src="/api/placeholder/800/400" alt="World map showing sales distribution">
          <h2>7. Product Development Roadmap</h2>
          <div class="mermaid">
            gantt
              title Product Roadmap 2024
              dateFormat  YYYY-MM-DD
              section Research
              Market Analysis   :a1, 2024-01-01, 30d
              Competitor Study  :after a1, 20d
              section Development
              Prototype         :2024-02-15, 45d
              Testing           :2024-04-01, 30d
              section Launch
              Marketing         :2024-05-01, 30d
              Release           :2024-06-01, 5d
          </div>
        </div>

        <script>
          document.addEventListener('DOMContentLoaded', function() {
            // Initialize charts and diagrams
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

    console.log('Waiting for charts and diagrams to render...');
    await page.waitForFunction(
      () => document.getElementById('chartsRendered').textContent === 'true',
      { timeout: 60000 } // 60 seconds timeout
    );

    console.log('Content rendered successfully. Generating PDF...');
    await page.pdf({ 
      path: 'comprehensive_sales_report.pdf', 
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
