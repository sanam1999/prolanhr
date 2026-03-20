import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";

(() => {
  if (document.getElementById("__pp_fonts")) return;
  const l = document.createElement("link");
  l.id = "__pp_fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap";
  document.head.appendChild(l);
})();

const f = "'DM Sans', sans-serif";
const mono = "'DM Mono', monospace";

const BG = "#f0f4f2";
const WHITE = "#ffffff";
const DIVIDER = "#e8eeed";
const TEXT = "#1c2b25";
const TEXT2 = "#403d3d";
const TEXT3 = "#8a8a8a";
const ACCENT = "#3d8c6e";
const ACCENT_LT = "#eaf5ef";

const SECTIONS = [
  {
    q: "1. Company Overview",
    a: `ProLab R is a technology solutions company delivering secure, scalable, and intelligent digital systems across global markets. Our services include Web Development, Mobile Applications, Standalone Systems, Artificial Intelligence & Machine Learning, Cybersecurity Solutions, and Research & Development.
We are committed to innovation, technical excellence, ethical conduct, and longterm client partnerships.`,
  },
  {
    q: "2. Vision, Mission & Strategic Objectives",
    a: `Vision
To become a globally recognized technology partner known for innovation, security, and reliability.

Mission
• Deliver highquality, secure, and scalable digital solutions.
• Integrate AI-driven innovation into modern business systems.
• Maintain international cybersecurity and compliance standards.
• Build sustainable, long-term client relationships.

Strategic Objectives
• Expand international partnerships.
• Strengthen AI/ML and Cybersecurity capabilities.
• Maintain operational excellence and compliance.
• Foster continuous employee development.`,
  },
  {
    q: "3. Core Values",
    a: `1. Integrity – Ethical and transparent conduct in all operations.
2. Innovation – Continuous improvement and creative problem-solving.
3. Accountability – Ownership of responsibilities and results.
4. Security – Protection of digital assets and sensitive data.
5. Excellence – Commitment to high-quality delivery standards.
6. Collaboration – Respectful teamwork and global partnership mindset.`,
  },
  {
    q: "4. Scope of Policy",
    a: `This policy applies to:
• Full-time and part-time employees
• Interns and trainees
• Contractors and consultants
• Strategic partners working under ProLab R agreements

All personnel must comply with this policy at all times.`,
  },
  {
    q: "5. Code of Professional Conduct",
    a: `5.1 Workplace Behavior
• Maintain professionalism in all interactions.
• Zero tolerance for discrimination, harassment, or misconduct.
• Respect diversity, culture, and international business norms.

5.2 Conflicts of Interest
Employees must disclose any personal or financial interests that may conflict with company interests.

5.3 Confidential Communication
• Use official communication channels for client discussions.
• Do not disclose internal strategies, pricing, or proprietary information.`,
  },
  {
    q: "6. Information Security & Cybersecurity Policy",
    a: `Given the nature of our business, cybersecurity is mandatory and nonnegotiable.
All personnel must:
• Use strong passwords and multi-factor authentication.
• Keep systems updated with security patches.
• Store client data in encrypted environments.
• Report suspected breaches immediately.
• Perform penetration testing or security assessments only with written authorization.

Violation of security policies may result in immediate disciplinary action.`,
  },
  {
    q: "7. Data Protection & Privacy",
    a: `ProLab R complies with applicable international data protection standards.
• Personal and client data must be processed lawfully.
• Data collection must follow the principle of minimal necessity.
• Sensitive data must never be shared externally without approval.
• Data retention policies must be followed strictly.`,
  },
  {
    q: "8. Intellectual Property Policy",
    a: `• All software, source code, designs, research outputs, and documentation created under employment belong to ProLab R unless otherwise defined by contract.
• Unauthorized reuse of client or company code is strictly prohibited.
• Employees must sign a Non-Disclosure Agreement (NDA).`,
  },
  {
    q: "9. Project Delivery Standards",
    a: `To maintain quality and scalability:
• Projects must follow defined development methodologies (Agile, Scrum, or Hybrid).
• Version control systems must be used for all code.
• Proper documentation is mandatory.
• QA and security testing must be conducted before deployment.
• Client approvals must be documented formally.`,
  },
  {
    q: "10. Remote Work & Operational Policy",
    a: `• Employees must remain available during agreed working hours.
• Meetings must be attended punctually.
• Progress must be tracked through approved project management tools.
• Company assets must be used responsibly and securely.`,
  },
  {
    q: "11. Financial & Ethical Business Practices",
    a: `ProLab R follows strict anti-corruption principles.
• Bribery, kickbacks, or unethical incentives are prohibited.
• All financial transactions must be transparent and documented.
• Client contracts must be approved by management.
• Gifts or benefits exceeding reasonable value must be declared.`,
  },
  {
    q: "12. Social Media & Public Representation",
    a: `• Only authorized representatives may speak publicly on behalf of ProLab R.
• Employees must not disclose confidential information on social platforms.
• Brand identity and reputation must be protected at all times.`,
  },
  {
    q: "13. Employee Development & Learning",
    a: `ProLab R encourages:
• Continuous professional certification
• AI/ML and cybersecurity skill enhancement
• Participation in research and innovation
• Knowledge sharing within the organization`,
  },
  {
    q: "14. Health, Safety & WellBeing",
    a: `• Maintain a respectful and safe working environment.
• Encourage work-life balance.
• Support mental and physical well-being.`,
  },
  {
    q: "15. Leave Policy",
    a: `ProLab R provides structured leave benefits to ensure employee well-being while maintaining operational continuity.

15.1 Annual Leave
• Full-time employees are entitled to annual paid leave as defined in their employment contract.
• Leave must be requested in advance through the approved internal process.
• Approval is subject to project schedules and management discretion.

15.2 Casual Leave
• Employees may request short-term leave for urgent personal matters.
• Casual leave must be informed at least 24 hours in advance unless in an emergency.

15.3 Medical / Sick Leave
• Employees are entitled to sick leave when medically unfit to work.
• A medical certificate may be required for absences exceeding two consecutive days.
• Employees must inform their supervisor as soon as possible.

15.4 Emergency Leave
• Emergency leave may be granted for unforeseen serious situations.
• Management approval is required.

15.5 Maternity / Paternity Leave
• Leave will be granted in accordance with applicable labor laws.
• Employees must provide prior notice and necessary documentation.

15.6 Unpaid Leave
• Unpaid leave may be granted under special circumstances.
• Approval depends on operational requirements and management discretion.

15.7 Public Holidays
• Employees are entitled to public holidays as declared by the relevant government authority.
• Work required on public holidays will be compensated according to company policy or employment agreement.`,
  },
  {
    q: "16. Disciplinary Actions",
    a: `Non-compliance may result in:
• Verbal Warning
• Written Warning
• Suspension
• Termination of Employment
• Legal Action (if required)

Management reserves full authority to investigate violations.`,
  },
  {
    q: "17. Policy Review & Amendments",
    a: `This policy will be reviewed annually or when required by operational or legal changes.`,
  },
  {
    q: "18. Acknowledgment & Acceptance",
    a: `All employees and affiliates must sign a formal acknowledgment confirming:
• They have read and understood this policy.
• They agree to comply with all rules and regulations.`,
  },
];

