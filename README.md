# Form Builder Application

A **problem-solving form builder** that goes beyond traditional surveys. Built with MERN stack to create interactive assessments using three unique question types that promote active learning and critical thinking.

## 🧩 Problem-Solving Approach

Instead of boring multiple-choice questions, this application introduces:
- **Interactive categorization** for classification skills
- **Context-aware cloze tests** for comprehension
- **Reading-based assessments** for analytical thinking

## ✨ Key Features

### 🎯 Three Custom Question Types
- **Categorize**: Drag items into categories (Hardware/Software, Renewable/Non-renewable)
- **Cloze**: AI-powered fill-in-the-blanks with smart distractor generation
- **Comprehension**: Reading passages with contextual questions

### 🎨 Smart Editor
- **Live Preview**: See your form as students will
- **Resizable Sidebar**: Adjust workspace to your preference
- **JSON Import/Export**: Backup and share forms instantly
- **Image Support**: Add visuals to questions and headers

### 🤖 AI Integration
- **Auto-generate distractors** for cloze questions using Gemini AI
- **Smart validation** ensures answer keys are always included in options
- **Intelligent scoring** handles complex answer formats

### 📊 Assessment Analytics
- **Instant scoring** with detailed breakdowns
- **Email reports** with performance analysis
- **CSV export** for further analysis
- **Response management** with time tracking

### 🔧 Developer-Friendly
- **Clean API design** with RESTful endpoints
- **Modular architecture** for easy customization
- **Responsive design** works on all devices
- **MongoDB integration** with proper data validation

## 🚀 Quick Start

### Backend Setup
```bash
cd backend
npm install
```

Create `.env`:
```env
MONGODB_URI=mongodb+srv://your-connection-string
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

```bash
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Access at `http://localhost:5173`

## 🔄 Workflow

1. **Create** → Design forms with drag-and-drop questions
2. **Preview** → Test in real-time with the live preview
3. **Share** → Export JSON or share direct links
4. **Analyze** → Review responses and download reports

## 🛠 Tech Stack

**Frontend**: React 18, Tailwind CSS, React Beautiful DnD  
**Backend**: Express.js, MongoDB, Mongoose  
**AI**: Google Gemini API for content generation  
**Features**: File uploads, Email notifications, CSV export

## 💡 Why This Approach?

Traditional form builders create passive experiences. This application promotes **active learning** through:
- Interactive drag-and-drop interfaces
- Context-rich comprehension tasks  
- AI-assisted content generation
- Immediate feedback and scoring

Perfect for educators, trainers, and assessment professionals who want to move beyond basic surveys.

## 📋 API Endpoints

```
Forms: GET|POST|PUT|DELETE /api/forms
Responses: POST|GET /api/forms/:id/responses  
Utils: POST /api/upload, /api/generate-distractors
```

## 🎓 Example Use Cases

- **Educational Assessments**: Computer basics, science concepts
- **Training Evaluations**: Employee skill assessments  
- **Comprehension Tests**: Reading and analysis skills
- **Classification Tasks**: Category-based learning

Built with modern web technologies to solve real assessment challenges.
