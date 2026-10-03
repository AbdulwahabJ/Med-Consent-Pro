# MedConsent

### Digital Medical Consent Management & PDF Automation System

MedConsent is a web-based medical consent management system designed to digitize the process of creating, completing, generating, and archiving patient consent forms.

The system replaces repetitive manual workflows where healthcare staff print forms, write patient information manually, scan completed documents, and organize them across folders.

With MedConsent, healthcare organizations can upload their existing PDF consent templates, visually map dynamic fields onto those templates, complete patient-specific consent forms through a clean web interface, and automatically generate a finalized PDF document for archiving and retrieval.

---

## The Problem

Healthcare facilities often rely on static PDF or paper-based consent forms.

This creates several operational challenges:

- Repetitive manual data entry
- Printing and scanning documents
- Inconsistent document organization
- Difficulty finding historical consent records
- Errors when entering patient information
- Time-consuming document preparation
- Lack of a centralized digital archive
- Difficulty maintaining standardized consent templates

MedConsent was designed to solve these problems while allowing organizations to continue using their existing approved PDF consent documents.

---

# Core Workflow

The main workflow of MedConsent is:

```text
Upload Blank Consent PDF
        ↓
Open Visual Field Mapper
        ↓
Place Dynamic Fields on PDF
        ↓
Save Template Configuration
        ↓
Create New Consent
        ↓
Select Consent Template
        ↓
Fill Patient / Procedure Information
        ↓
Generate Final PDF
        ↓
Save Independent Patient Copy
        ↓
Archive / Preview / Download
```

The original PDF remains unchanged and acts as the reusable master template.

Every generated consent is stored as an independent document.

---

# Key Features

## 1. PDF Template Management

Administrators can upload existing medical consent forms as PDF templates.

The system allows each PDF to become a reusable digital consent template without redesigning the original document.

Templates can contain multiple dynamic fields that are populated when a new consent is created.

---

## 2. Visual PDF Field Mapper

One of the main features of MedConsent is the visual field-mapping interface.

Instead of manually defining PDF coordinates in code, the user can visually position fields directly over the PDF preview.

Supported field concepts include:

- Text fields
- Multiline text
- Dates
- Checkboxes
- Patient-related information
- Procedure information
- Doctor information

Fields can be positioned and adjusted visually on the PDF.

The mapper supports:

- Dragging fields
- Resizing fields
- Multi-page PDF navigation
- Saving field coordinates
- Percentage-based positioning

Using percentage-based coordinates allows field positions to remain consistent when the PDF is displayed at different screen sizes.

---

# 3. Dynamic Consent Generation

Once a template has been configured, healthcare staff no longer need to edit the PDF manually.

The user selects a consent template and completes a clean digital form containing the mapped fields.

The system then:

1. Loads the original PDF template
2. Retrieves the configured field mappings
3. Converts mapped screen coordinates into PDF coordinates
4. Inserts the entered values into the document
5. Generates a new independent PDF
6. Saves the generated consent in the archive

This approach keeps the original medical document design while automating patient-specific data entry.

---

# 4. Arabic PDF Support

Arabic document generation was an important technical requirement of the project.

MedConsent supports Arabic content and right-to-left workflows.

PDF generation uses an embedded Arabic-compatible font:

**Noto Naskh Arabic**

This allows Arabic patient information and medical text to be rendered correctly inside generated PDF documents.

The system also includes RTL-aware user interface behavior for Arabic users.

---

# 5. Consent Archive

Every finalized consent document is automatically added to the consent archive.

The archive provides a centralized location for historical consent documents.

Users can:

- Search consent records
- Preview generated PDFs
- Download documents
- Delete records when authorized
- View consent-related information

The archive includes live search functionality across multiple fields including:

- Patient name
- Patient ID
- Phone number
- Procedure
- Doctor
- Consent template

Arabic-normalized search is used to improve search behavior for Arabic text.

---

# 6. Authentication

The application is protected by an authentication layer.

Users must authenticate before accessing consent templates, mapping tools, generation workflows, or archived documents.

The backend protects application resources and document-management operations from unauthenticated access.

---

# 7. PDF Processing

Two main PDF technologies are used within the system.

### PDF.js

Used for:

- Rendering PDF templates inside the browser
- Displaying individual PDF pages
- Supporting visual field mapping
- Positioning field overlays
- Multi-page navigation

### pdf-lib

Used for:

- Loading original PDF templates
- Writing patient-specific information
- Creating finalized consent documents
- Embedding fonts
- Generating downloadable PDF files

---

# Technology Stack

## Frontend

- React
- TypeScript
- Responsive Web Interface
- RTL / Arabic UI Support
- PDF.js

## Backend

- Node.js
- Express
- TypeScript
- REST API architecture

## Database

The application stores configuration and generated-document metadata through structured database models.

Core entities include:

```text
users
consent_templates
template_fields
generated_consents
```

## PDF Technologies

- PDF.js
- pdf-lib
- Noto Naskh Arabic

---

# System Architecture

MedConsent follows a separated frontend/backend architecture.

