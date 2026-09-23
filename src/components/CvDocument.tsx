import type { CvData } from '../lib/cvTypes'
import { renderRichText } from '../lib/richText'

type Props = {
  cv: CvData
}

/**
 * Réplica fija de CV_MARTIN_C#.pdf — Letter 612×792pt, STIX Two Text.
 * No alterar tipografías, márgenes, reglas ni jerarquía.
 */
export function CvDocument({ cv }: Props) {
  return (
    <article className="cv-page" data-cv-page>
      <header className="cv-header">
        <h1 className="cv-name">{cv.name}</h1>
        <p className="cv-contact">
          <span>{cv.location}</span>
          <span className="cv-sep"> · </span>
          <a href={cv.links.phoneUrl} className="cv-link">
            {cv.phone}
          </a>
          <span className="cv-sep"> · </span>
          <a href={cv.links.emailUrl} className="cv-link">
            {cv.email}
          </a>
          <span className="cv-sep"> · </span>
          <a href={cv.links.portfolioUrl} className="cv-link">
            {cv.portfolioLabel}
          </a>
          <span className="cv-sep"> · </span>
          <a href={cv.links.linkedinUrl} className="cv-link">
            {cv.linkedinLabel}
          </a>
        </p>
        <hr className="cv-rule" />
      </header>

      <p className="cv-summary">{renderRichText(cv.summary)}</p>

      <section className="cv-section">
        <h2 className="cv-section-title">EXPERIENCIA PROFESIONAL</h2>
        <hr className="cv-rule" />
        {cv.experience.map((job) => (
          <div key={`${job.company}-${job.dates}`} className="cv-job">
            <div className="cv-row">
              <span className="cv-company">{job.company}</span>
              <span className="cv-meta-bold">{job.location}</span>
            </div>
            <div className="cv-row">
              <span className="cv-role">{job.role}</span>
              <span className="cv-dates">{job.dates}</span>
            </div>
            <ul className="cv-bullets">
              {job.bullets.map((bullet, index) => (
                <li key={index}>{renderRichText(bullet)}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="cv-section">
        <h2 className="cv-section-title">EDUCACIÓN</h2>
        <hr className="cv-rule" />
        {cv.education.map((edu) => (
          <div key={edu.school} className="cv-edu">
            <div className="cv-row">
              <span className="cv-company">{edu.school}</span>
              <span className="cv-meta-bold">{edu.location}</span>
            </div>
            <div className="cv-row">
              <span className="cv-role">{edu.degree}</span>
              <span className="cv-dates">{edu.date}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="cv-section">
        <h2 className="cv-section-title">SKILLS ADICIONALES</h2>
        <hr className="cv-rule" />
        <ul className="cv-skills">
          {cv.skills.map((skill) => (
            <li key={skill.label}>
              <strong>{skill.label}: </strong>
              <span>{renderRichText(skill.value)}</span>
            </li>
          ))}
        </ul>
      </section>
    </article>
  )
}
