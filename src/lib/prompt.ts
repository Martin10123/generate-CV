import type { CvData } from './cvTypes'
import { QUEEN_CV } from './cvDefaults'

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
3. En summary y bullets usa **palabra** para negritas de keywords técnicas (como en un CV ATS), sin abusar. Deja SIEMPRE un espacio antes y después de cada **negrita**.
4. Longitud de summary y bullets equivalente a la original (no alargues).
5. Extrae de la oferta keywords MUST y PLUS (ej. AWS Serverless, APIs & integrations, AI/LLMs, TypeScript, Node.js, React). Integra las MUST en summary, bullets y Skills. Las PLUS deben aparecer al menos en Skills (Herramientas u otra fila) y, si cabe sin alargar, una mención breve en summary.
6. No inventes empresas, cargos, fechas ni logros falsos. Sí puedes alinear el lenguaje a la oferta y listar tecnologías PLUS de la vacante en Skills aunque no sean el foco histórico del CV.
7. Tono natural, profesional, sin clichés de IA.
8. Prioriza cobertura ATS de la oferta: si la vacante nombra AWS, Serverless, APIs, integrations, AI o LLMs, esos términos (o equivalentes claros) DEBEN aparecer en el JSON final.`
}

export function parseCvJson(raw: string): CvData {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')

  const parsed = JSON.parse(cleaned) as Partial<CvData>

  return {
    name: parsed.name?.trim() || QUEEN_CV.name,
    location: parsed.location?.trim() || QUEEN_CV.location,
    phone: parsed.phone?.trim() || QUEEN_CV.phone,
    email: parsed.email?.trim() || QUEEN_CV.email,
    portfolioLabel: parsed.portfolioLabel?.trim() || QUEEN_CV.portfolioLabel,
    linkedinLabel: parsed.linkedinLabel?.trim() || QUEEN_CV.linkedinLabel,
    links: QUEEN_CV.links,
    summary: parsed.summary?.trim() || QUEEN_CV.summary,
    experience:
      Array.isArray(parsed.experience) && parsed.experience.length > 0
        ? parsed.experience.map((job, index) => ({
            company: job.company?.trim() || QUEEN_CV.experience[index]?.company || '',
            role: job.role?.trim() || QUEEN_CV.experience[index]?.role || '',
            location: job.location?.trim() || QUEEN_CV.experience[index]?.location || '',
            dates: job.dates?.trim() || QUEEN_CV.experience[index]?.dates || '',
            bullets:
              Array.isArray(job.bullets) && job.bullets.length > 0
                ? job.bullets.map((b) => String(b))
                : QUEEN_CV.experience[index]?.bullets || [],
          }))
        : QUEEN_CV.experience,
    education:
      Array.isArray(parsed.education) && parsed.education.length > 0
        ? parsed.education.map((edu, index) => ({
            school: edu.school?.trim() || QUEEN_CV.education[index]?.school || '',
            degree: edu.degree?.trim() || QUEEN_CV.education[index]?.degree || '',
            location: edu.location?.trim() || QUEEN_CV.education[index]?.location || '',
            date: edu.date?.trim() || QUEEN_CV.education[index]?.date || '',
          }))
        : QUEEN_CV.education,
    skills:
      Array.isArray(parsed.skills) && parsed.skills.length > 0
        ? parsed.skills.map((skill, index) => ({
            label: skill.label?.trim() || QUEEN_CV.skills[index]?.label || '',
            value: skill.value?.trim() || QUEEN_CV.skills[index]?.value || '',
          }))
        : QUEEN_CV.skills,
  }
}
