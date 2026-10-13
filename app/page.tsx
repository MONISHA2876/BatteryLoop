import Link from "next/link";

const stats = [
  {
    value: "62",
    unit: "M",
    label: "tonnes of e-waste generated globally",
    detail: "in 2022",
    source: "UN Global E-waste Monitor 2024",
  },
  {
    value: "22.3",
    unit: "%",
    label: "formally collected and recycled",
    detail: "of global e-waste",
    source: "UN Global E-waste Monitor 2024",
  },
  {
    value: "40",
    unit: "M",
    label: "electric vehicles on the road globally",
    detail: "in 2023",
    source: "IEA Global EV Outlook 2024",
  },
  {
    value: "$62",
    unit: "B",
    label: "estimated raw-material value in e-waste",
    detail: "in 2022",
    source: "UN Global E-waste Monitor 2024",
  },
];

const problemCards = [
  {
    title: "The visibility gap",
    description:
      "Once a battery leaves its original device or manufacturer, its identity, ownership, and health history often become fragmented. Without a trusted digital record, safe reuse and informed processing become much harder.",
    accent: "fragmented records",
  },
  {
    title: "The premature end of life",
    description:
      "A battery that is no longer suitable for its original application may still retain usable capacity or recoverable materials. Poorly understood condition data can make second-life decisions difficult.",
    accent: "uncertain health",
  },
  {
    title: "The resource recovery gap",
    description:
      "Batteries and electronics contain materials and components with remaining value, but recovery depends on structured testing, collection, and processing infrastructure. That value is often lost when visibility is weak.",
    accent: "recoverable value",
  },
];

const flowSteps = [
  {
    name: "Register",
    summary:
      "Create a unique digital passport with a battery ID, QR-linked record, and documentation from the first registration event.",
    details: "A battery receives a verifiable identity and a trusted record of origin, handling, and ownership checkpoints.",
  },
  {
    name: "Identify",
    summary:
      "Capture the battery’s chemistry, specifications, maintenance history, and ownership changes over time.",
    details: "Users can access who handled the asset, how it was used, and what information is already known before deciding what happens next.",
  },
  {
    name: "Assess",
    summary:
      "Use available battery test data and diagnostics to estimate remaining health and determine the likely next-use pathway.",
    details: "This stage helps differentiate between batteries that may be repurposed, require additional testing, or should move toward recycling.",
  },
  {
    name: "Recover value",
    summary:
      "Pinpoint reusable electronics, recoverable materials, and the likely commercial value in each asset stream.",
    details: "The system separates reusable components from scrap, helping users understand whether an asset should be resold, reused, or processed.",
  },
  {
    name: "Route to the next life",
    summary:
      "Connect suitable batteries and components with buyers, repairers, second-life users, or certified recyclers.",
    details: "This closes the loop by enabling an informed next step rather than treating the battery as disposable once it leaves its first application.",
  },
];

