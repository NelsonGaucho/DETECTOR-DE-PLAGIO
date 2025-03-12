
# Backend Python para Detección de Plagio y Contenido IA

Este backend implementa un sistema de detección de plagio y contenido generado por inteligencia artificial utilizando técnicas open-source, sin depender de APIs de pago.

## Requisitos

- Python 3.8 o superior
- Pip (gestor de paquetes de Python)

## Dependencias principales

```
fastapi==0.95.0
uvicorn==0.22.0
python-multipart==0.0.6
beautifulsoup4==4.12.0
requests==2.28.2
textdistance==4.5.0
scikit-learn==1.2.2
fuzzywuzzy==0.18.0
python-Levenshtein==0.20.9
```

## Instalación

1. Crea un entorno virtual:
   ```
   python -m venv venv
   ```

2. Activa el entorno virtual:
   - En Windows: `venv\Scripts\activate`
   - En macOS/Linux: `source venv/bin/activate`

3. Instala las dependencias:
   ```
   pip install -r requirements.txt
   ```

## Ejecución

Para iniciar el servidor de desarrollo:

```
uvicorn app:app --reload --host 0.0.0.0 --port 5000
```

El servidor estará disponible en http://localhost:5000

## Documentación de la API

Una vez iniciado el servidor, puedes acceder a la documentación interactiva en:
- http://localhost:5000/docs (Swagger UI)
- http://localhost:5000/redoc (ReDoc)

## Endpoints principales

- `GET /` - Endpoint de prueba
- `POST /analyze` - Analiza un documento para detectar plagio y contenido generado por IA

## Implementación de algoritmos

Este proyecto utiliza varias técnicas para la detección:

1. **Detección de plagio:**
   - Búsqueda en Google con scraping
   - Algoritmos de similitud (Jaccard, Levenshtein, Coseno)
   - Comparación de fragmentos de texto

2. **Detección de contenido generado por IA:**
   - Análisis estadístico de patrones lingüísticos
   - Evaluación de entropía y distribución de palabras
   - Heurísticas basadas en investigación académica

## Despliegue

Para un entorno de producción, considera utilizar:
- Gunicorn como servidor WSGI
- Nginx como proxy inverso
- Contenedores Docker para facilitar el despliegue

Ejemplo de Dockerfile (básico):
```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5000"]
```

## Notas sobre seguridad

- En producción, configura adecuadamente los orígenes CORS en `app.add_middleware(CORSMiddleware, ...)`
- Considera implementar límites de tasa para evitar abusos
- Utiliza HTTPS para todas las comunicaciones