```text
┌─────────────────────────────┐
│       React Frontend        │
│                             │
│ Consent Creation            │
│ Template Management         │
│ PDF Field Mapper            │
│ Archive                     │
└──────────────┬──────────────┘
               │
               │ REST API
               │
┌──────────────▼──────────────┐
│      Node / Express API     │
│                             │
│ Authentication              │
│ Template Management         │
│ Field Configuration         │
│ Consent Generation          │
│ File Management             │
│ Archive Operations          │
└──────────────┬──────────────┘
               │
        ┌──────▼───────┐
        │   Database   │
        └──────────────┘

               +

        ┌──────────────┐
        │ PDF Service  │
        │              │
        │ PDF.js       │
        │ pdf-lib      │
        └──────────────┘
```

---

# Main Data Model

## Users

Stores authenticated application users.

```text
users
```

---

## Consent Templates

Represents reusable PDF consent templates uploaded to the system.

```text
consent_templates
```

A template contains the original PDF and its associated field configuration.

---

## Template Fields

Stores mapped field definitions and their positions.

```text
template_fields
```

A field can include information such as:

```text
Field Type
Field Name
Page Number
X Position
Y Position
Width
Height
Configuration
```

Coordinates are stored independently from the displayed PDF dimensions so that the interface can remain responsive.

---

## Generated Consents

Represents completed consent documents.

```text
generated_consents
```

Each generated consent references the template used while preserving an independent generated PDF document.

This prevents future changes to the master template from modifying historical patient documents.

---

# API Responsibilities

The backend provides authenticated APIs for several system areas.

### Templates

- Upload templates
- Retrieve templates
- Manage template information
- Delete templates

### Template Fields

- Retrieve mapped fields
- Create field mappings
- Update field configuration
- Remove fields

### Consent Generation

- Submit completed consent data
- Generate patient-specific PDFs
- Save generated documents
- Retrieve generated consent information

### Archive

- List generated consent documents
- Search consent records
- Retrieve document details
- Download generated files
- Delete archived documents

---

# PDF Coordinate Mapping

Browser coordinates and PDF coordinates use different coordinate systems.

For this reason, MedConsent separates visual positioning from final PDF positioning.

During field mapping:

```text
Screen Position
      ↓
Percentage-Based Coordinates
      ↓
Saved Template Field
```

During document generation:

```text
Saved Percentage Position
      ↓
Actual PDF Page Dimensions
      ↓
PDF Coordinate Conversion
      ↓
Final Field Position
```

This allows the visual PDF editor to work across different screen sizes while preserving accurate positioning in the final document.

---

# Responsive & RTL Design

The user interface was designed around real healthcare workflows.

The application supports:

- Arabic RTL layouts
- Responsive screens
- Desktop usage
- Tablet-oriented workflows
- Simple form-based consent entry
- Minimal steps during daily operations

The goal was to avoid exposing healthcare staff to complex PDF-editing interfaces during everyday use.

PDF configuration is performed once, while daily users interact with simple forms.

---

# Development Approach

The project was designed around a real operational healthcare requirement rather than as a purely academic application.

The development process included:

- Workflow analysis
- Requirements definition
- PDF workflow design
- Database structure design
- Frontend development
- Backend API development
- Authentication
- Visual PDF mapping
- Arabic PDF generation
- Archive functionality
- Search implementation
- Type checking
- End-to-end PDF generation testing

The system was iteratively developed and tested using real-world medical consent workflows.

---

# Project Scope

The current implemented workflow focuses on the core consent-management process:

✅ Authentication

✅ PDF template upload

✅ PDF preview

✅ Visual field mapping

✅ Drag / resize field positioning

✅ Multi-page template support

✅ Dynamic consent forms

✅ Patient-specific PDF generation

✅ Arabic PDF generation

✅ RTL interface support

✅ Generated document archive

✅ Live archive search

✅ PDF preview

✅ PDF download

✅ Archive deletion

✅ Frontend and backend type-check validation

✅ End-to-end PDF generation testing

---

# Planned / Future Enhancements

Several features were intentionally kept outside the initial core implementation and can be added as future modules.

### Digital Signatures

Patient and healthcare-provider signature capture.

### Handwriting Recognition

Tablet/stylus handwriting input with handwriting-to-text conversion.

### WhatsApp Integration

Secure delivery or notification workflows related to generated consent documents.

### Patient Management Module

A centralized patient profile containing historical consent documents.

### Advanced Roles & Permissions

More granular permission management for administrators, doctors, reception staff, and other healthcare users.

### Audit Logs

Detailed tracking of document creation, modification, access, and deletion.

### Cloud Storage

Storage abstraction for local or cloud-based document storage.

---

# Engineering Highlights

The project demonstrates experience in:

- Full Stack Web Development
- React & TypeScript
- Node.js / Express
- REST API Development
- PDF Processing
- Dynamic PDF Generation
- Visual Coordinate Mapping
- Arabic / RTL Applications
- Authentication
- File Management
- Database Design
- Business Workflow Automation
- Requirements Analysis
- Healthcare Process Digitization
- End-to-End Testing
- Real-World Problem Solving

---

# Project Motivation

MedConsent was created to solve a real operational problem in healthcare environments.

Instead of forcing organizations to replace their existing medical consent documents, the system transforms their existing PDF forms into dynamic reusable templates.

This creates a bridge between traditional healthcare documentation and modern digital workflows.

The project demonstrates how software can be designed around existing business processes rather than forcing users to completely change the way they work.

---

# Author

**Abdulwahab Aldebbiat**

Computer Engineer | Full Stack Developer | Digital Solutions

Saudi Arabia

LinkedIn:  
linkedin.com/in/abdulwahabjihad
