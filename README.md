# CV Adapt

App local para adaptar tu CV a una vacante con **Gemini** (API gratuita), optimizado para ATS y respetando la estructura de tu plantilla.

## Cómo usarla

1. Crea una API key en [Google AI Studio](https://aistudio.google.com/apikey).
2. Opción A: pégala en la UI (se guarda en el navegador).  
   Opción B: copia `.env.example` a `.env` y define `GEMINI_API_KEY`.
3. Arranca el proyecto:

```bash
pnpm install
pnpm dev
```

4. Pega la oferta → **Adaptar CV** → **Descargar PDF**.

La descarga usa la **plantilla reina** (`CV_MARTIN_C#.pdf`): misma estructura, tipografía STIX Two Text, negritas, líneas y links. Solo cambia el texto.

## Notas

- El proxy `/api/adapt-cv` corre en local con `pnpm dev` y en Vercel como función serverless (la key no se expone en el bundle).
- Modelo por defecto: `gemini-3.6-flash` (configurable con `GEMINI_MODEL`).
