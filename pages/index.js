// pages/index.js
import Head from 'next/head'
import { useState } from 'react'
import styles from '../styles/Home.module.css'

export default function Home() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    college: '', year: '', level: '', path: ''
  })
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('')

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.message)
    }
  }

  return (
    <>
      <Head>
        <title>SkillBridge — Build Real Skills. Get Real Jobs.</title>
        <meta name="description" content="A free community platform helping rural and non-IT students build real tech skills and get hired. No tutorials. No copy-paste. Real learning." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="SkillBridge — Build Real Skills. Get Real Jobs." />
        <meta property="og:description" content="Join 2,400+ students from tier-3 colleges building real careers in tech." />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌉</text></svg>" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,700;1,9..144,400&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap" rel="stylesheet" />
      </Head>

      {/* ── NAVBAR ── */}
      <nav className={styles.nav}>
        <div className={styles.container}>
          <div className={styles.navInner}>
            <a href="#" className={styles.logo}>
              <div className={styles.logoIcon}>S</div>
              Skill<span>Bridge</span>
            </a>
            <ul className={styles.navLinks}>
              <li><a href="#problem">The Reality</a></li>
              <li><a href="#paths">Skill Paths</a></li>
              <li><a href="#community">Community</a></li>
              <li><a href="#about">About</a></li>
            </ul>
            <a href="#join" className={`${styles.btn} ${styles.btnPrimary} ${styles.navCta}`}>Join Free</a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <div className={styles.heroBadge}>
                <div className={styles.heroBadgeDot}></div>
                Free Community Platform
              </div>
              <h1 className={styles.heroH1}>
                Your Degree is Not Enough —<br/>But <em>You Are</em>
              </h1>
              <p className={styles.heroPara}>
                Most students graduate knowing theory but failing interviews. SkillBridge bridges the gap between what college teaches and what industry actually demands — through real thinking, honest mentorship, and a community that truly gets it.
              </p>
              <div className={styles.heroCtas}>
                <a href="#join" className={`${styles.btn} ${styles.btnSaffron}`}>Join the Community</a>
                <a href="#paths" className={`${styles.btn} ${styles.btnGhostWhite}`}>Explore Skills →</a>
              </div>
              <div className={styles.heroStats}>
                <div><div className={styles.heroStatNum}>2,400+</div><div className={styles.heroStatLabel}>Students joined</div></div>
                <div><div className={styles.heroStatNum}>100%</div><div className={styles.heroStatLabel}>Free to join</div></div>
                <div><div className={styles.heroStatNum}>8PM</div><div className={styles.heroStatLabel}>Daily live sessions</div></div>
              </div>
            </div>
            <div className={styles.heroVisual}>
              <div className={styles.heroCardStack}>
                <div className={`${styles.heroFloatCard} ${styles.heroFloatCardAccent}`}>
                  <div className={styles.hfcTop}>
                    <div className={styles.hfcAvatar} style={{background:'rgba(14,165,164,0.3)',color:'#7FF0EF'}}>RK</div>
                    <div>
                      <div className={styles.hfcName}>Rahul K.</div>
                      <div className={styles.hfcMeta}>B.Sc Agriculture → Web Dev</div>
                    </div>
                  </div>
                  <div className={styles.hfcBody}>Placed at a <strong>startup in Pune</strong> after 4 months. Never thought this was possible for a non-CS student.</div>
                  <div className={styles.progressBar}><div className={styles.progressFill} style={{width:'78%'}}></div></div>
                </div>
                <div className={styles.heroFloatCard}>
                  <div className={styles.hfcTop}>
                    <div className={styles.hfcAvatar} style={{background:'rgba(255,153,51,0.25)',color:'#FFB84D'}}>PS</div>
                    <div>
                      <div className={styles.hfcName}>Priya S.</div>
                      <div className={styles.hfcMeta}>Tier-3 college · 2nd year</div>
                    </div>
                  </div>
                  <div className={styles.hfcBody}>Understood <strong>how REST APIs actually work</strong> by building one — not by watching a tutorial.</div>
                  <span className={`${styles.hfcTag} ${styles.hfcTagOrange}`}>🔥 Learning by doing</span>
                </div>
                <div className={`${styles.heroFloatCard} ${styles.heroFloatCardSaffron}`}>
                  <div style={{fontSize:'0.78rem',color:'rgba(255,255,255,0.55)',marginBottom:'8px'}}>Daily Live Session — CS02</div>
                  <div style={{fontSize:'0.95rem',fontWeight:'700',color:'#fff',marginBottom:'6px'}}>Daily Coding Practice</div>
                  <div style={{fontSize:'0.82rem',color:'rgba(255,255,255,0.6)'}}>Every day · 8:00 PM IST · Google Meet</div>
                  <div className={styles.progressBar} style={{marginTop:'12px'}}><div className={`${styles.progressFill} ${styles.progressFillSaffron}`} style={{width:'91%'}}></div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section className={styles.problem} id="problem">
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={`${styles.sectionLabel} ${styles.sectionLabelOrange}`}>The Reality Check</div>
            <h2 className={styles.h2}>What&apos;s <em>Actually</em> Going Wrong?</h2>
            <p className={styles.sectionIntro}>It&apos;s not that you&apos;re not smart enough. Nobody told you what really matters — until now.</p>
          </div>
          <div className={`${styles.cardGrid} ${styles.cardGrid2}`}>
            {[
              { left:'Memorization', right:'Understanding', emoji:'🧠', title:"You know definitions. Not thinking.", body:"Textbooks reward cramming. Interviews reward reasoning. Most students can define a linked list but can't explain why to use one over an array." },
              { left:'Tutorial Hell', right:'Real Building', emoji:'📺', title:"You watch. You don't build.", body:"Watching 300 hours of video creates the feeling of learning. Real understanding comes from building something broken and fixing it yourself." },
              { left:'Your Degree', right:'Your Skills', emoji:'🎓', title:"A degree gets you shortlisted. Skills get you hired.", body:"Companies don't hire certificates. They hire people who can solve problems. Your B.Tech from a tier-3 college is not the ceiling — your skills are." },
              { left:'Fear', right:'Confidence', emoji:'💬', title:"Interview fear is just unfamiliarity.", body:"Nobody teaches you how to think out loud, handle unknown questions, or articulate your reasoning. It's a learnable skill — not a talent." },
            ].map((item, i) => (
              <div className={styles.card} key={i}>
                <div className={styles.problemVs}>
                  <div className={styles.problemVsLeft}>{item.left}</div>
                  <div className={styles.problemVsArrow}>→</div>
                  <div className={styles.problemVsRight}>{item.right}</div>
                </div>
                <div className={styles.problemCard}>
                  <div className={styles.problemIcon}>{item.emoji}</div>
                  <div>
                    <h3 className={styles.cardH3}>{item.title}</h3>
                    <p className={styles.cardP}>{item.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INDUSTRY ── */}
      <section className={styles.industry} id="industry">
        <div className={styles.container}>
          <div className={`${styles.sectionHeader} ${styles.centered}`}>
            <div className={styles.sectionLabel}>Industry Reality</div>
            <h2 className={styles.h2}>What <em>Industry</em> Actually Expects</h2>
            <p className={styles.sectionIntro}>Forget what your placement cell told you. Here&apos;s what real hiring managers look for.</p>
          </div>
          <div className={`${styles.cardGrid} ${styles.cardGrid4}`}>
            {[
              { num:'01', title:'Problem-Solving Ability', body:'Not just code — the ability to break a complex problem into smaller pieces and reason through them step by step.', quote:'"Show me how you think"' },
              { num:'02', title:'Communication Skills', body:"Can you explain your code to a non-technical manager? Can you ask the right clarifying questions before jumping in?", quote:'"Tell me your approach"' },
              { num:'03', title:'Real Project Experience', body:"One messy, half-broken real project beats ten perfect tutorials. We want to see your decision-making, not just clean code.", quote:'"What did you build?"' },
              { num:'04', title:'Thinking Approach', body:"Curiosity. The habit of asking why something works, not just how. This separates average engineers from great ones.", quote:'"Why did you choose that?"' },
            ].map((item, i) => (
              <div className={`${styles.card} ${styles.industryCard}`} key={i}>
                <div className={styles.industryNum}>{item.num}</div>
                <h3 className={styles.cardH3}>{item.title}</h3>
                <p className={styles.cardP}>{item.body}</p>
                <span className={styles.quotePill}>{item.quote}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PATHS ── */}
      <section className={styles.paths} id="paths">
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionLabel}>Choose Your Direction</div>
            <h2 className={styles.h2}>Find the Path <em>That Fits You</em></h2>
            <p className={styles.sectionIntro}>No path is better than another. The best one is the one you stay consistent with.</p>
          </div>
          <div className={`${styles.cardGrid} ${styles.cardGrid3}`}>
            {[
              { emoji:'🌐', title:'Web Development', diff:'Beginner-friendly', diffClass:'beginner', color:'web', why:'Visual feedback makes learning faster and more satisfying', where:'Startups, product companies, freelancing, agencies', start:'HTML → CSS → JavaScript — in that order' },
              { emoji:'☕', title:'Java Backend', diff:'Intermediate', diffClass:'intermediate', color:'java', why:'Highest-paying roles in India are backend-heavy', where:'Banks, MNCs, product companies, large-scale apps', start:'Core Java, OOP thinking, then Spring Boot' },
              { emoji:'🤖', title:'AI / Machine Learning', diff:'Advanced', diffClass:'advanced', color:'ai', why:'Math background? This rewards analytical thinkers most', where:'AI startups, research, product teams, global companies', start:'Python → math intuition → ML fundamentals' },
            ].map((item, i) => (
              <div className={`${styles.card} ${styles.pathCard} ${styles[item.color]}`} key={i}>
                <span className={styles.pathEmoji}>{item.emoji}</span>
                <div className={styles.pathHeader}>
                  <h3 className={styles.cardH3}>{item.title}</h3>
                  <span className={`${styles.difficulty} ${styles[item.diffClass]}`}>● {item.diff}</span>
                </div>
                <div className={styles.pathDetails}>
                  <div className={styles.pathDetail}><span className={styles.pathDetailIcon}>🎯</span><span className={styles.pathDetailText}><strong>Start with:</strong> {item.start}</span></div>
                  <div className={styles.pathDetail}><span className={styles.pathDetailIcon}>🏭</span><span className={styles.pathDetailText}><strong>Used in:</strong> {item.where}</span></div>
                  <div className={styles.pathDetail}><span className={styles.pathDetailIcon}>💡</span><span className={styles.pathDetailText}><strong>Why this?</strong> {item.why}</span></div>
                </div>
                <a href="#join" className={`${styles.pathCta} ${styles[`pathCta_${item.color}`]}`}>Start this path →</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PHILOSOPHY ── */}
      <section className={styles.philosophy}>
        <div className={styles.container}>
          <div className={`${styles.sectionHeader} ${styles.centered} ${styles.phiHeader}`}>
            <div className={styles.sectionLabel}>Our Method</div>
            <h2 className={`${styles.h2} ${styles.h2White}`}>How We Learn <em style={{color:'#FF9933'}}>Differently</em></h2>
            <p className={`${styles.sectionIntro} ${styles.introDark}`}>Not another tutorial platform. Real learning happens through struggle, curiosity, and honest reflection.</p>
          </div>
          <div className={styles.phiGrid}>
            {[
              { num:'01', title:'Learn by Making Mistakes', body:"We don't protect you from errors. We show you why things break and help you develop the instinct to debug independently." },
              { num:'02', title:'Ask WHY, Not Just HOW', body:"Any tutorial can show you how to write a loop. We teach you why that loop is the right choice — and when it isn't." },
              { num:'03', title:'No Spoon-Feeding', body:"We ask questions before we give answers. The discomfort of not-knowing is where real learning lives. We sit in it together." },
              { num:'04', title:'Thinking Over Memorization', body:"We don't want you to remember our answers. We want you to build the confidence to arrive at your own answers under pressure." },
            ].map((item, i) => (
              <div className={styles.phiCard} key={i}>
                <div className={styles.phiNum}>{item.num}</div>
                <h3 className={styles.phiCardH3}>{item.title}</h3>
                <p className={styles.phiCardP}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMUNITY + JOIN FORM ── */}
      <section className={styles.community} id="community">
        <div className={styles.container}>
          <div className={styles.communityLayout}>
            <div>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionLabel}>Join Us</div>
                <h2 className={styles.h2}>You&apos;re <em>Not Alone</em> in This</h2>
                <p className={styles.sectionIntro}>2,400+ students from tier-2 and tier-3 colleges, non-IT backgrounds, and rural towns — all figuring it out together.</p>
              </div>
              <div className={`${styles.card} ${styles.joinCard}`} id="join">
                {status === 'success' ? (
                  <div className={styles.joinSuccess}>
                    <div className={styles.successEmoji}>🎉</div>
                    <h3>You&apos;re in! Welcome to SkillBridge.</h3>
                    <p>Check your inbox — we&apos;ve sent you an acknowledgement email with your <strong>Daily Coding Practice</strong> (CS02) calendar invite. See you at 8 PM IST!</p>
                  </div>
                ) : (
                  <>
                    <div className={styles.joinFormHeader}>
                      <div className={styles.joinFormTitle}>Join SkillBridge — It&apos;s Free</div>
                      <div className={styles.joinFormSub}>Takes 30 seconds. No spam. No fees. Ever.</div>
                    </div>
                    <form className={styles.joinForm} onSubmit={handleSubmit}>
                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label htmlFor="firstName">First Name *</label>
                          <input id="firstName" name="firstName" type="text" placeholder="Rahul" required value={form.firstName} onChange={handleChange} />
                        </div>
                        <div className={styles.formGroup}>
                          <label htmlFor="lastName">Last Name</label>
                          <input id="lastName" name="lastName" type="text" placeholder="Kumar" value={form.lastName} onChange={handleChange} />
                        </div>
                      </div>
                      <div className={styles.formGroup}>
                        <label htmlFor="email">Email Address *</label>
                        <input id="email" name="email" type="email" placeholder="rahul@gmail.com" required value={form.email} onChange={handleChange} />
                      </div>
                      <div className={styles.formGroup}>
                        <label htmlFor="college">College Name *</label>
                        <input id="college" name="college" type="text" placeholder="XYZ Engineering College, Pune" required value={form.college} onChange={handleChange} />
                      </div>
                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label htmlFor="year">Year *</label>
                          <select id="year" name="year" required value={form.year} onChange={handleChange}>
                            <option value="">Select year</option>
                            <option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option><option>Graduated</option>
                          </select>
                        </div>
                        <div className={styles.formGroup}>
                          <label htmlFor="level">Skill Level *</label>
                          <select id="level" name="level" required value={form.level} onChange={handleChange}>
                            <option value="">Where are you?</option>
                            <option>Complete Beginner</option><option>Know a bit of coding</option><option>Intermediate</option><option>Looking for jobs</option>
                          </select>
                        </div>
                      </div>
                      <div className={styles.formGroup}>
                        <label htmlFor="path">I want to learn</label>
                        <select id="path" name="path" value={form.path} onChange={handleChange}>
                          <option value="">Choose a skill path</option>
                          <option>Web Development</option><option>Java Backend</option><option>AI / Machine Learning</option><option>Not sure yet</option>
                        </select>
                      </div>
                      {status === 'error' && (
                        <div className={styles.errorMsg}>⚠️ {errorMsg}</div>
                      )}
                      <button type="submit" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnFullWidth}`} disabled={status === 'loading'}>
                        {status === 'loading' ? 'Joining...' : 'Join the Community — Free →'}
                      </button>
                      <div className={styles.formNote}>🔒 No spam. No fees. You&apos;ll get an email + Daily Coding Practice invite instantly.</div>
                    </form>
                  </>
                )}
              </div>
            </div>
            <div className={styles.communityHighlights}>
              {[
                { icon:'👥', num:'2,400+', label:'Students across 180+ colleges in India', bg:'#E0F5F5' },
                { icon:'📅', num:'Daily', label:'CS02 Coding Practice session at 8 PM IST on Google Meet', bg:'#FFF3E5' },
                { icon:'🏆', num:'Weekly', label:'Mock interview sessions with real peer feedback', bg:'#EEF2FF' },
                { icon:'🧑‍🏫', num:'Mentors', label:'Industry professionals who were once exactly like you', bg:'#F0FDF4' },
              ].map((item, i) => (
                <div className={styles.cscCard} key={i}>
                  <div className={styles.cscIcon} style={{background:item.bg}}>{item.icon}</div>
                  <div>
                    <div className={styles.cscNum}>{item.num}</div>
                    <div className={styles.cscLabel}>{item.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className={styles.testimonials} id="about">
        <div className={styles.container}>
          <div className={`${styles.sectionHeader} ${styles.centered}`}>
            <div className={styles.sectionLabel}>Student Stories</div>
            <h2 className={styles.h2}>From <em>Confusion</em> to Clarity</h2>
            <p className={styles.sectionIntro}>Real words from students who were exactly where you are now.</p>
          </div>
          <div className={`${styles.cardGrid} ${styles.cardGrid3}`}>
            {[
              { initials:'AK', bg:'#0EA5A4', name:'Ankit K.', detail:'B.Sc Physics → Web Dev · Placed at Chennai startup', text:'I used to copy-paste code from Stack Overflow without understanding anything. After 3 months with SkillBridge, I can look at someone else\'s code and understand WHY they wrote it that way. That change is everything.' },
              { initials:'MP', bg:'#8E44AD', name:'Meghna P.', detail:'BA English → Frontend Dev · Currently job hunting', text:"Everyone told me an Arts background means no tech job. SkillBridge was the first place that didn't treat me differently. My first interview went well because I could finally explain my thinking — not just my code." },
              { initials:'SR', bg:'#FF9933', name:'Suresh R.', detail:'Diploma in Mech. Engg → Java Dev · Placed in Hyderabad', text:"I failed my 5th interview and was ready to quit. The SkillBridge community helped me do a proper review session. The 7th interview — I got the offer. It's not talent, it's the right environment." },
            ].map((t, i) => (
              <div className={`${styles.card} ${styles.testiCard}`} key={i}>
                <div className={styles.testiQuoteMark}>&ldquo;</div>
                <p className={styles.testiText}>{t.text}</p>
                <div className={styles.testiAuthor}>
                  <div className={styles.testiAvatar} style={{background:t.bg}}>{t.initials}</div>
                  <div>
                    <div className={styles.testiName}>{t.name}</div>
                    <div className={styles.testiDetail}>{t.detail}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className={styles.finalCta}>
        <div className={styles.containerNarrow}>
          <h2 className={styles.finalCtaH2}>Start Before You Feel Ready.</h2>
          <p className={styles.finalCtaP}>You don&apos;t need a perfect foundation. You need a community that helps you build one. Join 2,400+ students who stopped waiting.</p>
          <div className={styles.finalCtaBtns}>
            <a href="#join" className={`${styles.btn} ${styles.btnWhiteSolid}`}>Join Now — It&apos;s Free →</a>
            <a href="#paths" className={`${styles.btn} ${styles.btnGhostWhite}`}>Explore Skill Paths</a>
          </div>
          <div className={styles.ctaTrust}><span>100% free.</span> No credit card. No ads. Just real learning.</div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerGrid}>
            <div>
              <a href="#" className={styles.logo}>
                <div className={styles.logoIcon}>S</div>
                Skill<span>Bridge</span>
              </a>
              <p className={styles.footerMission}>A non-profit platform helping students from tier-3 colleges and non-IT backgrounds build real skills, real confidence, and real careers in tech — completely free.</p>
              <div className={styles.footerSocial}>
                {['𝕏','in','◎','▷'].map((icon, i) => <a href="#" key={i}>{icon}</a>)}
              </div>
            </div>
            <div><h4>Platform</h4><ul>{['Web Development','Java Backend','AI / ML','Community'].map(l=><li key={l}><a href="#">{l}</a></li>)}</ul></div>
            <div><h4>Learn</h4><ul>{['How We Teach','Live Sessions','Peer Groups','Mock Interviews'].map(l=><li key={l}><a href="#">{l}</a></li>)}</ul></div>
            <div><h4>About</h4><ul>{['Our Mission','The Team','Contact','Privacy Policy'].map(l=><li key={l}><a href="#">{l}</a></li>)}</ul></div>
          </div>
          <div className={styles.footerBottom}>
            <span>© 2025 SkillBridge. Made with purpose for students who deserve better.</span>
            <span className={styles.footerTagline}>Bridge the gap. Own your future.</span>
            <a href="#home">Back to top ↑</a>
          </div>
        </div>
      </footer>
    </>
  )
}
