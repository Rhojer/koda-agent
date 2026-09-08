---
name: notebooklm
description: Operar de forma autónoma en Google NotebookLM para crear libretas, subir fuentes (PDFs, URLs, textos), hacer consultas con citas directas y generar/descargar resúmenes de audio (Podcasts).
author: Koda AI
version: 1.0.0
tags: [research, notebooklm, gemini, audio, thesis, documents]
---

# Habilidad: Google NotebookLM CLI

Esta habilidad permite a **Koda** interactuar directamente con Google NotebookLM utilizando la CLI `notebooklm` configurada en el VPS con bypass residencial activo.

---

## 🛠️ Comandos Principales

### 1. Gestión de Libretas
- **Listar libretas disponibles**:
  ```bash
  notebooklm list
  ```
- **Crear una nueva libreta**:
  ```bash
  notebooklm create "Nombre de la Libreta"
  ```
- **Seleccionar libreta activa (por ID o título parcial)**:
  ```bash
  notebooklm use <ID_o_fragmento>
  ```
- **Ver estado actual / libreta activa**:
  ```bash
  notebooklm status
  ```

---

### 2. Gestión de Fuentes y Documentos
- **Subir archivo (PDF, TXT, DOCX, etc.)**:
  ```bash
  notebooklm source add "/ruta/al/archivo.pdf"
  ```
- **Subir enlace web**:
  ```bash
  notebooklm source add "https://ejemplo.com/articulo"
  ```
- **Listar fuentes de la libreta activa**:
  ```bash
  notebooklm source list
  ```

---

### 3. Preguntas y Razonamiento Grounded (con Citas)
- **Consultar a los documentos de la libreta**:
  ```bash
  notebooklm ask "Pregunta específica sobre las fuentes subidas"
  ```
- **Obtener sugerencias de preguntas y siguientes pasos**:
  ```bash
  notebooklm suggest-prompts
  notebooklm suggest-next-steps
  ```

---

### 4. Generación Multimedia y Estudio
- **Generar Audio Overview (Podcast Deep Dive en dos voces)**:
  ```bash
  notebooklm generate audio
  ```
- **Descargar el Audio generado**:
  ```bash
  notebooklm download audio "/ruta/salida/podcast.mp3"
  ```
- **Generar Guía de Estudio / Reporte**:
  ```bash
  notebooklm generate report
  notebooklm download report "/ruta/salida/reporte.md"
  ```
- **Generar Tarjetas de Memoria (Flashcards) o Cuestionarios (Quiz)**:
  ```bash
  notebooklm generate flashcards
  notebooklm generate quiz
  ```

---

## 📋 Reglas de Operación Médica y de Tesis
1. **Fidelidad Estricta**: Al responder consultas usando NotebookLM, citar siempre las fuentes que el modelo indique (`[Autor, Año]` o número de fuente).
2. **Cero Suposiciones**: Si una información no está en los PDFs del cuaderno, indicarlo explícitamente.
3. **Persistencia de Archivos**: Los archivos de audio y reportes generados deben guardarse en `/root/.hermes/workspace_compartido/`.
