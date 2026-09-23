import type { CvData } from './cvTypes'
import { EXAMPLE_CV, buildCvLinks } from './cvDefaults'

export function buildCvAdaptPrompt(jobOffer: string, currentCvPlain: string): string {
  return `Actúa como experto en selección de personal y optimización ATS.

Debes adaptar el CV a la oferta laboral. La ESTRUCTURA del CV es FIJA (plantilla reina): no agregues secciones, no quites secciones, no cambies el número de empleos ni de viñetas, no inventes experiencia.

---
[OFERTA DE TRABAJO]
${jobOffer.trim()}
---

[CV ACTUAL EN TEXTO]
${currentCvPlain.trim()}
---

[ESQUEMA JSON OBLIGATORIO]
Devuelve SOLO un JSON válido (sin markdown ni explicación) con esta forma exacta:
{
  "name": string,
  "location": string,
  "phone": string,
  "email": string,
  "portfolioLabel": string,
  "linkedinLabel": string,
  "portfolioUrl": string,
  "linkedinUrl": string,
  "summary": string,
  "experience": [
    {
      "company": string,
      "role": string,
      "location": string,
      "dates": string,
      "bullets": [string, string, string, string]
    }
  ],
  "education": [
    {
      "school": string,
      "degree": string,
      "location": string,
      "date": string
    }
  ],
  "skills": [
    { "label": "Frontend", "value": string },
    { "label": "Backend", "value": string },
    { "label": "Herramientas", "value": string }
  ]
}

REGLAS:
1. Conserva name, location, phone, email, portfolioLabel, linkedinLabel, companies, education school/degree/dates y cantidad de bullets EXACTOS salvo que el CV actual ya los tenga distintos (entonces usa los del CV actual).
2. Mantén la misma cantidad de experiencias y de bullets por experiencia que el CV actual.
3. En summary, bullets y skills.value usa **palabra** para negritas de keywords técnicas (como en un CV ATS), sin abusar. Deja SIEMPRE un espacio antes y después de cada **negrita**.
4. Longitud de summary y bullets equivalente a la original (no alargues).
5. Extrae de la oferta keywords MUST y PLUS (ej. AWS Serverless, APIs & integrations, AI/LLMs, TypeScript, Node.js, React). Integra las MUST en summary, bullets y Skills. Las PLUS deben aparecer al menos en Skills (Herramientas u otra fila) y, si cabe sin alargar, una mención breve en summary.
6. No inventes empresas, cargos, fechas ni logros falsos. Sí puedes alinear el lenguaje a la oferta y listar tecnologías PLUS de la vacante en Skills aunque no sean el foco histórico del CV.
7. Tono natural, profesional, sin clichés de IA.
8. Prioriza cobertura ATS de la oferta: si la vacante nombra AWS, Serverless, APIs, integrations, AI o LLMs, esos términos (o equivalentes claros) DEBEN aparecer en el JSON final.
9. Si el CV trae URLs de portafolio o LinkedIn, ponlas en portfolioUrl y linkedinUrl; si no, usa "#".`
}

