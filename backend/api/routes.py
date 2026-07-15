import json
import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Header
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from backend.database import get_db
from backend import models, schemas
from backend.config import settings
from backend.agents.orchestrator import OrchestratorAgent
from backend.agents.ats_analysis import ATSAnalysisAgent
from backend.agents.enhancement import EnhancementAgent, load_prompt
from backend.services.llm import get_llm_service, BaseLLM
from backend.services.pdf_generator import generate_resume_pdf
from backend.services.docx_generator import generate_resume_docx
from backend.services.logging_service import logger

router = APIRouter()

# Dependency to extract custom LLM config from request headers
def get_custom_llm(
    x_gemini_key: str | None = Header(default=None, alias="X-Gemini-Key"),
    x_openai_key: str | None = Header(default=None, alias="X-OpenAI-Key"),
    x_llm_provider: str | None = Header(default=None, alias="X-LLM-Provider")
) -> BaseLLM:
    return get_llm_service(
        gemini_key=x_gemini_key,
        openai_key=x_openai_key,
        provider=x_llm_provider
    )

# ----------------- DB HELPER FUNCTIONS -----------------
def db_to_resume_response(db_resume: models.Resume) -> schemas.ResumeResponse:
    """
    Utility to convert SQLAlchemy Resume model to Pydantic ResumeResponse.
    """
    return schemas.ResumeResponse(
        id=db_resume.id,
        user_id=db_resume.user_id,
        title=db_resume.title,
        template_name=db_resume.template_name,
        raw_data=json.loads(db_resume.raw_data),
        enhanced_data=json.loads(db_resume.enhanced_data) if db_resume.enhanced_data else None,
        ats_score=db_resume.ats_score,
        created_at=db_resume.created_at,
        updated_at=db_resume.updated_at
    )

# ----------------- ENDPOINTS -----------------

@router.post("/resume/create", response_model=schemas.ResumeResponse, status_code=status.HTTP_201_CREATED)
def create_resume(payload: schemas.ResumeCreateRequest, db: Session = Depends(get_db)):
    """
    Saves raw resume draft to the SQLite database.
    """
    logger.info(f"API called: POST /resume/create | Title: {payload.title}")
    try:
        raw_data_str = json.dumps(payload.raw_data.model_dump())
        db_resume = models.Resume(
            title=payload.title,
            template_name=payload.template_name,
            raw_data=raw_data_str,
            enhanced_data=None,
            ats_score=None
        )
        db.add(db_resume)
        db.commit()
        db.refresh(db_resume)
        return db_to_resume_response(db_resume)
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating resume: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database write failed: {str(e)}"
        )


@router.post("/resume/generate", response_model=schemas.ResumeGenerationResponse)
def generate_resume(
    payload: schemas.ResumeCreateRequest, 
    db: Session = Depends(get_db),
    llm: BaseLLM = Depends(get_custom_llm)
):
    """
    Executes the multi-agent AI pipeline to format, validate, enhance, and score a resume.
    Optionally saves or updates it in the database.
    """
    logger.info(f"API called: POST /resume/generate | Title: {payload.title}")
    try:
        orchestrator = OrchestratorAgent(llm_service=llm)
        # Run sequential AI pipeline
        result = orchestrator.run_workflow(payload.raw_data, payload.raw_data.target_role)
        
        # Save results to database
        raw_data_str = json.dumps(payload.raw_data.model_dump())
        enhanced_data_str = json.dumps(result.enhanced_data.model_dump())
        
        db_resume = models.Resume(
            title=payload.title,
            template_name=payload.template_name,
            raw_data=raw_data_str,
            enhanced_data=enhanced_data_str,
            ats_score=result.ats_report.score
        )
        db.add(db_resume)
        db.commit()
        db.refresh(db_resume)
        
        # Also store the ATS Report
        db_report = models.ATSReport(
            resume_id=db_resume.id,
            score=result.ats_report.score,
            feedback_data=json.dumps(result.ats_report.model_dump())
        )
        db.add(db_report)
        db.commit()
        
        # Set database resume ID in response if successful
        res_val = schemas.ResumeGenerationResponse(
            resume_id=db_resume.id,
            enhanced_data=result.enhanced_data,
            ats_report=result.ats_report
        )
        return res_val
        
    except ValueError as val_err:
        logger.warning(f"Validation failure during orchestration: {str(val_err)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Error generating optimized resume: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Orchestration pipeline failed: {str(e)}"
        )