function AccordionItem({
  q, a, index, isOpen, onToggle,
}: {
  q: string; a: string; index: number; isOpen: boolean; onToggle: () => void;
}) {
  return (
    <div style={{
      borderBottom: `1px solid ${DIVIDER}`,
      transition: "background 0.15s",
    }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
          padding: "20px 0",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left" as const,
        }}
      >
        {/* Index + question */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flex: 1, minWidth: 0 }}>
          <span style={{
            fontFamily: f,
            fontSize: 15,
            fontWeight: isOpen ? 600 : 500,
            color: isOpen ? TEXT : TEXT2,
            lineHeight: 1.5,
            letterSpacing: "-0.1px",
            transition: "color 0.15s, font-weight 0.1s",
          }}>
            {q}
          </span>
        </div>

        {/* Chevron */}
        <span style={{
          fontFamily: mono,
          fontSize: 11,
          color: isOpen ? ACCENT : TEXT3,
          flexShrink: 0,
          transition: "color 0.15s, transform 0.2s",
          display: "inline-block",
          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
        }}>
          ⌄
        </span>
      </button>

      {/* Answer */}
      {isOpen && (
        <div style={{
          paddingLeft: 38,
          paddingBottom: 20,
          paddingRight: 4,
        }}>
          <div style={{
            background: ACCENT_LT,
            borderLeft: `3px solid ${ACCENT}`,
            borderRadius: "0 8px 8px 0",
            padding: "14px 18px",
          }}>
            <p style={{
              fontFamily: f,
              fontSize: 13,
              fontWeight: 400,
              color: TEXT2,
              lineHeight: 1.75,
              margin: 0,
              whiteSpace: "pre-line",
            }}>
              {a}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PrivacyPolicy() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <AppLayout title="Privacy Policy">
      <div style={{
        fontFamily: f,
        background: BG,
        minHeight: "100vh",
        padding: "28px 32px",
        boxSizing: "border-box",
      }}>

        {/* Page title bar */}


        {/* Main card */}
        <div style={{
          background: WHITE,
          border: `1px solid ${DIVIDER}`,
          borderRadius: 14,
          padding: "28px 32px",
          margin: "0 auto",
        }}>

          {/* Heading */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{
              fontFamily: f,
              fontSize: 28,
              fontWeight: 700,
              color: TEXT,
              letterSpacing: "-0.5px",
              margin: "0 0 6px",
              lineHeight: 1.2,
            }}>
              Privacy Policy
            </h1>
            <p style={{
              fontFamily: f,
              fontSize: 13,
              fontWeight: 400,
              color: TEXT3,
              margin: 0,
              lineHeight: 1.6,
            }}>
              We believe in transparency. Read how we handle your data.
            </p>
          </div>

          {/* Sub-label */}
          <div style={{
            fontFamily: mono,
            fontSize: 9,
            fontWeight: 500,
            color: TEXT3,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: 4,
          }}>
            Explore the policy
          </div>

          {/* Accordion */}
          <div>
            {SECTIONS.map((s, i) => (
              <AccordionItem
                key={i}
                index={i}
                q={s.q}
                a={s.a}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))}
          </div>

          {/* Footer note */}
          <div style={{
            marginTop: 28,
            paddingTop: 20,
            borderTop: `1px solid ${DIVIDER}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
          }}>
            <span style={{ fontFamily: f, fontSize: 12, color: TEXT3 }}>
              Contact us at <br /> <p style={{ color: ACCENT, textDecoration: "none", fontWeight: 500 }}>+94 (71) 234 567 </p>
              <a href="mailto:prolab.gmail.com" style={{ color: ACCENT, textDecoration: "none", fontWeight: 500 }}>
                prolab@gmail.com
              </a>
            </span>
            <span style={{ fontFamily: mono, fontSize: 13, color: TEXT3 }}>
              last updated 2026/01/01
            </span>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}