// Google Apps Script for Eco-Pots Student Registration
// Deploy as Web App with "Execute as me" and "Anyone can access" permissions

// Configuration
const CONFIG = {
  SPREADSHEET_ID: 'https://docs.google.com/spreadsheets/d/1N3kwsrMPHSJo-9K7IgWbtLPwRxLZBBAL_O4y7KNHvtg/edit?gid=0#gid=0', // Replace with actual spreadsheet ID
  SHEET_NAME: 'EcoPots_Student_Registrations',
  MAX_SUBMISSIONS_PER_MINUTE: 5,
  LOG_SHEET_NAME: 'Submission_Log'
};

// Spreadsheet and cache initialization
const SPREADSHEET = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
const SHEET = SPREADSHEET.getSheetByName(CONFIG.SHEET_NAME) || SPREADSHEET.insertSheet(CONFIG.SHEET_NAME);
const LOG_SHEET = SPREADSHEET.getSheetByName(CONFIG.LOG_SHEET_NAME) || SPREADSHEET.insertSheet(CONFIG.LOG_SHEET_NAME);
const CACHE = CacheService.getScriptCache();

// Main doPost function - handles all incoming requests
function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;

    // Log incoming request
    logRequest(requestData, e);

    // Route to appropriate handler
    switch (action) {
      case 'submitRegistration':
        return handleRegistration(requestData, e);
      case 'ping':
        return handlePing();
      case 'getStats':
        return handleGetStats();
      case 'checkDuplicate':
        return handleCheckDuplicate(requestData);
      default:
        return createErrorResponse('Invalid action', 400);
    }

  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return createErrorResponse('Internal server error', 500);
  }
}

// Handle registration submissions
function handleRegistration(requestData, event) {
  try {
    const data = requestData.data;

    // Validate required fields
    const validationResult = validateRegistrationData(data);
    if (!validationResult.valid) {
      return createErrorResponse(validationResult.message, 400);
    }

    // Rate limiting check
    const rateLimitResult = checkRateLimit(event);
    if (!rateLimitResult.allowed) {
      return createErrorResponse('Rate limit exceeded. Please try again later.', 429);
    }

    // Check for duplicate registrations
    const duplicateCheck = checkForDuplicate(data.rollNumber, data.email);
    if (duplicateCheck.isDuplicate) {
      return createErrorResponse('A registration with this roll number or email already exists.', 409);
    }

    // Append data to spreadsheet
    const rowResult = appendRegistrationRow(data);

    if (rowResult.success) {
      // Send confirmation email (optional)
      try {
        sendConfirmationEmail(data);
      } catch (emailError) {
        Logger.log('Email sending failed: ' + emailError.toString());
        // Don't fail the submission if email fails
      }

      return createSuccessResponse({
        registrationId: data.registrationId,
        rowNumber: rowResult.rowNumber,
        timestamp: data.timestamp,
        message: 'Registration submitted successfully'
      });
    } else {
      return createErrorResponse('Failed to save registration data', 500);
    }

  } catch (error) {
    Logger.log('Error in handleRegistration: ' + error.toString());
    return createErrorResponse('Registration processing failed', 500);
  }
}

// Validate registration data
function validateRegistrationData(data) {
  const requiredFields = [
    'fullName',
    'rollNumber',
    'email',
    'phone',
    'department',
    'yearOfStudy',
    'selectedMaterial',
    'craftDescription',
    'registrationId',
    'timestamp'
  ];

  // Check required fields
  for (const field of requiredFields) {
    if (!data[field] || data[field].toString().trim() === '') {
      return {
        valid: false,
        message: `Missing required field: ${field}`
      };
    }
  }

  // Validate email format
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(data.email)) {
    return {
      valid: false,
      message: 'Invalid email address'
    };
  }

  // Validate phone number (10 digits)
  const phonePattern = /^[0-9]{10}$/;
  if (!phonePattern.test(data.phone)) {
    return {
      valid: false,
      message: 'Invalid phone number'
    };
  }

  // Validate department (text field - check basic requirements)
  if (data.department.length < 2 || data.department.length > 50) {
    return {
      valid: false,
      message: 'Department name must be between 2 and 50 characters'
    };
  }

  // Validate year of study
  const validYears = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  if (!validYears.includes(data.yearOfStudy)) {
    return {
      valid: false,
      message: 'Invalid year of study'
    };
  }

  // Validate material
  const validMaterials = ['Plastic Bottles', 'Ropes & Strings', 'Old Shoes', 'Glass Jars', 'Metal Cans', 'Other Materials'];
  if (!validMaterials.includes(data.selectedMaterial)) {
    return {
      valid: false,
      message: 'Invalid selected material'
    };
  }

  // Validate description length
  if (data.craftDescription.length < 50 || data.craftDescription.length > 500) {
    return {
      valid: false,
      message: 'Craft description must be between 50 and 500 characters'
    };
  }

  return { valid: true };
}