const featureBlocks = [
  {
    id: "passport",
    label: "01 · Digital battery passport",
    title: "A trusted record from first registration to final recovery.",
    description:
      "BatteryLoop gives each battery a unique digital identity with QR-linked records, specifications, lifecycle history, and verification data. It helps people understand what the asset is, where it has been, and what condition it is in.",
    bullet: ["Battery specifications", "Maintenance history", "Verification records"],
  },
  {
    id: "tracking",
    label: "02 · Blockchain lifecycle tracking",
    title: "Timestamped events that build provenance over time.",
    description:
      "Lifecycle events are recorded with time references, custody changes, inspections, and material-handling milestones. Each update contributes to a clearer path of custody and decision-making.",
    bullet: ["Ownership transfer logs", "Inspection history", "Transaction references"],
  },
  {
    id: "health",
    label: "03 · AI battery health assessment",
    title: "Estimates that help prioritize reuse, testing, or recycling.",
    description:
      "BatteryLoop uses available test and sensor data to estimate health, flag risk, and suggest the next step. It makes it easier to distinguish between batteries ready for second life and those that need deeper diagnostics.",
    bullet: ["State of Health estimates", "Risk flags", "Next-step recommendations"],
  },
  {
    id: "scanner",
    label: "04 · AI PCB & e-waste scanner",
    title: "Image-based component identification for recovery decisions.",
    description:
      "Upload a PCB or component image to surface visible parts, damaged areas, and potential reuse opportunities. The system calls out confidence signals and item-level findings without overstating certainty.",
    bullet: ["Visible component detection", "Confidence scoring", "Item-level summary"],
  },
  {
    id: "valuation",
    label: "05 · Component valuation engine",
    title: "Turning recovered assets into actionable value signals.",
    description:
      "Recovered components are appraised against category, condition, quantity, and market context so buyers and recyclers can better understand what is reusable and what is scrap.",
    bullet: ["Indicative pricing", "Condition-based valuation", "Reuse vs scrap split"],
  },
  {
    id: "marketplace",
    label: "06 · Reuse & recycling marketplace",
    title: "A marketplace that favors recovery before disposal.",
    description:
      "BatteryLoop connects sellers, repairers, buyers, and recyclers through a structured catalog of second-life assets and recovered components. Each listing can be filtered by condition, category, and location where available.",
    bullet: ["Search and filter", "Condition labels", "Recovery requests"],
  },
  {
    id: "dashboard",
    label: "07 · Recycler dashboard",
    title: "Operational clarity for inspection and recovery workstreams.",
    description:
      "Recycler teams can review incoming batteries, track recovery actions, document processing status, and maintain traceable records for each lot or asset stream.",
    bullet: ["Incoming requests", "Status tracking", "Recovery summaries"],
  },
  {
    id: "analytics",
    label: "08 · Environmental impact analytics",
    title: "Transparent impact signals without inflated claims.",
    description:
      "The platform tracks assets registered, assessed, reused, and processed so organizations can estimate diversion and recovery outcomes with clear assumptions.",
    bullet: ["Material recovery metrics", "Lifecycle visibility", "Transparent assumptions"],
  },
  {
    id: "verification",
    label: "09 · Verification & trust",
    title: "Evidence-led records from registration through handoff.",
    description:
      "Digital records, QR access, inspection history, and verifiable references create a stronger foundation for trust across owners, buyers, and recyclers.",
    bullet: ["QR access", "Record timeline", "Evidence references"],
  },
  {
    id: "roles",
    label: "10 · Role-based dashboards",
    title: "Built for every participant in the circular battery economy.",
    description:
      "Owners, sellers, repairers, buyers, recyclers, and administrators all interact with the same underlying system but see the workflow and trust signals that matter most to them.",
    bullet: ["Battery owners", "Buyers and repairers", "Recyclers and admins"],
  },
];

const technologyPillars = [
  {
    title: "Blockchain",
    text: "Provides verifiable references for selected lifecycle records, custody transfers, and inspection milestones.",
  },
  {
    title: "AI & Computer Vision",
    text: "Helps interpret available battery data and identify visible electronic components that may be reusable or damaged.",
  },
  {
    title: "Circular Marketplace",
    text: "Connects recoverable assets with organizations and people who can repair, repurpose, purchase, or process them responsibly.",
  },
];

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