/** Mapea un CV libre (pegado o subido) a la plantilla fija, sin adaptar a una oferta. */
export function buildCvIngestPrompt(currentCvPlain: string): string {
  return `Actúa como experto en CVs ATS.

Debes convertir el CV del usuario al esquema JSON de la plantilla fija. No inventes experiencia, empresas, fechas ni logros. Si falta un dato, deja un string vacío o un valor mínimo razonable tomado del texto.

---
[CV DEL USUARIO]
${currentCvPlain.trim()}
---

[ESQUEMA JSON OBLIGATORIO]
Devuelve SOLO un JSON válido (sin markdown ni explicación) con esta forma exacta:
{
  "name": string,
  "location": string,
  "phone": string,
  "email": string,
  "portfolioLabel": string,
  "linkedinLabel": string,
  "portfolioUrl": string,
  "linkedinUrl": string,
  "summary": string,
  "experience": [
    {
      "company": string,
      "role": string,
      "location": string,
      "dates": string,
      "bullets": [string, string, string, string]
    }
  ],
  "education": [
    {
      "school": string,
      "degree": string,
      "location": string,
      "date": string
    }
  ],
  "skills": [
    { "label": "Frontend", "value": string },
    { "label": "Backend", "value": string },
    { "label": "Herramientas", "value": string }
  ]
}

REGLAS:
1. Usa SOLO información presente en el CV del usuario.
2. Incluye entre 1 y 3 experiencias (las más recientes/relevantes). Cada una con 3 a 5 bullets.
3. En summary, bullets y skills.value usa **palabra** para negritas de keywords técnicas. Deja SIEMPRE un espacio antes y después de cada **negrita**.
4. portfolioLabel suele ser "Portafolio web" si hay portafolio; linkedinLabel algo como "Linkedin/Nombre".
5. Extrae portfolioUrl y linkedinUrl si aparecen; si no, "#".
6. Skills: exactamente 3 filas con labels Frontend, Backend y Herramientas (agrupa tecnologías del CV ahí).`
}

type CvJsonExtra = Partial<CvData> & {
  portfolioUrl?: string
  linkedinUrl?: string
}

export function parseCvJson(raw: string): CvData {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')

  const parsed = JSON.parse(cleaned) as CvJsonExtra

  const name = parsed.name?.trim() || EXAMPLE_CV.name
  const phone = parsed.phone?.trim() || EXAMPLE_CV.phone
  const email = parsed.email?.trim() || EXAMPLE_CV.email

  return {
    name,
    location: parsed.location?.trim() || EXAMPLE_CV.location,
    phone,
    email,
    portfolioLabel: parsed.portfolioLabel?.trim() || EXAMPLE_CV.portfolioLabel,
    linkedinLabel: parsed.linkedinLabel?.trim() || EXAMPLE_CV.linkedinLabel,
    links: buildCvLinks({
      phone,
      email,
      portfolioUrl: parsed.portfolioUrl,
      linkedinUrl: parsed.linkedinUrl,
    }),
    summary: parsed.summary?.trim() || EXAMPLE_CV.summary,
    experience:
      Array.isArray(parsed.experience) && parsed.experience.length > 0
        ? parsed.experience.map((job, index) => ({
            company:
              job.company?.trim() || EXAMPLE_CV.experience[index]?.company || '',
            role: job.role?.trim() || EXAMPLE_CV.experience[index]?.role || '',
            location:
              job.location?.trim() ||
              EXAMPLE_CV.experience[index]?.location ||
              '',
            dates:
              job.dates?.trim() || EXAMPLE_CV.experience[index]?.dates || '',
            bullets:
              Array.isArray(job.bullets) && job.bullets.length > 0
                ? job.bullets.map((b) => String(b))
                : EXAMPLE_CV.experience[index]?.bullets || [],
          }))
        : EXAMPLE_CV.experience,
    education:
      Array.isArray(parsed.education) && parsed.education.length > 0
        ? parsed.education.map((edu, index) => ({
            school:
              edu.school?.trim() || EXAMPLE_CV.education[index]?.school || '',
            degree:
              edu.degree?.trim() || EXAMPLE_CV.education[index]?.degree || '',
            location:
              edu.location?.trim() ||
              EXAMPLE_CV.education[index]?.location ||
              '',
            date: edu.date?.trim() || EXAMPLE_CV.education[index]?.date || '',
          }))
        : EXAMPLE_CV.education,
    skills:
      Array.isArray(parsed.skills) && parsed.skills.length > 0
        ? parsed.skills.map((skill, index) => ({
            label:
              skill.label?.trim() || EXAMPLE_CV.skills[index]?.label || '',
            value:
              skill.value?.trim() || EXAMPLE_CV.skills[index]?.value || '',
          }))
        : EXAMPLE_CV.skills,
  }
}
