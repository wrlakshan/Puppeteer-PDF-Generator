const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const puppeteer = require("puppeteer");
const chromium = require("@sparticuz/chromium");
const fetch = require("node-fetch");
const fs = require("fs").promises;
const path = require("path");

const s3Client = new S3Client({ region: process.env.REGION });
const DESTINATION_BUCKET = process.env.BUCKET_NAME;

const generatePDF = async () => {
  console.log("Starting PDF generation process...");

  let browser;
  try {
    console.log("Launching browser...");
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });
    const page = await browser.newPage();

    console.log("Downloading Chart.js...");
    const chartJsResponse = await fetch("https://cdn.jsdelivr.net/npm/chart.js");
    const chartJsContent = await chartJsResponse.text();

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

    console.log("Writing HTML content to temporary file...");
    await fs.writeFile("/tmp/temp.html", htmlContent);

    console.log("Navigating to the HTML file...");
    await page.goto(`file://${path.resolve("/tmp/temp.html")}`, {
      waitUntil: "networkidle0",
      timeout: 60000, // Increase timeout to 60 seconds
    });

    console.log("Waiting for chart to render...");
    await page.waitForFunction(
      () => document.getElementById("chartRendered").textContent === "true",
      { timeout: 60000 } // Increase timeout to 60 seconds
    );

    console.log("Chart rendered successfully. Generating PDF...");

    const pdf = await page.pdf({ format: "A4" });

    // Upload PDF to S3
    const pdfName = "test.pdf";
    const uploadParams = {
      Bucket: DESTINATION_BUCKET,
      Key: `pdf/${pdfName}`,
      Body: pdf,
      ContentType: "application/pdf",
    };
    await s3Client.send(new PutObjectCommand(uploadParams));

    // Generate signed URL from S3 for public reads
    const command = new GetObjectCommand({
      Bucket: DESTINATION_BUCKET,
      Key: `pdf/${pdfName}`,
    });
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 * 60 * 24 * 7 }); // 7 days
    console.log("signedUrl.", signedUrl);
    return {
      statusCode: 200,
      body: JSON.stringify({ signedUrl }),
    };
  } catch (error) {
    console.error("Error generating PDF:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: `Internal Server Error: ${error.message}` }),
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

exports.handler = generatePDF;