function HeroVisual() {
  return (
    <div className="hero-visual" aria-hidden="true">
      <div className="ambient-glow" />
      <div className="ring ring-one" />
      <div className="ring ring-two" />
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />

      <div className="battery-shell">
        <div className="battery-cap" />
        <div className="battery-panel">
          <span className="battery-label">HEALTH STATUS</span>
          <strong>92%</strong>
        </div>

        <div className="battery-rows">
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>

      <div className="floating-tag tag-one">DIGITAL PASSPORT</div>
      <div className="floating-tag tag-two">MATERIAL RECOVERY</div>
      <div className="floating-tag tag-three">HEALTH STATUS</div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="page-shell text-soft" >
      <header className="topbar-wrap">
        <div className="section-shell">
          <nav className="topbar glass-panel" aria-label="Main navigation">
            <Link className="brand" href="#top" aria-label="BatteryLoop home">
              <span className="brand-mark" aria-hidden="true">
                <span className="brand-mark-inner" />
              </span>
              <span className="brand-word">BatteryLoop</span>
            </Link>

            <div className="nav-links" aria-label="Section navigation">
              <a href="#problem">Problem</a>
              <a href="#solution">Our Solution</a>
              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
              <a href="#impact">Impact</a>
            </div>

            <div className="nav-actions">
              <Link className="nav-signin" href="/dashboard">Sign In</Link>
              <Link className="nav-cta" href="/dashboard">
                Explore BatteryLoop <span aria-hidden="true">→</span>
              </Link>
            </div>

            <details className="mobile-nav">
              <summary>Menu</summary>
              <div className="mobile-menu glass-panel">
                <a href="#problem">Problem</a>
                <a href="#solution">Our Solution</a>
                <a href="#features">Features</a>
                <a href="#how-it-works">How It Works</a>
                <a href="#impact">Impact</a>
                <Link href="/dashboard">Explore BatteryLoop</Link>
              </div>
            </details>
          </nav>
        </div>
      </header>

      <section id="top" className="section-shell hero-section reveal">
        <div className="hero-copy reveal">
          <SectionEyebrow>BUILDING THE FUTURE OF CIRCULAR ENERGY</SectionEyebrow>
          <h1>THE BATTERY DOESN&apos;T END HERE.</h1>
          <p className="lead">
            Every battery holds value beyond its first life. BatteryLoop connects
            digital identity, intelligent diagnostics, and circular recovery to help
            batteries and electronic components find their next purpose.
          </p>

          <div className="cta-row">
            <Link className="primary-btn" href="/dashboard">
              Explore BatteryLoop <span aria-hidden="true">→</span>
            </Link>
            <a className="secondary-btn" href="#how-it-works">
              See How It Works <span aria-hidden="true">↓</span>
            </a>
          </div>

          <div className="mini-metrics">
            <div>
              <span className="mini-label">Asset visibility</span>
              <strong>Digital passport</strong>
            </div>
            <div>
              <span className="mini-label">Recovery path</span>
              <strong>Second-life ready</strong>
            </div>
          </div>
        </div>

        <HeroVisual />
      </section>

      <section id="impact" className="stats-section reveal">
        <div className="section-shell stats-inner">
          <div className="section-header">
            <SectionEyebrow>THE SCALE OF UNUSED VALUE</SectionEyebrow>
            <h2>Linear consumption creates a costly blind spot.</h2>
          </div>

          <div className="stats-grid">
            {stats.map((stat, index) => (
              <article key={stat.label} className="glass-panel stat-card reveal" style={{ transitionDelay: `${index * 80}ms` }}>
                <p className="stat-value">
                  {stat.value}
                  <span>{stat.unit}</span>
                </p>
                <p className="stat-label">{stat.label}</p>
                <p className="stat-detail">{stat.detail}</p>
                <p className="stat-source">Source: {stat.source}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="problem" className="section-shell problem-section reveal">
        <div className="section-header narrow reveal">
          <SectionEyebrow>THE HIDDEN COST OF LINEAR CONSUMPTION</SectionEyebrow>
          <h2>We build the future with batteries. Then we lose their value.</h2>
        </div>

        <div className="problem-grid">
          {problemCards.map((problem, index) => (
            <article key={problem.title} className="glass-panel problem-card reveal" style={{ transitionDelay: `${index * 100}ms` }}>
              <div className="problem-visual">
                <span className="problem-accent">{problem.accent}</span>
                <div className="problem-lines" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
              <h3>{problem.title}</h3>
              <p>{problem.description}</p>
            </article>
          ))}
        </div>

        <p className="problem-strapline">
          The problem isn&apos;t just waste. It&apos;s lost visibility, lost trust, and lost value.
        </p>
      </section>

      <section id="solution" className="section-shell solution-section reveal">
        <div className="section-header narrow reveal">
          <SectionEyebrow>ONE CONNECTED CIRCULAR SYSTEM</SectionEyebrow>
          <h2>From a discarded battery to a traceable second life.</h2>
          <p className="section-lead">
            BatteryLoop connects the physical battery with a digital record,
            intelligent assessment, and a recovery ecosystem — making it easier
            to understand what a battery is, what condition it is in, and where
            it can go next.
          </p>
        </div>

        <div className="flow-outer glass-panel reveal" id="how-it-works">
          <div className="flow-grid">
            {flowSteps.map((step, index) => (
              <details key={step.name} className="flow-step reveal" open={index === 0} style={{ transitionDelay: `${index * 100}ms` }}>
                <summary>
                  <span className="step-number">0{index + 1}</span>
                  <span>{step.name}</span>
                </summary>
                <div className="flow-panel">
                  <p>{step.summary}</p>
                  <small>{step.details}</small>
                </div>
              </details>
            ))}
          </div>
        </div>

        <div className="lifecycle-strip" aria-label="Lifecycle cycle">
          <span>COLLECT</span>
          <span>DIAGNOSE</span>
          <span>REPURPOSE</span>
          <span>RECYCLE</span>
          <span>REPEAT</span>
        </div>
      </section>

      <section id="features" className="section-shell feature-section reveal">
        <div className="section-header narrow reveal">
          <SectionEyebrow>CORE CAPABILITIES</SectionEyebrow>
          <h2>Everything needed to move batteries and components through a circular system.</h2>
        </div>

        <div className="feature-list">
          {featureBlocks.map((feature, index) => (
            <article
              key={feature.id}
              className={`feature-card glass-panel reveal ${index % 2 === 0 ? "feature-normal" : "feature-reverse"}`}
              style={{ transitionDelay: `${index * 80}ms` }}
            >
              <div className="feature-copy">
                <p className="feature-label">{feature.label}</p>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <ul>
                  {feature.bullet.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className={`feature-visual visual-${feature.id}`} aria-hidden="true">
                {feature.id === "passport" && (
                  <>
                    <div className="passport-card">
                      <div className="qr-box" />
                      <div className="passport-info">
                        <span>BL-2048</span>
                        <strong>LFP-48V</strong>
                        <small>Verified</small>
                      </div>
                    </div>
                    <div className="passport-status">
                      <span className="status-dot" />
                      Active passport
                    </div>
                  </>
                )}

                {feature.id === "tracking" && (
                  <>
                    <div className="timeline-track" />
                    <div className="timeline-steps">
                      <span>Register</span>
                      <span>Inspect</span>
                      <span>Transfer</span>
                      <span>Recycle</span>
                    </div>
                  </>
                )}

                {feature.id === "health" && (
                  <>
                    <div className="gauge-wrap">
                      <div className="gauge-ring">
                        <div className="gauge-inner">92%</div>
                      </div>
                    </div>
                    <div className="health-bars">
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                  </>
                )}

                {feature.id === "scanner" && (
                  <>
                    <div className="scanner-frame">
                      <span className="box box-one" />
                      <span className="box box-two" />
                      <span className="box box-three" />
                    </div>
                    <div className="scan-results">
                      <span>Capacitor</span>
                      <span>IC chip</span>
                      <span>Relay</span>
                    </div>
                  </>
                )}

                {feature.id === "valuation" && (
                  <>
                    <div className="value-stack">
                      <span>PCB</span>
                      <span>Cells</span>
                      <span>Metal</span>
                    </div>
                    <div className="value-total">
                      <small>Estimated recovery</small>
                      <strong>$1,240</strong>
                    </div>
                  </>
                )}

                {feature.id === "marketplace" && (
                  <>
                    <div className="market-row">
                      <span>Condition</span>
                      <strong>Grade A</strong>
                    </div>
                    <div className="market-row alt">
                      <span>Price</span>
                      <strong>$420</strong>
                    </div>
                    <div className="market-row">
                      <span>Location</span>
                      <strong>Berlin</strong>
                    </div>
                  </>
                )}

                {feature.id === "dashboard" && (
                  <>
                    <div className="kanban-board">
                      <span>Received</span>
                      <span>Inspecting</span>
                      <span>Recovered</span>
                    </div>
                  </>
                )}

                {feature.id === "analytics" && (
                  <>
                    <div className="impact-chart">
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                    <div className="impact-score">+18.4% diversion</div>
                  </>
                )}

                {feature.id === "verification" && (
                  <>
                    <div className="verify-card">
                      <span className="verify-badge">Verified</span>
                      <small>QR access</small>
                      <strong>BL-2048</strong>
                    </div>
                  </>
                )}

                {feature.id === "roles" && (
                  <>
                    <div className="role-orbit">
                      <span>Owners</span>
                      <span>Buyers</span>
                      <span>Recyclers</span>
                    </div>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="technology" className="section-shell technology-section reveal">
        <div className="section-header narrow reveal">
          <SectionEyebrow>PHYSICAL ASSETS. DIGITAL TRUST. INTELLIGENT RECOVERY.</SectionEyebrow>
          <h2>Three systems, one connected circular layer.</h2>
        </div>

        <div className="technology-grid">
          {technologyPillars.map((pillar, index) => (
            <article key={pillar.title} className="glass-panel tech-card reveal" style={{ transitionDelay: `${index * 100}ms` }}>
              <h3>{pillar.title}</h3>
              <p>{pillar.text}</p>
            </article>
          ))}
        </div>

        <div className="architecture-diagram glass-panel reveal">
          <div className="diagram-row">
            <span>PHYSICAL BATTERY / PCB</span>
            <span>QR DIGITAL PASSPORT</span>
            <span>APPLICATION + DATABASE</span>
          </div>
          <div className="diagram-row middle-row">
            <span>AI ASSESSMENT</span>
            <span>BLOCKCHAIN LAYER</span>
            <span>MARKETPLACE / RECYCLER</span>
          </div>
        </div>
      </section>

      <section className="section-shell dashboard-preview-section reveal">
        <div className="dashboard-header reveal">
          <SectionEyebrow>PRODUCT PREVIEW · SAMPLE DATA</SectionEyebrow>
          <h2>A live product feel without pretending the backend is live.</h2>
        </div>

        <div className="dashboard-preview glass-panel reveal">
          <div className="dashboard-topbar">
            <div className="dashboard-pill">BatteryLoop</div>
            <div className="dashboard-pill muted-pill">Platform overview</div>
          </div>

          <div className="dashboard-metrics">
            <div className="dashboard-stat">
              <span>Batteries registered</span>
              <strong>14,280</strong>
            </div>
            <div className="dashboard-stat">
              <span>Passports verified</span>
              <strong>9,760</strong>
            </div>
            <div className="dashboard-stat">
              <span>Assets evaluated</span>
              <strong>2,410</strong>
            </div>
            <div className="dashboard-stat">
              <span>Recovery requests</span>
              <strong>468</strong>
            </div>
          </div>

          <div className="dashboard-content">
            <div className="dashboard-panel small-panel">
              <h4>Reuse and recycling status</h4>
              <ul>
                <li>
                  <span>Reused</span>
                  <strong>36%</strong>
                </li>
                <li>
                  <span>Recycling</span>
                  <strong>29%</strong>
                </li>
                <li>
                  <span>Awaiting review</span>
                  <strong>21%</strong>
                </li>
              </ul>
            </div>

            <div className="dashboard-panel chart-panel">
              <h4>Lifecycle recovery</h4>
              <div className="recovery-chart" aria-hidden="true">
                <span className="bar bar-1" />
                <span className="bar bar-2" />
                <span className="bar bar-3" />
                <span className="bar bar-4" />
                <span className="bar bar-5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell final-cta-section reveal">
        <div className="final-cta glass-panel reveal">
          <div className="cta-copy">
            <SectionEyebrow>GIVE EVERY BATTERY A NEXT CHAPTER</SectionEyebrow>
            <h2>Give every battery a next chapter.</h2>
            <p>
              Build a more transparent, traceable, and circular future for batteries
              and electronic components.
            </p>
          </div>

          <div className="cta-actions">
            <Link className="primary-btn" href="/dashboard">
              Explore the Platform <span aria-hidden="true">→</span>
            </Link>
            <a className="secondary-btn" href="#how-it-works">
              See the Lifecycle <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
      </section>

      <footer id="footer" className="section-shell footer-shell">
        <div className="footer-content glass-panel">
          <div className="footer-brand">
            <a href="#top" className="brand footer-brand-link">
              <span className="brand-mark" aria-hidden="true">
                <span className="brand-mark-inner" />
              </span>
              <span className="brand-word">BatteryLoop</span>
            </a>
            <p>
              Battery passport infrastructure for second-life batteries, recovered components,
              and transparent circular resource flows.
            </p>
          </div>

          <div className="footer-links">
            <div>
              <h4>Navigate</h4>
              <a href="#problem">Problem</a>
              <a href="#solution">Solution</a>
              <a href="#features">Features</a>
            </div>
            <div>
              <h4>Technology</h4>
              <a href="#technology">Blockchain</a>
              <a href="#technology">AI</a>
              <a href="#technology">Marketplace</a>
            </div>
          </div>

          <div className="footer-mission">
            <h4>Mission</h4>
            <p>
              Connect material identity, intelligent recovery, and trust to keep valuable assets in use for longer.
            </p>
            <a href="https://github.com" target="_blank" rel="noreferrer">
              GitHub
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 BatteryLoop</span>
          <span>Designing a more circular energy future.</span>
        </div>
      </footer>
    </main>
  );
}
