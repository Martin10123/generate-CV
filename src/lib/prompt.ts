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
4. El SUMMARY es la identidad profesional: NO lo reescribas desde cero ni lo reduzcas a 1-2 frases genéricas de la vacante. Conserva la misma densidad y casi la misma longitud. OBLIGATORIO mantener del original, si aparecen: años de experiencia, stack principal (p.ej. C#/.NET, React), Clean Architecture, SOLID, microservicios, APIs REST, SPAs, bases de datos relacionales/NoSQL y CI/CD. Solo AJUSTA el wording y AÑADE keywords de la oferta; nunca sustituyas el perfil.
5. Extrae de la oferta keywords MUST y PLUS. Añádelas a summary, bullets y Skills SIN borrar lo que ya está. Las PLUS van al menos en Skills.
6. No inventes empresas, cargos, fechas ni logros falsos. Sí puedes alinear el lenguaje a la oferta y listar tecnologías PLUS en Skills.
7. Tono natural, profesional, sin clichés de IA.
8. Cobertura ATS = añadir términos de la vacante al perfil existente, no reemplazar el perfil por un resumen de la oferta.
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

const IDENTITY_PHRASES = [
  /c#\s*\/\s*\.?net|c#|\.net/i,
  /clean architecture/i,
  /principios?\s+solid|\bSOLID\b/i,
  /ci\s*\/\s*cd/i,
  /microservicios?/i,
  /apis?\s+rest/i,
  /\bspas?\b/i,
  /bases de datos(?:\s+relacionales)?/i,
  /\bnosql\b/i,
]

function extractPlainSummary(plain: string): string {
  const split = plain.search(/\nEXPERIENCIA PROFESIONAL\n/i)
  const head = (split === -1 ? plain : plain.slice(0, split)).trim().split('\n')
  return head.slice(2).join(' ').replace(/\s+/g, ' ').trim()
}

function hasPhrase(text: string, pattern: RegExp): boolean {
  return pattern.test(text)
}

/** Restaura años y pilares del perfil si Gemini los recortó al adaptar. */
export function preserveAdaptedProfile(
  originalPlain: string,
  cv: CvData,
): CvData {
  const original = extractPlainSummary(originalPlain)
  if (!original) return cv

  let summary = cv.summary
  const years = original.match(/(\d+)\s*años(?:\s+de experiencia)?/i)
  if (years && !new RegExp(`\\b${years[1]}\\s*años`, 'i').test(summary)) {
    summary = summary.replace(
      /(desarrollador(?:a)?(?:\s+full\s+stack)?)/i,
      `$1 con ${years[1]} años de experiencia`,
    )
    if (!new RegExp(`\\b${years[1]}\\s*años`, 'i').test(summary)) {
      summary = `Profesional con ${years[1]} años de experiencia. ${summary}`
    }
  }

  const missing = IDENTITY_PHRASES.filter(
    (pattern) => hasPhrase(original, pattern) && !hasPhrase(summary, pattern),
  ).map((pattern) => original.match(pattern)?.[0])
    .filter((phrase): phrase is string => Boolean(phrase))

  if (missing.length > 0) {
    const tail = missing.join(', ')
    summary = `${summary.replace(/\s+$/, '')} Experiencia con ${tail}.`
  }

  return summary === cv.summary ? cv : { ...cv, summary }
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
