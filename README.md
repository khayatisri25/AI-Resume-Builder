# AI-Resume-Builder🚀
An end-to-end AI-powered Career Assistant that builds ATS-optimized resumes, enhances content with AI, generates cover letters, analyzes job descriptions, prepares interview questions, and exports professional resumes in PDF/DOCX formats.
---
## 🛠️ Tech Stack

- **Frontend:** React.js, Vite, Tailwind CSS
- **Icons:** Lucide React
- **Backend:** Node.js (Express)

---

## ⚙️ Prerequisites

Before running this project, ensure you have the following installed on your local machine:

- **Node.js** (v18.0.0 or higher recommended)
- **npm** (comes packaged with Node.js)

---

## 🚀 Getting Started & Execution

Copy and run these commands in your terminal to clone, install, and start the application:

```bash
# 1. Clone the repository and navigate into the folder
git clone [https://github.com/khayatisri25/AI-Resume-Builder.git](https://github.com/khayatisri25/AI-Resume-Builder.git)
cd AI-Resume-Builder

# 2. Navigate to the backend (python)
cd backend
# Activate your virtual environment (windows)
.\venv\Scripts\activate
# Install python packages
pip install -r requirements.txt
# To run
python app.py

# 3. Navigate to the frontend and install packages
cd frontend
npm install

# 4. Start the local development server
npm run dev

```
### 📂 Project Structure
```text
├── backend/                  # Python backend application
│   ├── prompts/              # AI prompt templates
│   ├── services/             # Backend business logic & API services
│   ├── tests/                # Unit and integration tests
│   ├── venv/                 # Python virtual environment (ignored by Git)
│   ├── .gitignore            # Backend-specific ignore rules
│   ├── app.py                # Main backend application entry point
│   ├── config.py             # Configuration settings
│   ├── database.py           # Database connection file
│   ├── models.py             # Database models
│   └── schemas.py            # Data serialization schemas
├── database/                 # Local database storage
│   └── resume_builder.db     # SQLite database file
├── frontend/                 # React/Vite frontend application
├── generated/                # Output directory for generated resumes/PDFs
├── logs/                     # Application log files
├── .env.example              # Template for environment variables
├── docker-compose.yml        # Docker multi-container setup
├── Dockerfile                # Docker container configuration
├── package.json              # Main project package configurations
├── requirements.txt          # Python packages and dependencies
└── README.md                 # Project documentation
---

## 🏗️ System Architecture

The application follows a decoupled **Client-Server Architecture**, designed for scalability and clean separation of concerns:

1. **Frontend Tier (React + Vite + Tailwind CSS):** A responsive, state-driven user interface. It handles user inputs (resume data, job descriptions), manages application state, and handles dynamic multi-page workflows (Dashboard, Resume Builder, live PDF/HTML previewing).
2. **Backend Tier (Python + FastAPI/Flask):** A lightweight API service responsible for routing client requests, handling business logic, managing database interactions, and secure communication with upstream AI models.
3. **Database Tier (SQLite):** An embedded relational database (`resume_builder.db`) tracking user profiles, saved resumes, historical generations, and application states.

---

## 🤖 AI Workflow & Pipeline

The core intelligence of the application follows a structured data engineering and LLM orchestration pipeline:

```text
[User Input Data] ──> [Prompt Engine] ──> [LLM / AI Model] ──> [Parser & Sanitizer] ──> [Dynamic UI / PDF Generation]
       │                   ▲
       └──> [Job Description]
