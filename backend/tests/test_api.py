import pytest
from fastapi.testclient import TestClient
from backend.app import app
from backend.database import Base, engine

# Initialize client
client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    # Make sure tables are created
    Base.metadata.create_all(bind=engine)
    yield
    # Clean tables after testing if needed (optional)

def get_dummy_resume_data():
    return {
        "personal_info": {
            "full_name": "Test Candidate",
            "professional_title": "Software Engineer",
            "email": "test@candidate.com",
            "phone": "+1234567890",
            "address": "San Francisco, CA",
            "linkedin": "linkedin.com/in/testcandidate",
            "github": "github.com/testcandidate",
            "portfolio": "testcandidate.dev"
        },
        "objective": "To build scalable software solutions.",
        "education": [
            {
                "degree": "B.S. in Computer Science",
                "college": "Engineering College",
                "university": "State University",
                "cgpa": "3.8",
                "start_year": "2018",
                "end_year": "2022"
            }
        ],
        "skills": ["Python", "React", "Docker", "SQL"],
        "projects": [
            {
                "project_name": "E-Commerce Backend",
                "description": "Built a scalable microservices backend using FastAPI and Postgres.",
                "technologies": "FastAPI, PostgreSQL, Redis",
                "github_link": "github.com/testcandidate/ecommerce",
                "live_link": "ecommerce.dev"
            }
        ],
        "internships": [
            {
                "company": "Startup Hub",
                "role": "Backend Intern",
                "description": "Optimized DB queries and wrote tests.",
                "start_date": "Summer 2021",
                "end_date": "Fall 2021"
            }
        ],
        "work_experience": [
            {
                "company": "Tech Corp",
                "role": "Software Developer",
                "description": "Led backend integrations and API migrations.",
                "start_date": "2022",
                "end_date": "Present"
            }
        ],
        "certifications": [
            {
                "name": "AWS Solutions Architect",
                "issuer": "Amazon Web Services",
                "year": "2023"
            }
        ],
        "achievements": [
            {
                "title": "Hackathon Winner",
                "description": "Won 1st place out of 50 teams at TechCon Hack."
            }
        ],
        "languages": [
            {
                "language": "English",
                "proficiency": "Fluent"
            }
        ],
        "interests": ["Hiking", "Chess"],
        "target_role": "Backend Software Engineer",
        "preferred_template": "modern"
    }

def test_health_check():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_create_resume():
    payload = {
        "title": "My Software Resume",
        "template_name": "harvard",
        "raw_data": get_dummy_resume_data()
    }
    response = client.post("/api/resume/create", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "My Software Resume"
    assert data["template_name"] == "harvard"
    assert "id" in data
    assert data["raw_data"]["personal_info"]["full_name"] == "Test Candidate"

def test_generate_resume():
    payload = {
        "title": "Generated Resume",
        "template_name": "modern",
        "raw_data": get_dummy_resume_data()
    }
    # This will trigger our Mock LLM and run the sequential agent pipeline
    response = client.post("/api/resume/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "resume_id" in data
    assert "enhanced_data" in data
    assert "ats_report" in data
    assert data["ats_report"]["score"] > 0
    assert len(data["ats_report"]["suggestions"]) > 0

def test_improve_section():
    payload = {
        "section_name": "objective",
        "content": "I want a job as a backend dev.",
        "target_role": "Backend Engineer"
    }
    response = client.post("/api/resume/improve", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "improved_content" in data
    assert len(data["improved_content"]) > len(payload["content"])

def test_analyze_resume():
    payload = get_dummy_resume_data()
    response = client.post("/api/resume/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "score" in data
    assert "suggestions" in data
    assert "missing_keywords" in data

def test_download_pdf():
    payload = get_dummy_resume_data()
    response = client.post("/api/resume/download/pdf", json=payload)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert len(response.content) > 0

def test_download_docx():
    payload = get_dummy_resume_data()
    response = client.post("/api/resume/download/docx", json=payload)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    assert len(response.content) > 0

def test_get_and_delete_resume():
    # 1. Create one
    payload = {
        "title": "Temp Resume",
        "template_name": "minimal",
        "raw_data": get_dummy_resume_data()
    }
    create_resp = client.post("/api/resume/create", json=payload)
    resume_id = create_resp.json()["id"]

    # 2. Get it
    get_resp = client.get(f"/api/resume/{resume_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["title"] == "Temp Resume"

    # 3. Delete it
    del_resp = client.delete(f"/api/resume/{resume_id}")
    assert del_resp.status_code == 200
    assert del_resp.json()["status"] == "success"

    # 4. Try getting it again (should fail)
    get_again_resp = client.get(f"/api/resume/{resume_id}")
    assert get_again_resp.status_code == 404
