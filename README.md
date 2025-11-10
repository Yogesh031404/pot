# Eco-Pots Student Registration Web App

A sustainable initiative web application where students can register to transform waste materials into plant pots for classroom saplings. This is not a competition but a collaborative effort toward environmental conservation.

## 🌱 Project Overview

Eco-Pots enables students to:
- Select waste materials available to them
- Register their creative ideas for transforming materials into plant pots
- Join a community of eco-conscious students
- Contribute to making classrooms greener

## 📁 Project Structure

```
pot/
├── index.html              # Home page with introduction
├── materials.html          # Material selection page
├── register.html           # Registration form page
├── thanks.html             # Thank you and preview page
├── css/
│   ├── style.css          # Main stylesheet
│   └── responsive.css     # Mobile-responsive styles
├── js/
│   ├── app.js             # Main application logic
│   ├── form-validator.js  # Form validation functions
│   └── google-sheets.js   # Google Sheets integration
├── images/                # Image assets (icons, photos)
├── netlify.toml           # Netlify deployment configuration
├── README.md              # This file
└── Google_Apps_Script_Code.gs  # Backend Google Apps Script
```

## 🚀 Quick Start

### 1. Google Sheets Setup

1. **Create a new Google Spreadsheet**
   - Go to [Google Sheets](https://sheets.google.com)
   - Create a new spreadsheet named "EcoPots_Student_Registrations"

2. **Set up Google Apps Script**
   - Go to [Google Apps Script](https://script.google.com)
   - Create a new project
   - Copy the contents of `Google_Apps_Script_Code.gs`
   - Replace `YOUR_SPREADSHEET_ID_HERE` with your actual spreadsheet ID
   - Deploy as Web App:
     - "Execute as me"
     - "Anyone can access"
     - Copy the web app URL

3. **Configure Spreadsheet Columns**
   The script will automatically create these columns:
   - Timestamp
   - Full Name
   - Roll Number
   - Email Address
   - Department
   - Phone Number
   - Year of Study
   - Selected Material
   - Craft Description
   - Registration ID
   - Status
   - IP Address
   - User Agent
   - Submission Source
   - Processing Timestamp

### 2. Frontend Configuration

1. **Update Google Sheets URL**
   - In `js/google-sheets.js`, update the `GOOGLE_SCRIPT_URL` with your web app URL

2. **Configure Contact Information**
   - Update WhatsApp group link in `thanks.html`
   - Update contact email in `thanks.html`

### 3. Netlify Deployment

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial Eco-Pots implementation"
   git push origin main
   ```

2. **Deploy to Netlify**
   - Connect your GitHub repository to Netlify
   - Set build command: `echo "No build required"`
   - Set publish directory: `.` (root)
   - Deploy!

3. **Set Environment Variables in Netlify**
   - `GOOGLE_SCRIPT_URL`: Your Google Apps Script web app URL
   - `SPREADSHEET_ID`: Your Google Spreadsheet ID
   - `WHATSAPP_GROUP_LINK`: WhatsApp community invite link
   - `CONTACT_EMAIL`: Project contact email address

## 📱 Features

### Page 1: Home - Nature Awareness & Introduction
- Hero section with engaging title
- Initiative overview
- Environmental impact statistics
- Student role explanation
- Call-to-action to start registration

### Page 2: Materials Selection
- Interactive material selection cards
- Material type descriptions and examples
- Visual feedback for selection
- Tips for material preparation

### Page 3: Registration Form
- Comprehensive student information collection
- Real-time form validation
- Auto-save functionality
- Character counter for descriptions
- Material pre-filled from selection

### Page 4: Thank You & Preview
- Registration summary display
- Appreciation message
- WhatsApp community join link
- Download/print registration summary
- Next steps information

## 🔧 Technical Features

### Frontend
- **Responsive Design**: Mobile-first approach with breakpoints
- **Progressive Enhancement**: Works without JavaScript
- **Form Validation**: Real-time client-side validation
- **Local Storage**: Data persistence and auto-save
- **Accessibility**: ARIA labels and keyboard navigation

### Backend Integration
- **Google Apps Script**: Serverless backend for form submissions
- **Rate Limiting**: Prevent spam submissions
- **Data Validation**: Server-side validation and sanitization
- **Error Handling**: Comprehensive error management
- **Duplicate Prevention**: Check for existing registrations

### Security
- **Input Sanitization**: Clean all user inputs
- **CORS Handling**: Proper cross-origin setup
- **Rate Limiting**: Prevent abuse
- **Data Privacy**: No sensitive data storage

## 🎨 Design System

### Colors
- **Primary Green**: #2E7D32 (Nature theme)
- **Light Green**: #4CAF50 (Success states)
- **Earth Brown**: #8D6E63 (Natural tones)
- **Clean White**: #FFFFFF (Background)
- **Dark Gray**: #424242 (Text)

### Typography
- **Font Family**: System fonts for performance
- **Font Weights**: 400 (normal), 500 (medium), 700 (bold)
- **Line Height**: 1.6 for readability

### Spacing
- **8px Grid System**: Consistent spacing throughout
- **Container Max Width**: 1200px for readability

## 📊 Google Sheets Integration

### Data Structure
The app automatically creates and manages a Google Sheet with:
- **Automatic Timestamps**: When submissions occur
- **Unique Registration IDs**: For tracking
- **Status Tracking**: New/Confirmed/Completed
- **Metadata**: IP address, user agent, etc.

### Security Features
- **Rate Limiting**: Max 5 submissions per minute per IP
- **Duplicate Detection**: Prevent multiple registrations
- **Input Validation**: Server-side data validation
- **Error Logging**: Comprehensive error tracking

## 🛠️ Customization

### Adding New Materials
1. Update `materialTypes` object in `js/app.js`
2. Add new material card in `materials.html`
3. Update validation arrays in `js/form-validator.js`
4. Add material styling in CSS if needed

### Changing Department Field
The department field is now a text input field for flexibility. Students can enter any department name.
- No predefined options needed
- Basic validation for length (2-50 characters) and allowed characters (letters, spaces, &, -, /)
- Examples: "Computer Science & Engineering", "CSE", "Mechanical Engineering", "Electronics & Communication"

### Modifying Form Fields
1. Add/remove fields in `register.html`
2. Update validation rules in `js/form-validator.js`
3. Update Google Apps Script column mapping

## 🔍 Testing

### Manual Testing Checklist
- [ ] All pages load correctly on mobile and desktop
- [ ] Material selection works and persists
- [ ] Form validation works for all fields
- [ ] Form submission succeeds and appears in Google Sheets
- [ ] Thank you page displays registration details
- [ ] WhatsApp link works correctly
- [ ] Download summary functionality works

### Test Data
Use this sample data for testing:
- **Name**: Test Student
- **Roll Number**: TEST123
- **Email**: test@example.com
- **Phone**: 1234567890
- **Department**: CSE
- **Year**: 2nd Year
- **Material**: Plastic Bottles
- **Description**: This is a test craft description that meets the minimum length requirement for testing purposes. I plan to transform plastic bottles into beautiful plant pots by cutting them properly and adding drainage holes.

## 📈 Monitoring

### Google Apps Script Logs
- Access via Google Apps Script editor
- Monitor submission success/failure rates
- Check error logs for debugging

### Netlify Analytics
- Built-in site analytics
- Form submission tracking
- Performance metrics

## 🚨 Troubleshooting

### Common Issues

**Form submission fails:**
1. Check Google Apps Script deployment settings
2. Verify spreadsheet ID is correct
3. Check web app URL is properly configured

**Materials not persisting:**
1. Check local storage is enabled in browser
2. Verify no browser extensions are blocking storage

**Mobile display issues:**
1. Test on actual mobile devices
2. Check responsive breakpoints
3. Verify touch targets are adequate

**Google Sheets integration:**
1. Ensure script is deployed as web app
2. Check "Anyone can access" permission
3. Verify spreadsheet sharing settings

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 📞 Support

For questions or issues:
- **Email**: ecopots@yourdomain.com
- **WhatsApp**: [Join our community](https://chat.whatsapp.com/example)
- **Issues**: [GitHub Issues](https://github.com/your-username/ecopots/issues)

## 🌍 Environmental Impact

Every registration represents:
- ✅ One waste item diverted from landfill
- ✅ One plant added to a classroom
- ✅ One student engaged in environmental action
- ✅ Increased awareness about sustainability

Together, we're making classrooms greener, one eco-pot at a time! 🌱