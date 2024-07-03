const { TrackingUtil, LoggerService } = require("ebutil");
const puppeteer = require("puppeteer");
const chromium = require("@sparticuz/chromium");
const { PutObjectCommand, GetObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const fetch = require("node-fetch");

// Initialize the S3 client
const s3Client = new S3Client({ region: process.env.REGION });

// Environment variables
const DESTINATION_BUCKET = process.env.BUCKET_NAME;

// ---------------   LOG CONFIG   ----------------
const logLevel = process.env.LOGLEVEL ? process.env.LOGLEVEL : "DEBUG";
const logger = new LoggerService({
  name: "[caas-bi]:pdfFormatterStepFunction",
  level: logLevel,
});
// ---------------   LOG CONFIG END   ---------------

/**
 * Converts HTML content to PDF and uploads it to S3
 * @param {Object} data - The report data to be converted to PDF
 * @returns {Promise<string>} - The key of the uploaded PDF file
 */
const generateReportAndUploadToS3 = async (data) => {
  const methodName = "generateReportAndUploadToS3";
  logger.debug(methodName, "data ", { data });

  try {
    // Fetch Chart.js content from the CDN
    const chartJsResponse = await fetch("https://cdn.jsdelivr.net/npm/chart.js");
    const chartJsContent = await chartJsResponse.text();

    // HTML content with inline Chart.js and multiple charts
    const htmlContent = `
        <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Comprehensive Sales Analysis Report - 2024</title>
        <script>${chartJsContent}</script>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
          .page { page-break-after: always; }
          h1 { color: #2c3e50; border-bottom: 2px solid #2c3e50; padding-bottom: 10px; }
          h2 { color: #34495e; }
          .chart-container { width: 100%; max-width: 800px; margin: 20px auto; }
          table { border-collapse: collapse; width: 100%; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .kpi-container { display: flex; justify-content: space-around; margin: 20px 0; }
          .kpi-item { text-align: center; background-color: #ecf0f1; padding: 15px; border-radius: 8px; }
          .kpi-value { font-size: 24px; font-weight: bold; color: #2980b9; }
          .kpi-label { font-size: 14px; color: #7f8c8d; }
        </style>
      </head>
      <body>
        <div class="page">
          <h1>Comprehensive Sales Analysis Report - 2024</h1>
          
          <div class="kpi-container">
            <div class="kpi-item">
              <div class="kpi-value">$1,190,000</div>
              <div class="kpi-label">Total Revenue</div>
            </div>
            <div class="kpi-item">
              <div class="kpi-value">+15.2%</div>
              <div class="kpi-label">YoY Growth</div>
            </div>
            <div class="kpi-item">
              <div class="kpi-value">4.6</div>
              <div class="kpi-label">Avg. Customer Satisfaction</div>
            </div>
          </div>

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
              <th>Top Performing Product</th>
            </tr>
            <tr>
              <td>Q1</td>
              <td>250,000</td>
              <td>+5.2%</td>
              <td>Premium Widget</td>
            </tr>
            <tr>
              <td>Q2</td>
              <td>310,000</td>
              <td>+24.0%</td>
              <td>Deluxe Gadget</td>
            </tr>
            <tr>
              <td>Q3</td>
              <td>280,000</td>
              <td>-9.7%</td>
              <td>Super Gizmo</td>
            </tr>
            <tr>
              <td>Q4</td>
              <td>350,000</td>
              <td>+25.0%</td>
              <td>Mega Tool</td>
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
              <th>Profit Margin (%)</th>
            </tr>
            <tr>
              <td>1</td>
              <td>Premium Widget</td>
              <td>5,200</td>
              <td>260,000</td>
              <td>35%</td>
            </tr>
            <tr>
              <td>2</td>
              <td>Deluxe Gadget</td>
              <td>4,800</td>
              <td>216,000</td>
              <td>30%</td>
            </tr>
            <tr>
              <td>3</td>
              <td>Super Gizmo</td>
              <td>3,500</td>
              <td>175,000</td>
              <td>28%</td>
            </tr>
            <tr>
              <td>4</td>
              <td>Mega Tool</td>
              <td>3,200</td>
              <td>128,000</td>
              <td>25%</td>
            </tr>
            <tr>
              <td>5</td>
              <td>Ultra Device</td>
              <td>2,900</td>
              <td>116,000</td>
              <td>22%</td>
            </tr>
          </table>
        </div>

        <div class="page">
          <h2>7. Sales Team Performance</h2>
          <div class="chart-container">
            <canvas id="salesTeamChart"></canvas>
          </div>

          <h2>8. Customer Acquisition Cost vs Lifetime Value</h2>
          <div class="chart-container">
            <canvas id="cacLtvChart"></canvas>
          </div>

          <h2>9. Market Share Analysis</h2>
          <div class="chart-container">
            <canvas id="marketShareChart"></canvas>
          </div>
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

            // 7. Sales Team Performance
            new Chart(document.getElementById('salesTeamChart'), {
              type: 'radar',
              data: {
                labels: ['Leads Generated', 'Conversion Rate', 'Average Deal Size', 'Customer Retention', 'Upselling'],
                datasets: [{
                  label: 'Team A',
                  data: [80, 90, 70, 85, 75],
                  fill: true,
                  backgroundColor: 'rgba(255, 99, 132, 0.2)',
                  borderColor: 'rgb(255, 99, 132)',
                  pointBackgroundColor: 'rgb(255, 99, 132)',
                  pointBorderColor: '#fff',
                  pointHoverBackgroundColor: '#fff',
                  pointHoverBorderColor: 'rgb(255, 99, 132)'
                }, {
                  label: 'Team B',
                  data: [70, 85, 75, 80, 90],
                  fill: true,
                  backgroundColor: 'rgba(54, 162, 235, 0.2)',
                  borderColor: 'rgb(54, 162, 235)',
                  pointBackgroundColor: 'rgb(54, 162, 235)',
                  pointBorderColor: '#fff',
                  pointHoverBackgroundColor: '#fff',
                  pointHoverBorderColor: 'rgb(54, 162, 235)'
                }]
              },
              options: {
                elements: {
                  line: {
                    borderWidth: 3
                  }
                }
              }
            });

            // 8. Customer Acquisition Cost vs Lifetime Value
            new Chart(document.getElementById('cacLtvChart'), {
              type: 'bar',
              data: {
                labels: ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books'],
                datasets: [{
                  label: 'CAC ($)',
                  data: [50, 30, 40, 35, 25],
                  backgroundColor: 'rgba(255, 99, 132, 0.8)'
                }, {
                  label: 'LTV ($)',
                  data: [250, 180, 200, 175, 125],
                  backgroundColor: 'rgba(75, 192, 192, 0.8)'
                }]
              },
              options: {
                responsive: true,
                plugins: {
                  title: {
                    display: true,
                    text: 'CAC vs LTV by Product Category'
                  }
                },
                scales: {
                  x: {
                    stacked: true,
                  },
                  y: {
                    stacked: true
                  }
                }
              }
            });

            // 9. Market Share Analysis
            new Chart(document.getElementById('marketShareChart'), {
              type: 'doughnut',
              data: {
                labels: ['Our Company', 'Competitor A', 'Competitor B', 'Competitor C', 'Others'],
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
                    text: 'Market Share Analysis'
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

    // Generate PDF from the HTML content
    const pdfBuffer = await createPDFFromHTML(htmlContent);
    logger.debug(methodName, "pdfBuffer", { pdfBuffer });

    // Define the S3 file key
    const fileKey = `test_file.pdf`;
    logger.debug(methodName, "fileKey", { fileKey });

    // Upload the PDF to S3
    await uploadFileToS3(DESTINATION_BUCKET, fileKey, pdfBuffer, "application/pdf");
    return fileKey;
  } catch (err) {
    logger.debug(methodName, "generateReportAndUploadToS3 Err>>", err);
    throw err;
  }
};

/**
 * Generates a PDF from HTML content
 * @param {string} htmlContent - The HTML content to convert to PDF
 * @returns {Promise<Buffer>} - The generated PDF as a buffer
 */
async function createPDFFromHTML(htmlContent) {
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, {
    waitUntil: "networkidle0",
    timeout: 60000, // 60 seconds timeout
  }); // Set the HTML content

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: {
      top: "20px",
      right: "20px",
      bottom: "20px",
      left: "20px",
    },
  });
  await browser.close();
  return pdfBuffer;
}

/**
 * Uploads data to S3
 * @param {string} bucketName - The name of the S3 bucket
 * @param {string} fileKey - The key (path) of the file in S3
 * @param {Buffer} data - The data to upload
 * @param {string} contentType - The content type of the data
 */
async function uploadFileToS3(bucketName, fileKey, data, contentType) {
  const methodName = "uploadFileToS3";
  const params = {
    Bucket: bucketName,
    Key: fileKey,
    Body: data,
    ContentType: contentType,
  };

  try {
    const command = new PutObjectCommand(params);
    const result = await s3Client.send(command);
    logger.debug(methodName, "[uploadFileToS3] Data Uploaded successfully", {
      data: result,
    });
  } catch (error) {
    logger.error(methodName, "[uploadFileToS3] Data Upload failed", {
      error: error.stack,
    });
  }
}

/**
 * Lambda handler function
 * @param {Object} event - The event triggering the Lambda
 * @returns {Object} - The HTTP response
 */
exports.handler = async (event) => {
  const methodName = "handler";
  let tracker = TrackingUtil.getTracker({ event });
  logger.setTracker(tracker);
  logger.info(methodName, `${methodName} function called.`, logger.isDebugEnabled() ? { event } : {});

  try {
    // const body = JSON.parse(event.body);
    let reportsResponse = await generateReportAndUploadToS3("test");
    // Generate signed URL from S3 for public reads
    const command = new GetObjectCommand({
      Bucket: DESTINATION_BUCKET,
      Key: `${reportsResponse}`,
    });
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 * 60 * 24 * 7 }); // 7 days

    return {
      statusCode: 200,
      // Uncomment below to enable CORS requests
      // headers: {
      //   "Access-Control-Allow-Origin": "*",
      //   "Access-Control-Allow-Headers": "*"
      // },
      body: JSON.stringify({ signedUrl }),
    };
  } catch (err) {
    logger.error(methodName, "ERROR", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
