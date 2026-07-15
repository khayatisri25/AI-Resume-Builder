import html
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib import colors
from backend.services.logging_service import logger

def clean_text(text: str) -> str:
    """
    Escapes text to avoid XML rendering errors in ReportLab paragraphs.
    """
    if not text:
        return ""
    # First decode any existing entities, then encode properly
    text = html.unescape(str(text))
    return html.escape(text)

def format_description_bullets(text: str, style, font_size_bullet=9) -> list:
    """
    Parses standard text or AI-generated bullet points and turns them
    into styled Paragraph Flowables.
    """
    if not text:
        return []
    flowables = []
    
    # Handle list input directly if passed from database/Pydantic
    if isinstance(text, list):
        for bullet in text:
            bullet_clean = clean_text(str(bullet).strip())
            flowables.append(Paragraph(f"&bull; {bullet_clean}", style))
        return flowables
        
    lines = text.split('\n')
    for line in lines:
        line = line.strip()
        if not line:
            continue
        if line.startswith('- ') or line.startswith('* '):
            clean_line = line[2:].strip()
            flowables.append(Paragraph(f"&bull; {clean_text(clean_line)}", style))
        elif line.startswith('-') or line.startswith('*'):
            clean_line = line[1:].strip()
            flowables.append(Paragraph(f"&bull; {clean_text(clean_line)}", style))
        else:
            flowables.append(Paragraph(clean_text(line), style))
    return flowables