// Check rate limiting
function checkRateLimit(event) {
  const clientIp = event.parameter.ip || event.remoteAddress || 'unknown';
  const cacheKey = `rate_limit_${clientIp}`;
  const currentCount = parseInt(CACHE.get(cacheKey) || '0');

  if (currentCount >= CONFIG.MAX_SUBMISSIONS_PER_MINUTE) {
    return {
      allowed: false,
      count: currentCount,
      resetTime: 60
    };
  }

  // Increment counter
  CACHE.put(cacheKey, (currentCount + 1).toString(), 60); // 60 second expiry

  return {
    allowed: true,
    count: currentCount + 1
  };
}

// Check for duplicate registrations
function checkForDuplicate(rollNumber, email) {
  try {
    const dataRange = SHEET.getDataRange();
    const values = dataRange.getValues();
    const headers = values[0];

    // Find column indices
    const rollNumberIndex = headers.indexOf('Roll Number');
    const emailIndex = headers.indexOf('Email Address');

    if (rollNumberIndex === -1 || emailIndex === -1) {
      // Headers not set up yet
      return { isDuplicate: false };
    }

    // Check for duplicates
    for (let i = 1; i < values.length; i++) {
      const existingRollNumber = values[i][rollNumberIndex];
      const existingEmail = values[i][emailIndex];

      if (existingRollNumber === rollNumber || existingEmail === email) {
        return {
          isDuplicate: true,
          existingRollNumber: existingRollNumber,
          existingEmail: existingEmail,
          rowNumber: i + 1
        };
      }
    }

    return { isDuplicate: false };

  } catch (error) {
    Logger.log('Error checking duplicates: ' + error.toString());
    return { isDuplicate: false }; // Allow submission if check fails
  }
}

