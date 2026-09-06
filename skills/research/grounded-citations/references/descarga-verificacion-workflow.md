# Workflow: Descarga y Verificación Propia de Fuentes

## Contexto
Este documento detalla el procedimiento técnico para descargar, extraer y verificar el contenido real de fuentes web y académicas referenciadas en la conversación.

## Procedimiento Paso a Paso

### 1. Obtener la URL
- Identificar la URL objetivo desde el buscador o el usuario.
- Verificar que sea un dominio oficial (PubMed Central, SciELO, DOI, arXiv, etc.).

### 2. Descargar el Contenido
- Usar `web_extract(url)` para obtener el contenido limpio en markdown/texto.
- Alternativamente, usar `terminal(curl ...)` para descargar el HTML/JSON crudo.
- Para PDFs académicos, usar `pypdf.PdfReader` si es un PDF local, o `web_extract` para la versión HTML/PDF online.

### 3. Extraer y Verificar Datos Clave
- Buscar el título, autores, fecha de publicación y el abstract/resumen.
- Extraer los datos estadísticos específicos (porcentajes, intervalos de confianza, tamaños de muestra).
- Verificar que las conclusiones reportadas coincidan con los hallazgos de los autores originales.

### 4. Registro en el Ledger
- Registrar la URL en el ledger de `grounded-citations` mediante `sources.py add <url> --title "<Título>"`.
- Adjuntar evidencia verbatim con `sources.py quote <id> --text "..." --from page.txt`.

### 5. Verificación Cruzada (si aplica)
- Comparar la información con una segunda fuente independiente.
- Si hay discrepancias, presentar ambas lecturas con sus propios IDs de ledger.

## Ejemplo Técnico (Python)
```python
import urllib.request, os, re

# Descargar HTML de una fuente PMC
url = "https://pmc.ncbi.nlm.nih.gov/articles/PMC12302118"
headers = {'User-Agent': 'Mozilla/5.0'}
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req) as response:
    html = response.read().decode('utf-8', errors='ignore')

# Guardar en workspace compartido
os.makedirs('/home/descon/.hermes/workspace_compartido/antecedentes_web', exist_ok=True)
with open('/home/descon/.hermes/workspace_compartido/antecedentes_web/Pan_2025.html', 'w', encoding='utf-8') as f:
    f.write(html)
```

## Errores Comunes y Soluciones
- **HTTP 403 Forbidden**: Configurar headers de User-Agent o usar proxies de búsqueda alternativos.
- **HTML vacío o mal parseado**: Verificar la URL con `curl -I <url>` primero; usar `web_extract` como fallback.
- **Fuente no encontrada**: Verificar que la URL esté activa y sea accesible públicamente.