@router.post("/resume/improve", response_model=schemas.SectionImprovementResponse)
def improve_section(
    payload: schemas.SectionImprovementRequest,
    llm: BaseLLM = Depends(get_custom_llm)
):
    """
    AI Enhancement: Refines a specific text block (e.g., career objective or single project) 
    and returns only the enhanced string.
    """
    logger.info(f"API called: POST /resume/improve | Section: {payload.section_name}")
    try:
        section_name = payload.section_name.lower().strip()
        
        if section_name == "objective":
            prompt_tpl = load_prompt("objective.txt")
            prompt = prompt_tpl.format(
                target_role=payload.target_role,
                original_objective=payload.content
            )
        elif section_name == "experience" or section_name == "work_experience":
            prompt_tpl = load_prompt("experience.txt")
            prompt = prompt_tpl.format(
                target_role=payload.target_role,
                company="Current Organization",
                role=payload.target_role,
                original_description=payload.content
            )
        elif section_name == "projects":
            prompt_tpl = load_prompt("projects.txt")
            prompt = prompt_tpl.format(
                target_role=payload.target_role,
                project_name="Core Project",
                technologies="relevant tools",
                original_description=payload.content
            )
        elif section_name == "skills":
            prompt_tpl = load_prompt("skills.txt")
            prompt = prompt_tpl.format(
                target_role=payload.target_role,
                current_skills=payload.content
            )
        else:
            # Fallback general summary rewrite
            prompt_tpl = load_prompt("summary.txt")
            prompt = prompt_tpl.format(
                target_role=payload.target_role,
                resume_content=payload.content
            )
            
        enhanced_txt = llm.generate_text(prompt)
        return schemas.SectionImprovementResponse(
            original_content=payload.content,
            improved_content=enhanced_txt
        )
    except Exception as e:
        logger.error(f"Error improving section '{payload.section_name}': {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"LLM rewrite section failure: {str(e)}"
        )


@router.post("/resume/analyze", response_model=schemas.ATSReportSchema)
def analyze_resume(
    payload: schemas.ResumeDataSchema,
    llm: BaseLLM = Depends(get_custom_llm)
):
    """
    Scans the given resume data (raw or enhanced) and outputs an ATS report.
    """
    logger.info(f"API called: POST /resume/analyze | Target: {payload.target_role}")
    try:
        analyzer = ATSAnalysisAgent(llm_service=llm)
        report = analyzer.analyze(payload, payload.target_role)
        return report
    except Exception as e:
        logger.error(f"Error analyzing resume: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ATS analyzer failure: {str(e)}"
        )


@router.post("/resume/download/pdf")
def download_pdf(payload: schemas.ResumeDataSchema):
    """
    Generates a high-quality ReportLab PDF and returns the file download stream.
    """
    logger.info("API called: POST /resume/download/pdf")
    try:
        filename = f"resume_{uuid.uuid4().hex}.pdf"
        filepath = os.path.join(settings.GENERATED_DIR, filename)
        
        generate_resume_pdf(payload.model_dump(), filepath)
        
        if not os.path.exists(filepath):
            raise FileNotFoundError("PDF file could not be compiled on disk.")
            
        # Clean file name suggestion for download
        download_name = "Resume.pdf"
        if payload.personal_info.full_name:
            # Format name: John_Doe_Resume.pdf
            clean_name = re.sub(r"[^\w\s-]", "", payload.personal_info.full_name).strip().replace(" ", "_")
            download_name = f"{clean_name}_Resume.pdf"
            
        return FileResponse(
            path=filepath,
            media_type="application/pdf",
            filename=download_name
        )
    except Exception as e:
        logger.error(f"Error compiling PDF: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"PDF compiler error: {str(e)}"
        )


