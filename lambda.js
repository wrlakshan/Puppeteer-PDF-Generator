const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const puppeteer = require("puppeteer");
const chromium = require("@sparticuz/chromium");

const s3Client = new S3Client({ region: process.env.REGION });
const DESTINATION_BUCKET = process.env.BUCKET_NAME;

const generatePDF = async () => {
  console.log("Starting PDF generation process...");

  let browser;
  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    const html = `<h1> Hi! Here is a copy of your PDF Content that you requested!</h1> <br/> <hr/> <p> fsdf </p>`;
    await page.setContent(html);

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
