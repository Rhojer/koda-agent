---
name: tesis-grado
description: "Use when managing, drafting or reviewing any academic thesis chapter (degree thesis, dissertation, anteproyecto) under the user's strict Vancouver + continuous-flow conventions."
version: 2.0.0
author: Koda & DEScon
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [Thesis, Academic, Vancouver, Antecedentes, Justificacion, Marco-Teorico]
    category: productivity
---

# Tesis de Grado — Guía Maestra y Reglas Blindadas

Utiliza esta skill cada vez que el usuario esté redactando, revisando o planificando cualquier capítulo de una tesis de grado (introducción, marco teórico, antecedentes, justificación, metodología, etc.). El cumplimiento de estas reglas es **obligatorio y no negociable**.

## 1. Tono y honestidad académica
- **Cero supuestos, cero invenciones, cero romanticismo.** Si un dato no está en un PDF del workspace, no se usa.
- **No decorar ni idealizar** la dificultad de las tareas. Evaluación fría y directa de la viabilidad.
- Si falta información para completar un apartado, decirlo explícitamente y proponer cómo conseguirla.

## 2. Estilo de citación: Vancouver estricto con variante del usuario
- Formato Vancouver para la estructura general (numeración correlativa en la lista final).
- **Citas internas en el cuerpo del texto:** solo el **apellido del autor entre corchetes**, sin números, sin comas, sin paréntesis adicionales.
  - ✅ Correcto: `[López González]`, `[OMS]`, `[Pan y col., 2025]`
  - ❌ Incorrecto: `[1]`, `(López González, 2025)`, `[López González, 2025, p. 42]`
- Una sola fuente → una sola llave con apellido.
- Varias fuentes en una misma idea → separadas por `;` dentro de la misma llave: `[Autor1; Autor2]`.

## 3. Reglas de redacción estructural de la introducción (y capítulos afines)
- **Flujo continuo obligatorio.** Cero títulos, cero subtítulos, cero epígrafes intermedios dentro de la introducción. Todo hilado en prosa.
- **Longitud de párrafo controlada estrictamente entre 5 y 11 líneas** (contadas en líneas de texto plano del editor). Ni un párrafo más corto ni más largo.
- **Secuencia obligatoria** del capítulo de Introducción:
  1. **Planteamiento del problema** (de macro a micro: mundial → regional/nacional → hospitalario → paciente/fisiopatología).
  2. **Factores de riesgo / variables** (las que aparecen en la ficha de recolección de datos).
  3. **Instrumentos de medición** (índices, escalas,Scores, protocolos clínicos que se aplican).
  4. **Antecedentes** (estudios previos relacionados, 5-6 años de antigüedad como máximo).
  5. **Justificación** (por qué esta investigación es necesaria y pertinente).
- Cada bloque debe respetar los párrafos de 5-11 líneas sin transiciones con subtítulos.

## 4. Regla del Planteamiento del Problema (la más importante)
- **Estrictamente descriptivo de la realidad problemática**, de lo macro a lo micro.
- **PROHIBIDO** mezclar con justificación, beneficios del estudio, aportes esperados o relevancia social.
- Solo se permite: epidemiología (cifras duras), limitaciones diagnósticas/fisiopatológicas, consecuencias clínicas directas.
- Cualquier desviación hacia "por qué es bueno hacer este estudio" pertenece al apartado de **Justificación**, no aquí.

## 5. Reglas para Antecedentes
- **Antigüedad máxima: 5-6 años hacia atrás** desde el año actual de la investigación.
- **Al momento de buscar y seleccionar** cada antecedente, se debe verificar y dejar registrada la **URL pública o DOI** de la fuente (esto es metadata de búsqueda, no se repite en el cuerpo del texto).
- Una vez que el antecedente ya está **descargado/archivado** en el workspace, en el cuerpo de la introducción se cita **directamente desde el archivo local** sin necesidad de repetir la URL.
- La trazabilidad de la fuente se conserva en una ficha interna o base de datos de antecedentes, no en cada cita.
- Usar fuentes verificables: Google Scholar, Redalyc, SciELO, Dialnet, DOAJ, repositorios institucionales de tesis.

## 6. Datos estadísticos y grounding
- **Todo porcentaje, rango o cifra epidemiológica** debe provenir de un PDF del workspace local (`/root/.hermes/workspace_compartido/` o ruta equivalente del proyecto activo).
- Antes de incluir un dato en el texto, verificar que existe en al menos uno de los PDFs archivados.
- Si no se encuentra el dato, **no se incluye**. Se reporta al usuario.

## 7. Procedimiento operativo recomendado
1. Identificar el capítulo a redactar y su posición en la secuencia (1-5 de la introducción).
2. Extraer del workspace los PDFs relevantes para ese capítulo.
3. Localizar las estadísticas/cifras exactas que respaldarán cada idea.
4. Redactar párrafo por párrafo verificando el rango de 5-11 líneas antes de pasar al siguiente.
5. Insertar las citas `[Autor]` justo después de la afirmación que respaldan.
6. Revisar el bloque completo contra las reglas 1-6 antes de entregar.

## 8. Anti-patrones (lo que NUNCA debe aparecer)
- ❌ Subtítulos o títulos en medio de la introducción.
- ❌ Párrafos de 1-4 líneas o de 12+ líneas.
- ❌ Datos sin fuente local verificable.
- ❌ Mezclar planteamiento del problema con justificación.
- ❌ URLs pegadas en el cuerpo del texto en lugar de como metadata de antecedente.
- ❌ Citas con números, comas o paréntesis tipo APA.
- ❌ Frases vagas como "diversos estudios muestran" sin un autor específico entre corchetes.
- ❌ Lenguaje florido, adornado o que idealice la dificultad del fenómeno estudiado.

## 9. Versión y mantenimiento
- Esta skill es **crítica** y debe parchearse de inmediato cada vez que el usuario añada, refine o contradiga una regla durante una sesión.
- Si en una sesión el usuario corrige una desviación, registrar la corrección con `skill_manage(action='patch')` en el mismo turno para que no se repita.
- **Ubicación canónica única:** `/root/.hermes/skills/user_skills/productivity/tesis-grado/SKILL.md`. No crear copias en otras rutas.