@router.post("/resume/download/docx")
def download_docx(payload: schemas.ResumeDataSchema):
    """
    Generates an editable Word (.docx) document and returns the file download stream.
    """
    logger.info("API called: POST /resume/download/docx")
    try:
        filename = f"resume_{uuid.uuid4().hex}.docx"
        filepath = os.path.join(settings.GENERATED_DIR, filename)
        
        generate_resume_docx(payload.model_dump(), filepath)
        
        if not os.path.exists(filepath):
            raise FileNotFoundError("DOCX file could not be compiled on disk.")
            
        download_name = "Resume.docx"
        if payload.personal_info.full_name:
            clean_name = re.sub(r"[^\w\s-]", "", payload.personal_info.full_name).strip().replace(" ", "_")
            download_name = f"{clean_name}_Resume.docx"
            
        return FileResponse(
            path=filepath,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            filename=download_name
        )
    except Exception as e:
        logger.error(f"Error compiling DOCX: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"DOCX compiler error: {str(e)}"
        )


@router.get("/resume", response_model=list[schemas.ResumeResponse])
def list_resumes(db: Session = Depends(get_db)):
    """
    Retrieves all saved resumes from the database.
    """
    logger.info("API called: GET /resume")
    try:
        resumes = db.query(models.Resume).order_by(models.Resume.updated_at.desc()).all()
        return [db_to_resume_response(r) for r in resumes]
    except Exception as e:
        logger.error(f"Error listing resumes: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database list query failed: {str(e)}"
        )


@router.get("/resume/{id}", response_model=schemas.ResumeResponse)
def get_resume(id: int, db: Session = Depends(get_db)):
    """
    Retrieves a single saved resume structure.
    """
    logger.info(f"API called: GET /resume/{id}")
    db_resume = db.query(models.Resume).filter(models.Resume.id == id).first()
    if not db_resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resume with ID {id} not found."
        )
    return db_to_resume_response(db_resume)


@router.get("/resume/{id}/report", response_model=schemas.ATSReportSchema)
def get_resume_report(
    id: int, 
    db: Session = Depends(get_db),
    llm: BaseLLM = Depends(get_custom_llm)
):
    """
    Retrieves the ATS Report associated with a resume.
    """
    logger.info(f"API called: GET /resume/{id}/report")
    report = db.query(models.ATSReport).filter(models.ATSReport.resume_id == id).order_by(models.ATSReport.created_at.desc()).first()
    if not report:
        db_resume = db.query(models.Resume).filter(models.Resume.id == id).first()
        if not db_resume:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Resume with ID {id} not found."
            )
        try:
            analyzer = ATSAnalysisAgent(llm_service=llm)
            # Deserialize raw/enhanced data
            res_data_dict = json.loads(db_resume.enhanced_data or db_resume.raw_data)
            resume_data = schemas.ResumeDataSchema(**res_data_dict)
            new_report = analyzer.analyze(resume_data, resume_data.target_role)
            
            # Save it
            db_report = models.ATSReport(
                resume_id=id,
                score=new_report.score,
                feedback_data=json.dumps(new_report.model_dump())
            )
            db.add(db_report)
            db.commit()
            return new_report
        except Exception as e:
            logger.error(f"Error compiling report on the fly: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"ATS analyzer dynamic execution failed: {str(e)}"
            )
            
    return schemas.ATSReportSchema(**json.loads(report.feedback_data))


@router.delete("/resume/{id}", status_code=status.HTTP_200_OK)
def delete_resume(id: int, db: Session = Depends(get_db)):
    """
    Deletes a saved resume draft and reports.
    """
    logger.info(f"API called: DELETE /resume/{id}")
    db_resume = db.query(models.Resume).filter(models.Resume.id == id).first()
    if not db_resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resume with ID {id} not found."
        )
    try:
        db.delete(db_resume)
        db.commit()
        return {"status": "success", "message": f"Resume with ID {id} deleted successfully."}
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting resume {id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database delete operation failed: {str(e)}"
        )