def generate_resume_pdf(data: dict, output_path: str) -> str:
    """
    Generates a beautifully typeset, ATS-compliant PDF resume from the input dictionary.
    Returns the filepath of the generated PDF.
    """
    template = data.get("preferred_template", "modern").lower()
    personal = data.get("personal_info", {})
    objective = data.get("objective", "")
    education = data.get("education", [])
    skills = data.get("skills", [])
    projects = data.get("projects", [])
    internships = data.get("internships", [])
    experience = data.get("work_experience", [])
    certifications = data.get("certifications", [])
    achievements = data.get("achievements", [])
    languages = data.get("languages", [])
    interests = data.get("interests", [])

    logger.info(f"Generating PDF using template '{template}' at path: {output_path}")

    # Set up basic document geometry
    # Margin: Harvard and Classic use 54 points (0.75in), Minimal uses 36 points (0.5in)
    margin = 54
    if template == "minimal":
        margin = 36
    elif template == "harvard":
        margin = 54

    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=margin,
        rightMargin=margin,
        topMargin=margin,
        bottomMargin=margin
    )

    # Core styles initialization
    styles = getSampleStyleSheet()
    
    # ------------------ DEFINE PALETTES & FONTS ------------------
    primary_color = colors.HexColor("#000000") # Default black
    secondary_color = colors.HexColor("#4b5563") # Slate gray
    text_color = colors.HexColor("#1f2937") # Off-black
    font_family = "Helvetica"
    font_family_bold = "Helvetica-Bold"

    if template == "modern":
        primary_color = colors.HexColor("#0f766e") # Teal
        secondary_color = colors.HexColor("#0f766e")
        text_color = colors.HexColor("#1e293b")
    elif template == "professional":
        primary_color = colors.HexColor("#1e3a8a") # Dark Blue
        secondary_color = colors.HexColor("#3b82f6")
        text_color = colors.HexColor("#111827")
    elif template == "classic":
        font_family = "Times-Roman"
        font_family_bold = "Times-Bold"
        primary_color = colors.HexColor("#000000")
        secondary_color = colors.HexColor("#374151")
    elif template == "harvard":
        font_family = "Times-Roman"
        font_family_bold = "Times-Bold"
        primary_color = colors.HexColor("#000000")
        secondary_color = colors.HexColor("#000000")
        text_color = colors.HexColor("#111827")
    elif template == "minimal":
        font_family = "Helvetica"
        font_family_bold = "Helvetica-Bold"
        primary_color = colors.HexColor("#111827")
        secondary_color = colors.HexColor("#4b5563")
        text_color = colors.HexColor("#1f2937")

    # Define custom stylesheet ParagraphStyles
    name_style = ParagraphStyle(
        'ResumeName',
        fontName=font_family_bold,
        fontSize=22 if template != "minimal" else 18,
        leading=26 if template != "minimal" else 22,
        textColor=primary_color,
        alignment=1 if template in ["classic", "harvard"] else 0 # Centered for classic/harvard
    )

    title_style = ParagraphStyle(
        'ResumeTitle',
        fontName=font_family_bold,
        fontSize=12,
        leading=15,
        textColor=secondary_color,
        alignment=1 if template in ["classic", "harvard"] else 0
    )

    contact_style = ParagraphStyle(
        'ResumeContact',
        fontName=font_family,
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#4b5563"),
        alignment=1 if template in ["classic", "harvard"] else 0
    )

    section_heading_style = ParagraphStyle(
        'ResumeSectionHeading',
        fontName=font_family_bold,
        fontSize=11,
        leading=14,
        textColor=primary_color,
        spaceBefore=10,
        spaceAfter=3,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'ResumeBody',
        fontName=font_family,
        fontSize=9.5,
        leading=13,
        textColor=text_color,
        spaceAfter=4
    )

    bold_body_style = ParagraphStyle(
        'ResumeBoldBody',
        fontName=font_family_bold,
        fontSize=9.5,
        leading=13,
        textColor=text_color
    )

    bullet_style = ParagraphStyle(
        'ResumeBullet',
        fontName=font_family,
        fontSize=9,
        leading=12,
        textColor=text_color,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=2
    )

    story = []

    # ------------------ RENDER HEADER ------------------
    full_name = personal.get("full_name", "")
    prof_title = personal.get("professional_title", "")
    email = personal.get("email", "")
    phone = personal.get("phone", "")
    address = personal.get("address", "")
    linkedin = personal.get("linkedin", "")
    github = personal.get("github", "")
    portfolio = personal.get("portfolio", "")

    # Clean strings
    c_name = clean_text(full_name)
    c_title = clean_text(prof_title)
    c_email = clean_text(email)
    c_phone = clean_text(phone)
    c_address = clean_text(address)
    c_linkedin = clean_text(linkedin)
    c_github = clean_text(github)
    c_portfolio = clean_text(portfolio)

    if template in ["classic", "harvard"]:
        # Centered Layout
        story.append(Paragraph(c_name, name_style))
        if c_title:
            story.append(Spacer(1, 2))
            story.append(Paragraph(c_title, title_style))
        
        # Merge contact details into single string divided by bullet points
        contact_parts = []
        if c_phone: contact_parts.append(c_phone)
        if c_email: contact_parts.append(f'<a href="mailto:{c_email}" color="#2563eb">{c_email}</a>')
        if c_address: contact_parts.append(c_address)
        if c_linkedin: contact_parts.append(f'<a href="{c_linkedin}" color="#2563eb">LinkedIn</a>')
        if c_github: contact_parts.append(f'<a href="{c_github}" color="#2563eb">GitHub</a>')
        if c_portfolio: contact_parts.append(f'<a href="{c_portfolio}" color="#2563eb">Portfolio</a>')
        
        contact_str = "  |  ".join(contact_parts)
        story.append(Spacer(1, 4))
        story.append(Paragraph(contact_str, contact_style))
        story.append(Spacer(1, 10))
    elif template == "two column":
        # We will build two column flow using Table layout for the entire page,
        # but let's build the header first spanning full width or keep header at top.
        # Let's render Name and Title at top spanning full width.
        story.append(Paragraph(c_name, name_style))
        if c_title:
            story.append(Spacer(1, 2))
            story.append(Paragraph(c_title, title_style))
        story.append(Spacer(1, 8))
    else:
        # Modern & Professional left-aligned headers with right contact panel
        header_data = []
        name_block = []
        name_block.append(Paragraph(c_name, name_style))
        if c_title:
            name_block.append(Spacer(1, 2))
            name_block.append(Paragraph(c_title, title_style))
            
        contact_block = []
        if c_phone: contact_block.append(Paragraph(f"Phone: {c_phone}", contact_style))
        if c_email: contact_block.append(Paragraph(f'Email: <a href="mailto:{c_email}" color="#0f766e">{c_email}</a>', contact_style))
        if c_linkedin: contact_block.append(Paragraph(f'<a href="{c_linkedin}" color="#0f766e">LinkedIn</a>', contact_style))
        if c_github: contact_block.append(Paragraph(f'<a href="{c_github}" color="#0f766e">GitHub</a>', contact_style))
        if c_portfolio: contact_block.append(Paragraph(f'<a href="{c_portfolio}" color="#0f766e">Portfolio</a>', contact_style))
        
        header_data = [[name_block, contact_block]]
        # 540 width total, split into 320 and 220
        header_table = Table(header_data, colWidths=[320, 220])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('ALIGN', (1,0), (1,0), 'RIGHT'),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ('TOPPADDING', (0,0), (-1,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ]))
        story.append(header_table)
        story.append(Spacer(1, 10))

    # Helper function to append section headers with dividers
    def add_section_header(title: str):
        story.append(Spacer(1, 8))
        story.append(Paragraph(title.upper(), section_heading_style))
        # Draw line
        color = primary_color
        thickness = 1
        if template == "harvard":
            color = colors.black
            thickness = 0.75
        elif template == "minimal":
            color = colors.HexColor("#d1d5db")
            thickness = 0.5
            
        story.append(HRFlowable(
            width="100%", 
            thickness=thickness, 
            color=color, 
            spaceBefore=2, 
            spaceAfter=6
        ))

    # ------------------ RUNNING LAYOUT ENGINE ------------------
    if template == "two column":
        # Two Column layout builds two columns of flowables
        left_flowables = []
        right_flowables = []

        # Left Column: Contact details, Skills, Languages, Interests
        left_flowables.append(Paragraph("CONTACT", ParagraphStyle('LeftHeading', fontName=font_family_bold, fontSize=10, textColor=primary_color, spaceAfter=4)))
        if c_phone: left_flowables.append(Paragraph(f"Phone: {c_phone}", body_style))
        if c_email: left_flowables.append(Paragraph(f"Email: {c_email}", body_style))
        if c_address: left_flowables.append(Paragraph(f"Address: {c_address}", body_style))
        if c_linkedin: left_flowables.append(Paragraph(f'<a href="{c_linkedin}">LinkedIn</a>', body_style))
        if c_github: left_flowables.append(Paragraph(f'<a href="{c_github}">GitHub</a>', body_style))
        if c_portfolio: left_flowables.append(Paragraph(f'<a href="{c_portfolio}">Portfolio</a>', body_style))
        left_flowables.append(Spacer(1, 10))

        if skills:
            left_flowables.append(Paragraph("SKILLS", ParagraphStyle('LeftHeading', fontName=font_family_bold, fontSize=10, textColor=primary_color, spaceAfter=4)))
            for skill in skills:
                left_flowables.append(Paragraph(f"&bull; {clean_text(skill)}", bullet_style))
            left_flowables.append(Spacer(1, 10))

        if languages:
            left_flowables.append(Paragraph("LANGUAGES", ParagraphStyle('LeftHeading', fontName=font_family_bold, fontSize=10, textColor=primary_color, spaceAfter=4)))
            for lang in languages:
                lang_name = clean_text(lang.get("language", ""))
                lang_prof = clean_text(lang.get("proficiency", ""))
                left_flowables.append(Paragraph(f"<b>{lang_name}</b> - {lang_prof}", body_style))
            left_flowables.append(Spacer(1, 10))

        if interests:
            left_flowables.append(Paragraph("INTERESTS", ParagraphStyle('LeftHeading', fontName=font_family_bold, fontSize=10, textColor=primary_color, spaceAfter=4)))
            left_flowables.append(Paragraph(", ".join([clean_text(i) for i in interests]), body_style))

        # Right Column: Objective, Experience, Projects, Education, Certifications
        if objective:
            right_flowables.append(Paragraph("PROFESSIONAL SUMMARY", ParagraphStyle('RightHeading', fontName=font_family_bold, fontSize=10, textColor=primary_color, spaceAfter=2)))
            right_flowables.append(HRFlowable(width="100%", thickness=0.5, color=primary_color, spaceAfter=4))
            right_flowables.append(Paragraph(clean_text(objective), body_style))
            right_flowables.append(Spacer(1, 8))

        if experience:
            right_flowables.append(Paragraph("WORK EXPERIENCE", ParagraphStyle('RightHeading', fontName=font_family_bold, fontSize=10, textColor=primary_color, spaceAfter=2)))
            right_flowables.append(HRFlowable(width="100%", thickness=0.5, color=primary_color, spaceAfter=4))
            for exp in experience:
                comp = clean_text(exp.get("company", ""))
                role = clean_text(exp.get("role", ""))
                start = clean_text(exp.get("start_date", ""))
                end = clean_text(exp.get("end_date", ""))
                
                heading = Paragraph(f"<b>{role}</b> | {comp}", bold_body_style)
                dates = Paragraph(f"{start} - {end}", ParagraphStyle('RightDate', fontName=font_family, fontSize=9, alignment=2, textColor=secondary_color))
                t = Table([[heading, dates]], colWidths=[240, 100])
                t.setStyle(TableStyle([
                    ('VALIGN', (0,0), (-1,-1), 'TOP'),
                    ('LEFTPADDING', (0,0), (-1,-1), 0),
                    ('RIGHTPADDING', (0,0), (-1,-1), 0),
                    ('TOPPADDING', (0,0), (-1,-1), 0),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 1),
                ]))
                right_flowables.append(t)
                
                bullets = format_description_bullets(exp.get("description", ""), bullet_style)
                for b in bullets:
                    right_flowables.append(b)
                right_flowables.append(Spacer(1, 4))
            right_flowables.append(Spacer(1, 8))

        if projects:
            right_flowables.append(Paragraph("PROJECTS", ParagraphStyle('RightHeading', fontName=font_family_bold, fontSize=10, textColor=primary_color, spaceAfter=2)))
            right_flowables.append(HRFlowable(width="100%", thickness=0.5, color=primary_color, spaceAfter=4))
            for proj in projects:
                p_name = clean_text(proj.get("project_name", ""))
                p_tech = clean_text(proj.get("technologies", ""))
                p_git = clean_text(proj.get("github_link", ""))
                
                p_title_str = f"<b>{p_name}</b>"
                if p_tech:
                    p_title_str += f" ({p_tech})"
                heading = Paragraph(p_title_str, bold_body_style)
                git_link = Paragraph(f'<a href="{p_git}" color="#2563eb">GitHub</a>' if p_git else "", ParagraphStyle('RightGit', fontName=font_family, fontSize=9, alignment=2))
                
                t = Table([[heading, git_link]], colWidths=[260, 80])
                t.setStyle(TableStyle([
                    ('VALIGN', (0,0), (-1,-1), 'TOP'),
                    ('LEFTPADDING', (0,0), (-1,-1), 0),
                    ('RIGHTPADDING', (0,0), (-1,-1), 0),
                    ('TOPPADDING', (0,0), (-1,-1), 0),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 1),
                ]))
                right_flowables.append(t)
                
                bullets = format_description_bullets(proj.get("description", ""), bullet_style)
                for b in bullets:
                    right_flowables.append(b)
                right_flowables.append(Spacer(1, 4))
            right_flowables.append(Spacer(1, 8))

        if education:
            right_flowables.append(Paragraph("EDUCATION", ParagraphStyle('RightHeading', fontName=font_family_bold, fontSize=10, textColor=primary_color, spaceAfter=2)))
            right_flowables.append(HRFlowable(width="100%", thickness=0.5, color=primary_color, spaceAfter=4))
            for edu in education:
                deg = clean_text(edu.get("degree", ""))
                inst = clean_text(edu.get("college") or edu.get("university") or "")
                start = clean_text(edu.get("start_year", ""))
                end = clean_text(edu.get("end_year", ""))
                cgpa = clean_text(edu.get("cgpa", ""))
                
                edu_heading = f"<b>{deg}</b> - {inst}"
                if cgpa:
                    edu_heading += f" (CGPA: {cgpa})"
                    
                heading = Paragraph(edu_heading, body_style)
                dates = Paragraph(f"{start} - {end}", ParagraphStyle('RightDate', fontName=font_family, fontSize=9, alignment=2, textColor=secondary_color))
                t = Table([[heading, dates]], colWidths=[260, 80])
                t.setStyle(TableStyle([
                    ('VALIGN', (0,0), (-1,-1), 'TOP'),
                    ('LEFTPADDING', (0,0), (-1,-1), 0),
                    ('RIGHTPADDING', (0,0), (-1,-1), 0),
                    ('TOPPADDING', (0,0), (-1,-1), 0),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 1),
                ]))
                right_flowables.append(t)
                right_flowables.append(Spacer(1, 2))
            right_flowables.append(Spacer(1, 8))

        if certifications:
            right_flowables.append(Paragraph("CERTIFICATIONS", ParagraphStyle('RightHeading', fontName=font_family_bold, fontSize=10, textColor=primary_color, spaceAfter=2)))
            right_flowables.append(HRFlowable(width="100%", thickness=0.5, color=primary_color, spaceAfter=4))
            for cert in certifications:
                c_name_val = clean_text(cert.get("name", ""))
                c_iss = clean_text(cert.get("issuer", ""))
                c_yr = clean_text(cert.get("year", ""))
                right_flowables.append(Paragraph(f"&bull; <b>{c_name_val}</b> ({c_iss}) - {c_yr}", bullet_style))

        # Build Main Table (Left: 160, Spacing: 15, Right: 365)
        # Margin: 36 (left) + 36 (right) = 72. Letter width = 612. Printable = 540.
        main_table = Table([[left_flowables, right_flowables]], colWidths=[165, 375])
        main_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 5),
            ('LEFTPADDING', (1,0), (1,0), 10), # Extra space for right column
            ('TOPPADDING', (0,0), (-1,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ]))
        story.append(main_table)

    else:
        # Standard Single Column Layout for (Modern, Classic, Minimal, Professional, Harvard, One Column)
        
        # 1. Objective / Summary
        if objective:
            add_section_header("Professional Summary")
            story.append(Paragraph(clean_text(objective), body_style))

        # 2. Work Experience
        if experience:
            add_section_header("Work Experience")
            for exp in experience:
                comp = clean_text(exp.get("company", ""))
                role = clean_text(exp.get("role", ""))
                start = clean_text(exp.get("start_date", ""))
                end = clean_text(exp.get("end_date", ""))
                
                heading = Paragraph(f"<b>{role}</b> | <b>{comp}</b>", bold_body_style)
                dates = Paragraph(f"{start} - {end}", ParagraphStyle('ExpDate', fontName=font_family, fontSize=9.5, alignment=2, textColor=secondary_color))
                
                t = Table([[heading, dates]], colWidths=[380, 160] if margin==54 else [400, 140])
                t.setStyle(TableStyle([
                    ('VALIGN', (0,0), (-1,-1), 'TOP'),
                    ('LEFTPADDING', (0,0), (-1,-1), 0),
                    ('RIGHTPADDING', (0,0), (-1,-1), 0),
                    ('TOPPADDING', (0,0), (-1,-1), 0),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 2),
                ]))
                story.append(t)
                
                bullets = format_description_bullets(exp.get("description", ""), bullet_style)
                for b in bullets:
                    story.append(b)
                story.append(Spacer(1, 3))

        # 3. Internships
        if internships:
            add_section_header("Internships")
            for intern in internships:
                comp = clean_text(intern.get("company", ""))
                role = clean_text(intern.get("role", ""))
                start = clean_text(intern.get("start_date", ""))
                end = clean_text(intern.get("end_date", ""))
                
                heading = Paragraph(f"<b>{role}</b> | <b>{comp}</b>", bold_body_style)
                dates = Paragraph(f"{start} - {end}", ParagraphStyle('IntDate', fontName=font_family, fontSize=9.5, alignment=2, textColor=secondary_color))
                
                t = Table([[heading, dates]], colWidths=[380, 160] if margin==54 else [400, 140])
                t.setStyle(TableStyle([
                    ('VALIGN', (0,0), (-1,-1), 'TOP'),
                    ('LEFTPADDING', (0,0), (-1,-1), 0),
                    ('RIGHTPADDING', (0,0), (-1,-1), 0),
                    ('TOPPADDING', (0,0), (-1,-1), 0),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 2),
                ]))
                story.append(t)
                
                bullets = format_description_bullets(intern.get("description", ""), bullet_style)
                for b in bullets:
                    story.append(b)
                story.append(Spacer(1, 3))

        # 4. Projects
        if projects:
            add_section_header("Key Projects")
            for proj in projects:
                p_name = clean_text(proj.get("project_name", ""))
                p_tech = clean_text(proj.get("technologies", ""))
                p_git = clean_text(proj.get("github_link", ""))
                p_live = clean_text(proj.get("live_link", ""))
                
                p_title_str = f"<b>{p_name}</b>"
                if p_tech:
                    p_title_str += f" ({p_tech})"
                heading = Paragraph(p_title_str, bold_body_style)
                
                # Links on the right
                links_parts = []
                if p_git:
                    links_parts.append(f'<a href="{p_git}" color="#2563eb">GitHub</a>')
                if p_live:
                    links_parts.append(f'<a href="{p_live}" color="#2563eb">Live</a>')
                links_str = " | ".join(links_parts)
                links_p = Paragraph(links_str, ParagraphStyle('ProjLinks', fontName=font_family, fontSize=9, alignment=2))
                
                t = Table([[heading, links_p]], colWidths=[380, 160] if margin==54 else [400, 140])
                t.setStyle(TableStyle([
                    ('VALIGN', (0,0), (-1,-1), 'TOP'),
                    ('LEFTPADDING', (0,0), (-1,-1), 0),
                    ('RIGHTPADDING', (0,0), (-1,-1), 0),
                    ('TOPPADDING', (0,0), (-1,-1), 0),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 2),
                ]))
                story.append(t)
                
                bullets = format_description_bullets(proj.get("description", ""), bullet_style)
                for b in bullets:
                    story.append(b)
                story.append(Spacer(1, 3))

        # 5. Education
        if education:
            add_section_header("Education")
            for edu in education:
                deg = clean_text(edu.get("degree", ""))
                college = clean_text(edu.get("college", ""))
                univ = clean_text(edu.get("university", ""))
                start = clean_text(edu.get("start_year", ""))
                end = clean_text(edu.get("end_year", ""))
                cgpa = clean_text(edu.get("cgpa", ""))
                
                inst_str = college
                if univ and univ != college:
                    inst_str += f", {univ}" if college else univ
                
                edu_heading = f"<b>{deg}</b> | <b>{inst_str}</b>"
                if cgpa:
                    edu_heading += f" (CGPA: {cgpa})"
                    
                heading = Paragraph(edu_heading, body_style)
                dates = Paragraph(f"{start} - {end}", ParagraphStyle('EduDate', fontName=font_family, fontSize=9.5, alignment=2, textColor=secondary_color))
                
                t = Table([[heading, dates]], colWidths=[400, 140] if margin==54 else [420, 120])
                t.setStyle(TableStyle([
                    ('VALIGN', (0,0), (-1,-1), 'TOP'),
                    ('LEFTPADDING', (0,0), (-1,-1), 0),
                    ('RIGHTPADDING', (0,0), (-1,-1), 0),
                    ('TOPPADDING', (0,0), (-1,-1), 0),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 2),
                ]))
                story.append(t)

        # 6. Skills
        if skills:
            add_section_header("Skills")
            skills_str = ", ".join([clean_text(s) for s in skills])
            story.append(Paragraph(skills_str, body_style))

        # 7. Certifications & Achievements
        if certifications or achievements:
            if certifications and achievements:
                add_section_header("Certifications & Achievements")
            elif certifications:
                add_section_header("Certifications")
            else:
                add_section_header("Achievements")
                
            for cert in certifications:
                c_name_val = clean_text(cert.get("name", ""))
                c_iss = clean_text(cert.get("issuer", ""))
                c_yr = clean_text(cert.get("year", ""))
                story.append(Paragraph(f"&bull; <b>{c_name_val}</b> ({c_iss}) - {c_yr}", bullet_style))
                
            for ach in achievements:
                ach_title = clean_text(ach.get("title", ""))
                ach_desc = clean_text(ach.get("description", ""))
                story.append(Paragraph(f"&bull; <b>{ach_title}</b>: {ach_desc}", bullet_style))

        # 8. Languages & Interests
        if languages or interests:
            if languages and interests:
                add_section_header("Languages & Interests")
            elif languages:
                add_section_header("Languages")
            else:
                add_section_header("Interests")

            lang_str_list = []
            for lang in languages:
                lang_name = clean_text(lang.get("language", ""))
                lang_prof = clean_text(lang.get("proficiency", ""))
                lang_str_list.append(f"{lang_name} ({lang_prof})" if lang_prof else lang_name)
            
            lang_block = ""
            if lang_str_list:
                lang_block = f"<b>Languages:</b> {', '.join(lang_str_list)}"
                
            int_block = ""
            if interests:
                int_block = f"<b>Interests:</b> {', '.join([clean_text(i) for i in interests])}"
                
            if lang_block and int_block:
                story.append(Paragraph(f"{lang_block} &nbsp;&nbsp;|&nbsp;&nbsp; {int_block}", body_style))
            elif lang_block:
                story.append(Paragraph(lang_block, body_style))
            elif int_block:
                story.append(Paragraph(int_block, body_style))

    # Build the document
    try:
        doc.build(story)
        logger.info(f"Successfully generated PDF at {output_path}")
        return output_path
    except Exception as e:
        logger.error(f"Failed to compile PDF: {str(e)}")
        raise e
