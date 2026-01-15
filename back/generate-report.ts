import ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';

interface AssertionResult {
    title: string;
    status: 'passed' | 'failed' | 'skipped';
    duration?: number;
    failureMessages: string[];
}

interface TestFileResult {
    name: string;
    assertionResults: AssertionResult[];
}

interface VitestOutput {
    testResults: TestFileResult[];
}

async function generateExcelReport() {
    const inputPath = path.resolve('test-output.json');
    const outputPath = path.resolve('EasyBooking_Test_Report.xlsx');

    // Check if input file exists
    if (!fs.existsSync(inputPath)) {
        console.error('❌ Input file test-output.json not found. Please run tests first!');
        process.exit(1);
    }

    // Parse JSON data
    const rawData = fs.readFileSync(inputPath, 'utf-8');
    const testData: VitestOutput = JSON.parse(rawData);

    // Create Workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Test Report');

    // Define columns
    worksheet.columns = [
        { header: 'File / Suite', key: 'suite', width: 30 },
        { header: 'Cas de tests', key: 'title', width: 50 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Duration (ms)', key: 'duration', width: 15 },
        { header: 'Error Details', key: 'error', width: 50 },
    ];

    // Style for Header
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
    };

    // Handle data
    testData.testResults.forEach((file) => {
        const suiteName = path.basename(file.name);

        file.assertionResults.forEach((test) => {
            const row = worksheet.addRow({
                suite: suiteName,
                title: test.title,
                status: test.status.toUpperCase(),
                duration: test.duration.toFixed(2) || 0,
                error: test.failureMessages ? test.failureMessages.join('\n') : '',
            });

            // Conditional styling based on status
            const statusCell = row.getCell('status');
            if (test.status === 'passed') {
                statusCell.font = { color: { argb: 'FF006100' }, bold: true }; // Dark green text
                statusCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFC6EFCE' }, // Green background
                };
            } else if (test.status === 'failed') {
                statusCell.font = { color: { argb: 'FF9C0006' }, bold: true }; // Dark red text
                statusCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFFC7CE' }, // Red background
                };
            }
        });
    });

    // Save workbook
    await workbook.xlsx.writeFile(outputPath);
    console.log(`✅ Excel report generated successfully: ${outputPath}`);
}

generateExcelReport().catch((err) => {
    console.error('❌ Error generating report:', err);
    process.exit(1);
});