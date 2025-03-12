
"""
Detector de Plagio y Contenido de IA - Backend API

Este es un archivo de ejemplo para implementar el backend en Python
utilizando FastAPI. Este código debe ejecutarse en un entorno Python
separado y no se ejecutará dentro de la aplicación web.

Requisitos:
pip install fastapi uvicorn python-multipart beautifulsoup4 requests textdistance scikit-learn fuzzywuzzy python-Levenshtein

Ejecución:
uvicorn app:app --reload
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import tempfile
import json
import random
from typing import List, Dict, Any, Optional
import time

# Librerías necesarias para implementar la detección
# En un proyecto real, importarías:
# import requests
# from bs4 import BeautifulSoup
# import textdistance
# import difflib
# from sklearn.feature_extraction.text import TfidfVectorizer
# from fuzzywuzzy import fuzz

app = FastAPI(title="Detector de Plagio y Contenido IA")

# Configurar CORS para permitir peticiones desde el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, limitar a la URL de tu frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Endpoint de prueba."""
    return {"message": "API de Detección de Plagio y Contenido IA"}

@app.post("/analyze")
async def analyze_document(file: UploadFile = File(...)):
    """
    Analiza un documento para detectar plagio y contenido generado por IA.
    
    Args:
        file: Archivo PDF o DOCX para analizar
    
    Returns:
        Resultado del análisis con métricas de plagio y detección de IA
    """
    # Validación del tipo de archivo
    if file.content_type not in ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]:
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos PDF o DOCX")
    
    try:
        # Guardar el archivo temporalmente
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp:
            temp.write(await file.read())
            temp_path = temp.name
        
        # Simulación de procesamiento (aquí implementarías tu lógica real)
        # Esperar un tiempo para simular procesamiento
        time.sleep(2)
        
        # En un proyecto real:
        # 1. Extraer texto del documento
        # 2. Dividir en párrafos
        # 3. Buscar en Google fragmentos
        # 4. Extraer contenido de páginas web
        # 5. Comparar similitud con algoritmos
        # 6. Analizar patrones de IA
        # 7. Generar puntuaciones
        
        # Resultado simulado para fines de demostración
        # En tu implementación real, esto vendría de tus algoritmos
        result = generate_demo_result()
        
        # Limpiar archivo temporal
        os.unlink(temp_path)
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar el documento: {str(e)}")

def generate_demo_result() -> Dict[str, Any]:
    """Genera un resultado de demostración para fines de prueba."""
    # Simulación de plagio encontrado
    plagiarism_percentage = random.randint(15, 65)
    
    # Simulación de fuentes encontradas
    sources = [
        {
            "url": "https://es.wikipedia.org/wiki/Inteligencia_artificial",
            "title": "Inteligencia Artificial - Wikipedia",
            "match_percentage": random.randint(40, 95)
        },
        {
            "url": "https://www.ejemplo.com/articulo-academico",
            "title": "Avances en Machine Learning - Revista Académica",
            "match_percentage": random.randint(30, 80)
        },
        {
            "url": "https://blog.ciencia.org/neural-networks",
            "title": "Redes Neuronales Explicadas",
            "match_percentage": random.randint(20, 70)
        }
    ]
    
    # Simulación de análisis de IA
    ai_generated_probability = random.randint(20, 85)
    
    # Detalles del análisis
    ai_analysis_details = {
        "entropy": random.uniform(3.5, 8.2),
        "rarityScore": random.uniform(0.2, 0.8),
        "patternScore": random.uniform(0.1, 0.9),
        "confidenceScore": random.uniform(0.65, 0.95),
        "modelDetails": "Statistical Pattern Analysis v1.2",
        "features": {
            "repetitive_patterns": random.uniform(0.1, 0.9),
            "sentence_complexity": random.uniform(0.3, 0.8),
            "vocabulary_diversity": random.uniform(0.2, 0.9),
            "grammar_perfection": random.uniform(0.4, 0.95),
            "distinctive_phrasing": random.uniform(0.1, 0.8)
        }
    }
    
    # Contenido analizado (ejemplo simplificado)
    analyzed_content = [
        {
            "text": "Este es un párrafo analizado que parece ser original.",
            "is_plagiarized": False
        },
        {
            "text": "Este párrafo muestra coincidencias con fuentes externas y podría ser plagio.",
            "is_plagiarized": True
        },
        {
            "text": "Otro fragmento de contenido que parece ser original según el análisis.",
            "is_plagiarized": False
        }
    ]
    
    # Simulación de contenido del documento (simplificado)
    document_content = "\n\n".join([item["text"] for item in analyzed_content])
    
    return {
        "plagiarism_percentage": plagiarism_percentage,
        "sources": sources,
        "ai_generated_probability": ai_generated_probability,
        "ai_analysis_details": ai_analysis_details,
        "analyzed_content": analyzed_content,
        "document_content": document_content,
        "raw_data": {
            "analysis_timestamp": time.time(),
            "algorithm_version": "1.0.3",
            "found_matches": len([item for item in analyzed_content if item["is_plagiarized"]]),
            "total_paragraphs": len(analyzed_content),
            "processing_time_ms": random.randint(1500, 8000)
        }
    }

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=5000, reload=True)