// Append registration data to spreadsheet
function appendRegistrationRow(data) {
  try {
    // Ensure headers exist
    ensureHeadersExist();

    // Prepare row data in the correct order
    const rowData = [
      data.timestamp || new Date().toISOString(),
      data.fullName || '',
      data.rollNumber || '',
      data.email || '',
      data.department || '',
      data.phone || '',
      data.yearOfStudy || '',
      data.selectedMaterial || '',
      data.craftDescription || '',
      data.registrationId || '',
      'New', // Status
      data.ipAddress || event.remoteAddress || '',
      data.userAgent || '',
      data.submissionSource || '',
      new Date().toISOString() // Processing timestamp
    ];

    // Append row to sheet
    const rowNumber = SHEET.getLastRow() + 1;
    SHEET.appendRow(rowData);

    // Format the timestamp column
    const timestampCell = SHEET.getRange(rowNumber, 1);
    timestampCell.setNumberFormat('yyyy-mm-dd hh:mm:ss');

    // Add conditional formatting for status
    const statusCell = SHEET.getRange(rowNumber, 11);
    statusCell.setFontColor('#2E7D32');

    Logger.log(`Registration added at row ${rowNumber}: ${data.registrationId}`);

    return {
      success: true,
      rowNumber: rowNumber
    };

  } catch (error) {
    Logger.log('Error appending row: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

// Ensure spreadsheet headers exist
function ensureHeadersExist() {
  const headers = [
    'Timestamp',
    'Full Name',
    'Roll Number',
    'Email Address',
    'Department',
    'Phone Number',
    'Year of Study',
    'Selected Material',
    'Craft Description',
    'Registration ID',
    'Status',
    'IP Address',
    'User Agent',
    'Submission Source',
    'Processing Timestamp'
  ];

  const firstRow = SHEET.getRange(1, 1, 1, headers.length);
  const existingValues = firstRow.getValues()[0];

  // Check if headers exist
  if (existingValues[0] !== 'Timestamp') {
    SHEET.insertRowBefore(1);
    SHEET.getRange(1, 1, 1, headers.length).setValues([headers]);

    // Format header row
    firstRow.setFontWeight('bold')
           .setBackground('#E8F5E8')
           .setHorizontalAlignment('center');

    // Auto-resize columns
    SHEET.autoResizeColumn(1); // Timestamp
    SHEET.autoResizeColumn(2); // Full Name
    SHEET.autoResizeColumn(3); // Roll Number
    SHEET.autoResizeColumn(4); // Email
    SHEET.setColumnWidth(5, 120); // Department
    SHEET.setColumnWidth(6, 120); // Phone
    SHEET.setColumnWidth(7, 100); // Year
    SHEET.setColumnWidth(8, 150); // Material
    SHEET.setColumnWidth(9, 300); // Description
    SHEET.setColumnWidth(10, 150); // Registration ID
    SHEET.setColumnWidth(11, 100); // Status
  }
}

// Send confirmation email (optional)
function sendConfirmationEmail(data) {
  try {
    const subject = 'Eco-Pots Registration Confirmation - ' + data.registrationId;
    const body = `
Dear ${data.fullName},

Thank you for registering for the Eco-Pots initiative!

Registration Details:
- Registration ID: ${data.registrationId}
- Name: ${data.fullName}
- Roll Number: ${data.rollNumber}
- Department: ${data.department}, ${data.yearOfStudy}
- Selected Material: ${data.selectedMaterial}

Your craft idea: "${data.craftDescription}"

Next Steps:
1. Join our WhatsApp community: [WhatsApp Link]
2. Prepare your selected material
3. Wait for sapling distribution announcement
4. Transform your material into a beautiful eco-pot!

Thank you for contributing to nature conservation!

Best regards,
Eco-Pots Initiative Team
    `.trim();

    MailApp.sendEmail({
      to: data.email,
      subject: subject,
      body: body
    });

    Logger.log(`Confirmation email sent to: ${data.email}`);

  } catch (error) {
    Logger.log('Error sending confirmation email: ' + error.toString());
    throw error;
  }
}

// Handle ping requests
function handlePing() {
  return createSuccessResponse({
    message: 'Service is available',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
}

// Handle get statistics requests
function handleGetStats() {
  try {
    const totalRows = SHEET.getLastRow() - 1; // Exclude header row
    const dataRange = SHEET.getDataRange();
    const values = dataRange.getValues();

    const stats = {
      totalRegistrations: Math.max(0, totalRows),
      lastRegistration: totalRows > 0 ? values[values.length - 1][0] : null,
      statusCounts: {},
      departmentCounts: {},
      materialCounts: {}
    };

    // Count by status, department, and material
    const statusIndex = 10; // Status column
    const departmentIndex = 4; // Department column
    const materialIndex = 7; // Material column

    for (let i = 1; i < values.length; i++) {
      const status = values[i][statusIndex];
      const department = values[i][departmentIndex];
      const material = values[i][materialIndex];

      stats.statusCounts[status] = (stats.statusCounts[status] || 0) + 1;
      stats.departmentCounts[department] = (stats.departmentCounts[department] || 0) + 1;
      stats.materialCounts[material] = (stats.materialCounts[material] || 0) + 1;
    }

    return createSuccessResponse(stats);

  } catch (error) {
    Logger.log('Error getting stats: ' + error.toString());
    return createErrorResponse('Failed to get statistics', 500);
  }
}

// Handle duplicate check requests
function handleCheckDuplicate(requestData) {
  try {
    const rollNumber = requestData.rollNumber;
    const email = requestData.email;

    if (!rollNumber && !email) {
      return createErrorResponse('Missing rollNumber or email', 400);
    }

    const duplicateCheck = checkForDuplicate(rollNumber, email);
    return createSuccessResponse(duplicateCheck);

  } catch (error) {
    Logger.log('Error checking duplicate: ' + error.toString());
    return createErrorResponse('Duplicate check failed', 500);
  }
}

// Log requests for debugging and monitoring
function logRequest(requestData, event) {
  try {
    const logData = [
      new Date().toISOString(),
      requestData.action || 'unknown',
      requestData.data?.registrationId || 'unknown',
      event.remoteAddress || 'unknown',
      JSON.stringify(requestData).substring(0, 500), // Truncate large data
      JSON.stringify(event.parameter)
    ];

    LOG_SHEET.appendRow(logData);

    // Keep only last 1000 log entries
    const lastRow = LOG_SHEET.getLastRow();
    if (lastRow > 1000) {
      LOG_SHEET.deleteRows(1, lastRow - 1000);
    }

  } catch (error) {
    Logger.log('Error logging request: ' + error.toString());
  }
}

// Utility functions for creating responses
function createSuccessResponse(data) {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    data: data,
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function createErrorResponse(message, code) {
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    error: message,
    code: code || 400,
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

// Test function - can be called from the script editor
function test() {
  const testData = {
    action: 'submitRegistration',
    data: {
      fullName: 'Test User',
      rollNumber: 'TEST001',
      email: 'test@example.com',
      phone: '1234567890',
      department: 'CSE',
      yearOfStudy: '2nd Year',
      selectedMaterial: 'Plastic Bottles',
      craftDescription: 'This is a test craft description that meets the minimum length requirement for testing purposes.',
      registrationId: 'TEST-12345',
      timestamp: new Date().toISOString()
    }
  };

  const mockEvent = {
    parameter: { ip: '127.0.0.1' },
    remoteAddress: '127.0.0.1',
    postData: {
      contents: JSON.stringify(testData)
    }
  };

  const result = doPost(mockEvent);
  Logger.log('Test result: ' + result.getContent());
}
