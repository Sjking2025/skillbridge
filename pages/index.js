// pages/index.js
import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { 
  Sparkles, Brain, MonitorPlay, GraduationCap, MessageCircle, 
  Globe, Coffee, Bot, Target, Building2, Lightbulb, 
  Users, Calendar, Trophy, UserCheck, PartyPopper,
  Sun, Moon, GitBranch, Terminal, Palette, Cloud, BrainCircuit
} from 'lucide-react'
import styles from '../styles/Home.module.css'

const ThemeToggle = () => {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div style={{width: 36, height: 36, marginLeft: 10}}></div>
  }

  return (
    <button 
      className={styles.themeToggleBtn}
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle Dark Mode"
    >
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  )
}

const SpotlightCard = ({ children, className }) => {
  const cardRef = useRef(null)
  
  const handleMouseMove = (e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    cardRef.current.style.setProperty("--mouse-x", `${x}px`)
    cardRef.current.style.setProperty("--mouse-y", `${y}px`)
  }

  return (
    <div className={styles.spotlightWrapper} ref={cardRef} onMouseMove={handleMouseMove}>
      <div className={className}>
        {children}
        <div className={styles.spotlightGlow} />
      </div>
    </div>
  )
}



export default function Home() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    college: '', year: '', level: '', path: '', whatsapp: ''
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

  // Animation variants for Framer Motion
  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
  }
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  }

  return (
    <>
      <Head>
        <title>SkillBridge — Premium Tech Community</title>
        <meta name="description" content="A premium community platform helping rural and non-IT students build real tech skills." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌉</text></svg>" />
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
              <li><a href="#problem">Reality</a></li>
              <li><a href="#industry">Industry</a></li>
              <li><a href="#paths">Paths</a></li>
              <li><a href="#community">Community</a></li>
            </ul>
            <div className={styles.navActions}>
              <a href="#join" className={`${styles.btn} ${styles.btnPrimary} ${styles.navCta}`}>Join Free</a>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroGlow}></div>
        <div className={styles.container}>
          <div className={styles.heroGrid}>
            <motion.div className={styles.heroContent} initial="hidden" animate="visible" variants={staggerContainer}>
              <motion.div variants={fadeInUp} className={styles.heroBadge}>
                <div className={styles.heroBadgeDot}></div>
                The Premium Coding Community
              </motion.div>
              <motion.h1 variants={fadeInUp} className={styles.heroH1}>
                Your Degree is Not Enough —<br/>But <em>You Are</em>
              </motion.h1>
              <motion.p variants={fadeInUp} className={styles.heroPara}>
                Most students graduate knowing theory but failing interviews. SkillBridge bridges the gap between what college teaches and what industry actually demands — through real thinking, honest mentorship, and a community that truly gets it.
              </motion.p>
              <motion.div variants={fadeInUp} className={styles.heroCtas}>
                <a href="#join" className={`${styles.btn} ${styles.btnSaffron}`}>Join the Community</a>
                <a href="#paths" className={`${styles.btn} ${styles.btnGhostWhite}`}>Explore Skills →</a>
              </motion.div>
              <motion.div variants={fadeInUp} className={styles.heroStats}>
                <div><div className={styles.heroStatNum}>2,400+</div><div className={styles.heroStatLabel}>Students Joined</div></div>
                <div><div className={styles.heroStatNum}>100%</div><div className={styles.heroStatLabel}>Free Forever</div></div>
                <div><div className={styles.heroStatNum}>8 PM</div><div className={styles.heroStatLabel}>Daily Live</div></div>
              </motion.div>
            </motion.div>
            
            <div className={styles.heroVisual}>
              <div className={styles.heroCardStack}>
                <motion.div 
                  initial={{ opacity: 0, x: 50, y: -20, rotate: 5 }} animate={{ opacity: 1, x: 0, y: 0, rotate: 2 }} transition={{ duration: 0.8, delay: 0.2 }}
                  className={`${styles.heroFloatCard} ${styles.heroFloatCardAccent}`}
                >
                  <div className={styles.hfcTop}>
                    <div className={`${styles.hfcAvatar} ${styles.avatarTeal}`}>RK</div>
                    <div>
                      <div className={styles.hfcName}>Rahul K.</div>
                      <div className={styles.hfcMeta}>B.Sc Agriculture → Web Dev</div>
                    </div>
                  </div>
                  <div className={styles.hfcBody}>Placed at a <strong>startup in Pune</strong> after 4 months. Never thought this was possible for a non-CS student.</div>
                  <div className={styles.progressBar}><div className={styles.progressFill} style={{width:'78%'}}></div></div>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, x: -40, y: 20, rotate: -4 }} animate={{ opacity: 1, x: 0, y: 0, rotate: -2 }} transition={{ duration: 0.8, delay: 0.4 }}
                  className={`${styles.heroFloatCard} ${styles.heroFloatCardBase}`}
                >
                  <div className={styles.hfcTop}>
                    <div className={`${styles.hfcAvatar} ${styles.avatarIndigo}`}>PS</div>
                    <div>
                      <div className={styles.hfcName}>Priya S.</div>
                      <div className={styles.hfcMeta}>Tier-3 college · 2nd year</div>
                    </div>
                  </div>
                  <div className={styles.hfcBody}>Understood <strong>how REST APIs actually work</strong> by building one — not by watching a tutorial.</div>
                  <span className={`${styles.hfcTag}`}><Sparkles size={14} /> Learning by doing</span>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 60, rotate: 3 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ duration: 0.8, delay: 0.6 }}
                  className={`${styles.heroFloatCard} ${styles.heroFloatCardSaffron}`}
                >
                  <div style={{fontSize:'0.8rem',color:'rgba(255,255,255,0.7)',marginBottom:'8px',textTransform:'uppercase',letterSpacing:'1px',fontWeight:700}}>Daily Live — CS02</div>
                  <div style={{fontSize:'1.1rem',fontWeight:'800',color:'var(--hero-card-strong)',marginBottom:'6px'}}>Coding Practice</div>
                  <div style={{fontSize:'0.85rem',color:'var(--hero-card-sub)'}}>Every day · 8:00 PM IST</div>
                  <div className={styles.progressBar} style={{marginTop:'12px'}}><div className={`${styles.progressFill} ${styles.progressFillSaffron}`} style={{width:'91%'}}></div></div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} className={styles.problem} id="problem">
        <div className={styles.container}>
          <motion.div variants={fadeInUp} className={styles.sectionHeader}>
            <div className={`${styles.sectionLabel} ${styles.sectionLabelOrange}`}>The Reality Check</div>
            <h2 className={styles.h2}>What&apos;s <em>Actually</em> Going Wrong?</h2>
            <p className={styles.sectionIntro}>It&apos;s not that you&apos;re not smart enough. Nobody told you what really matters — until now.</p>
          </motion.div>
          <div className={`${styles.cardGrid} ${styles.cardGrid2}`}>
            {[
              { left:'Memorization', right:'Understanding', icon:<Brain size={28} color="#FFB347"/>, title:"You know definitions. Not thinking.", body:"Textbooks reward cramming. Interviews reward reasoning. Most students can define a linked list but can't explain why to use one over an array." },
              { left:'Tutorial Hell', right:'Real Building', icon:<MonitorPlay size={28} color="#0EA5A4"/>, title:"You watch. You don't build.", body:"Watching 300 hours of video creates the feeling of learning. Real understanding comes from building something broken and fixing it yourself." },
              { left:'Your Degree', right:'Your Skills', icon:<GraduationCap size={28} color="#818CF8"/>, title:"A degree gets you shortlisted. Skills get you hired.", body:"Companies don't hire certificates. They hire people who can solve problems. Your B.Tech from a tier-3 college is not the ceiling — your skills are." },
              { left:'Fear', right:'Confidence', icon:<MessageCircle size={28} color="#FF6B1A"/>, title:"Interview fear is just unfamiliarity.", body:"Nobody teaches you how to think out loud, handle unknown questions, or articulate your reasoning. It's a learnable skill — not a talent." },
            ].map((item, i) => (
              <motion.div variants={fadeInUp} className={styles.card} key={i}>
                <div className={styles.problemVs}>
                  <div className={styles.problemVsLeft}>{item.left}</div>
                  <div className={styles.problemVsArrow}>→</div>
                  <div className={styles.problemVsRight}>{item.right}</div>
                </div>
                <div className={styles.problemCard}>
                  <div className={styles.problemIcon}>{item.icon}</div>
                  <div>
                    <h3 className={styles.cardH3}>{item.title}</h3>
                    <p className={styles.cardP}>{item.body}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── INDUSTRY ── */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} className={styles.industry} id="industry">
        <div className={styles.container}>
          <motion.div variants={fadeInUp} className={`${styles.sectionHeader} ${styles.centered}`}>
            <div className={styles.sectionLabel}>Industry Reality</div>
            <h2 className={styles.h2}>What <em>Industry</em> Actually Expects</h2>
            <p className={styles.sectionIntro}>Forget what your placement cell told you. Here&apos;s what real hiring managers look for.</p>
          </motion.div>
          <div className={`${styles.cardGrid} ${styles.cardGrid4}`}>
            {[
              { num:'01', title:'Problem-Solving', body:'Not just code — the ability to break a complex problem into smaller pieces.', quote:'"Show me how you think"' },
              { num:'02', title:'Communication', body:"Can you explain your code? Can you ask the right clarifying questions?", quote:'"Tell me your approach"' },
              { num:'03', title:'Real Experience', body:"One messy, half-broken real project beats ten perfect tutorials.", quote:'"What did you build?"' },
              { num:'04', title:'Thinking Approach', body:"The habit of asking why something works, not just how.", quote:'"Why did you choose that?"' },
            ].map((item, i) => (
              <motion.div variants={fadeInUp} className={`${styles.card} ${styles.industryCard}`} key={i}>
                <div className={styles.industryNum}>{item.num}</div>
                <h3 className={styles.cardH3}>{item.title}</h3>
                <p className={styles.cardP}>{item.body}</p>
                <span className={styles.quotePill}>{item.quote}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── PATHS ── */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} className={styles.paths} id="paths">
        <div className={styles.container}>
          <motion.div variants={fadeInUp} className={styles.sectionHeader}>
            <div className={styles.sectionLabel}>Choose Your Direction</div>
            <h2 className={styles.h2}>Find the Path <em>That Fits You</em></h2>
            <p className={styles.sectionIntro}>No path is better than another. The best one is the one you stay consistent with.</p>
          </motion.div>
          
          <h3 className={styles.categoryTitle}>Core Engineering</h3>
          <div className={`${styles.cardGrid} ${styles.cardGrid3}`} style={{ marginBottom: '56px' }}>
            {[
              { icon:<Globe size={32}/>, title:'Web Development', diff:'Beginner-friendly', diffClass:'beginner', color:'web', why:'Visual feedback makes learning faster and satisfying.', where:'Startups, agencies, product companies', start:'HTML → CSS → JS' },
              { icon:<Coffee size={32}/>, title:'Java Backend', diff:'Intermediate', diffClass:'intermediate', color:'java', why:'Highest-paying roles in India are backend-heavy.', where:'Banks, MNCs, large-scale applications', start:'Core Java → OOP → Spring' },
              { icon:<Bot size={32}/>, title:'AI / Machine Learning', diff:'Advanced', diffClass:'advanced', color:'ai', why:'Rewards analytical and mathematical thinkers.', where:'AI startups, research, global tech firms', start:'Python → Math → ML' },
              { icon:<BrainCircuit size={32}/>, title:'Data Structures & Algorithms', diff:'Essential', diffClass:'intermediate', color:'dsa', why:'Core foundation for product company interviews.', where:'FAANG, Top Tier Startups', start:'Arrays → Strings → Trees' },
            ].map((item, i) => (
              <motion.div variants={fadeInUp} className={`${styles.card} ${styles.pathCard} ${styles[item.color]}`} key={`core-${i}`}>
                <span className={styles.pathEmoji}>{item.icon}</span>
                <div className={styles.pathHeader}>
                  <h3 className={styles.cardH3}>{item.title}</h3>
                  <span className={`${styles.difficulty} ${styles[item.diffClass]}`}>● {item.diff}</span>
                </div>
                <div className={styles.pathDetails}>
                  <div className={styles.pathDetail}><span className={styles.pathDetailIcon}><Target size={16}/></span><span className={styles.pathDetailText}><strong>Start:</strong> {item.start}</span></div>
                  <div className={styles.pathDetail}><span className={styles.pathDetailIcon}><Building2 size={16}/></span><span className={styles.pathDetailText}><strong>Used in:</strong> {item.where}</span></div>
                  <div className={styles.pathDetail}><span className={styles.pathDetailIcon}><Lightbulb size={16}/></span><span className={styles.pathDetailText}><strong>Why this?</strong> {item.why}</span></div>
                </div>
                <a href="#join" className={`${styles.pathCta} ${styles[`pathCta_${item.color}`]}`}>Start this path</a>
              </motion.div>
            ))}
          </div>

          <h3 className={styles.categoryTitle}>Infrastructure & Dev Tools</h3>
          <div className={`${styles.cardGrid} ${styles.cardGrid3}`} style={{ marginBottom: '56px' }}>
            {[
              { icon:<GitBranch size={32}/>, title:'Git & GitHub', diff:'Beginner-friendly', diffClass:'beginner', color:'git', why:'Every single developer job requires version control.', where:'Every tech company globally', start:'git init → commit → push' },
              { icon:<Terminal size={32}/>, title:'Linux / Dev Tools', diff:'Intermediate', diffClass:'intermediate', color:'linux', why:'Servers run on Linux. You must know your way around the terminal.', where:'Backend roles, DevOps, Sysadmin', start:'ls → cd → grep → permissions' },
              { icon:<Cloud size={32}/>, title:'Google Cloud / DevOps', diff:'Advanced', diffClass:'advanced', color:'cloud', why:'Knowing how to deploy code makes you a complete engineer.', where:'Cloud-native startups, Enterprise IT', start:'Compute Engine → Docker → CI/CD' },
            ].map((item, i) => (
              <motion.div variants={fadeInUp} className={`${styles.card} ${styles.pathCard} ${styles[item.color]}`} key={`tools-${i}`}>
                <span className={styles.pathEmoji}>{item.icon}</span>
                <div className={styles.pathHeader}>
                  <h3 className={styles.cardH3}>{item.title}</h3>
                  <span className={`${styles.difficulty} ${styles[item.diffClass]}`}>● {item.diff}</span>
                </div>
                <div className={styles.pathDetails}>
                  <div className={styles.pathDetail}><span className={styles.pathDetailIcon}><Target size={16}/></span><span className={styles.pathDetailText}><strong>Start:</strong> {item.start}</span></div>
                  <div className={styles.pathDetail}><span className={styles.pathDetailIcon}><Building2 size={16}/></span><span className={styles.pathDetailText}><strong>Used in:</strong> {item.where}</span></div>
                  <div className={styles.pathDetail}><span className={styles.pathDetailIcon}><Lightbulb size={16}/></span><span className={styles.pathDetailText}><strong>Why this?</strong> {item.why}</span></div>
                </div>
                <a href="#join" className={`${styles.pathCta} ${styles[`pathCta_${item.color}`]}`}>Start this path</a>
              </motion.div>
            ))}
          </div>

          <h3 className={styles.categoryTitle}>Design & Product</h3>
          <div className={`${styles.cardGrid} ${styles.cardGrid3}`}>
            {[
              { icon:<Palette size={32}/>, title:'UI/UX Design (Figma)', diff:'Beginner-friendly', diffClass:'beginner', color:'uiux', why:'Good design separates great products from average ones.', where:'Design agencies, Product startups', start:'Wireframing → Colors → Auto-layout' },
            ].map((item, i) => (
              <motion.div variants={fadeInUp} className={`${styles.card} ${styles.pathCard} ${styles[item.color]}`} key={`design-${i}`}>
                <span className={styles.pathEmoji}>{item.icon}</span>
                <div className={styles.pathHeader}>
                  <h3 className={styles.cardH3}>{item.title}</h3>
                  <span className={`${styles.difficulty} ${styles[item.diffClass]}`}>● {item.diff}</span>
                </div>
                <div className={styles.pathDetails}>
                  <div className={styles.pathDetail}><span className={styles.pathDetailIcon}><Target size={16}/></span><span className={styles.pathDetailText}><strong>Start:</strong> {item.start}</span></div>
                  <div className={styles.pathDetail}><span className={styles.pathDetailIcon}><Building2 size={16}/></span><span className={styles.pathDetailText}><strong>Used in:</strong> {item.where}</span></div>
                  <div className={styles.pathDetail}><span className={styles.pathDetailIcon}><Lightbulb size={16}/></span><span className={styles.pathDetailText}><strong>Why this?</strong> {item.why}</span></div>
                </div>
                <a href="#join" className={`${styles.pathCta} ${styles[`pathCta_${item.color}`]}`}>Start this path</a>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── PHILOSOPHY ── */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} className={styles.philosophy}>
        <div className={styles.container}>
          <motion.div variants={fadeInUp} className={`${styles.sectionHeader} ${styles.centered} ${styles.phiHeader}`}>
            <div className={styles.sectionLabel}>Our Method</div>
            <h2 className={styles.h2}>How We Learn <em style={{color:'var(--saffron)'}}>Differently</em></h2>
            <p className={styles.sectionIntro}>Not another tutorial platform. Real learning happens through struggle, curiosity, and honest reflection.</p>
          </motion.div>
          <div className={styles.phiGrid}>
            {[
              { num:'01', title:'Incremental Learning', body:"We continuously stack concepts—combining the past with the present—so you build, break, and fix instead of watching isolated tutorials." },
              { num:'02', title:'Make Mistakes', body:"We show you why things break and help you develop the instinct to debug independently." },
              { num:'03', title:'Ask WHY', body:"We teach you why a solution is the right choice — and when it isn't." },
              { num:'04', title:'No Spoon-Feeding', body:"The discomfort of not-knowing is where real learning lives. We sit in it together." },
              { num:'05', title:'Thinking > Memory', body:"We want you to build the confidence to arrive at your own answers under pressure." },
            ].map((item, i) => (
              <motion.div variants={fadeInUp} key={i}>
                <SpotlightCard className={styles.phiCard}>
                  <div className={styles.phiCardInner}>
                    <span className={styles.phiNum}>{item.num}</span>
                    <h3 className={styles.phiCardH3}>{item.title}</h3>
                    <p className={styles.phiCardP}>{item.body}</p>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── TESTIMONIALS ── */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} className={styles.testimonials}>
        <div className={styles.container}>
          <motion.div variants={fadeInUp} className={`${styles.sectionHeader} ${styles.centered}`}>
            <div className={styles.sectionLabel}>Student Stories</div>
            <h2 className={styles.h2}>From <em style={{color:'var(--teal)'}}>Confusion</em> to Clarity</h2>
            <p className={styles.sectionIntro}>Real words from students who were exactly where you are now.</p>
          </motion.div>
          <div className={`${styles.cardGrid} ${styles.cardGrid3}`}>
            {[
              {
                quote: "I used to copy-paste code from Stack Overflow without understanding anything. After 3 months with SkillBridge, I can look at someone else's code and understand WHY they wrote it that way. That change is everything.",
                name: "Ankit K.",
                detail: "B.Sc Physics → Web Dev · Placed at Chennai startup",
                initials: "AK",
                avatarClass: "avatarTeal"
              },
              {
                quote: "Everyone told me an Arts background means no tech job. SkillBridge was the first place that didn't treat me differently. My first interview went well because I could finally explain my thinking — not just my code.",
                name: "Meghna P.",
                detail: "BA English → Frontend Dev · Currently job hunting",
                initials: "MP",
                avatarClass: "avatarPurple"
              },
              {
                quote: "I failed my 5th interview and was ready to quit. The SkillBridge community helped me do a proper review session. The 7th interview — I got the offer. It's not talent, it's the right environment.",
                name: "Suresh R.",
                detail: "Diploma in Mech. Engg → Java Dev · Placed in Hyderabad",
                initials: "SR",
                avatarClass: "avatarSaffron"
              }
            ].map((item, i) => (
              <motion.div variants={fadeInUp} key={i}>
                <SpotlightCard className={styles.testiCard}>
                  <div className={styles.testiCardInner}>
                    <div className={styles.testiQuoteMark}>&ldquo;</div>
                    <p className={styles.testiText}>{item.quote}</p>
                    <div className={styles.testiAuthor}>
                      <div className={`${styles.testiAvatar} ${styles[item.avatarClass]}`}>{item.initials}</div>
                      <div>
                        <div className={styles.testiName}>{item.name}</div>
                        <div className={styles.testiDetail}>{item.detail}</div>
                      </div>
                    </div>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── COMMUNITY + JOIN FORM ── */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} className={styles.community} id="community">
        <div className={styles.container}>
          <div className={styles.communityLayout}>
            <motion.div variants={fadeInUp}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionLabel}>Join Us</div>
                <h2 className={styles.h2}>You&apos;re <em>Not Alone</em> in This</h2>
                <p className={styles.sectionIntro}>2,400+ students from tier-2 and tier-3 colleges, non-IT backgrounds, and rural towns — all figuring it out together.</p>
              </div>
              <div className={`${styles.card} ${styles.joinCard}`} id="join">
                {status === 'success' ? (
                  <div className={styles.joinSuccess}>
                    <div className={styles.successEmoji}><PartyPopper size={48} color="#0EA5A4"/></div>
                    <h3>You&apos;re in! Welcome aboard.</h3>
                    <p>Check your inbox — we&apos;ve sent you a premium invite with your <strong>Daily Coding Practice</strong> (CS02) calendar invite. See you at 8 PM IST!</p>
                  </div>
                ) : (
                  <>
                    <div className={styles.joinFormHeader}>
                      <div className={styles.joinFormTitle}>Join SkillBridge</div>
                      <div className={styles.joinFormSub}>Takes 30 seconds. No spam. No fees.</div>
                    </div>
                    <form className={styles.joinForm} onSubmit={handleSubmit}>
                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label htmlFor="firstName">First Name</label>
                          <input id="firstName" name="firstName" type="text" placeholder="Rahul" required value={form.firstName} onChange={handleChange} />
                        </div>
                        <div className={styles.formGroup}>
                          <label htmlFor="lastName">Last Name</label>
                          <input id="lastName" name="lastName" type="text" placeholder="Kumar" value={form.lastName} onChange={handleChange} />
                        </div>
                      </div>
                      <div className={styles.formGroup}>
                        <label htmlFor="email">Email Address</label>
                        <input id="email" name="email" type="email" placeholder="rahul@example.com" required value={form.email} onChange={handleChange} />
                      </div>
                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label htmlFor="college">College Name</label>
                          <input id="college" name="college" type="text" placeholder="XYZ Engg College" required value={form.college} onChange={handleChange} />
                        </div>
                        <div className={styles.formGroup}>
                          <label htmlFor="whatsapp">WhatsApp Number</label>
                          <input id="whatsapp" name="whatsapp" type="tel" placeholder="+91 9999999999" value={form.whatsapp} onChange={handleChange} />
                        </div>
                      </div>
                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label htmlFor="year">Year</label>
                          <select id="year" name="year" required value={form.year} onChange={handleChange}>
                            <option value="">Select year</option>
                            <option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option><option>Graduated</option>
                          </select>
                        </div>
                        <div className={styles.formGroup}>
                          <label htmlFor="level">Skill Level</label>
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
                          <option>Web Development</option>
                          <option>Java Backend</option>
                          <option>AI / Machine Learning</option>
                          <option>Git & GitHub</option>
                          <option>Linux / Dev Tools</option>
                          <option>UI/UX Design (Figma)</option>
                          <option>Google Cloud / DevOps</option>
                          <option>Data Structures & Algorithms</option>
                          <option>Not sure yet</option>
                        </select>
                      </div>
                      {status === 'error' && (
                        <div className={styles.errorMsg}>⚠️ {errorMsg}</div>
                      )}
                      <button type="submit" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnFullWidth}`} disabled={status === 'loading'}>
                        {status === 'loading' ? 'Joining...' : 'Join the Community — Free →'}
                      </button>
                      <div className={styles.formNote}>🔒 You'll receive a calendar invite instantly.</div>
                    </form>
                  </>
                )}
              </div>
            </motion.div>
            <motion.div variants={fadeInUp} className={styles.communityHighlights}>
              {[
                { icon:<Users size={24}/>, num:'2,400+', label:'Students across 180+ colleges' },
                { icon:<Calendar size={24}/>, num:'Daily', label:'CS02 Coding Practice at 8 PM IST' },
                { icon:<Trophy size={24}/>, num:'Weekly', label:'Mock interview & peer feedback' },
                { icon:<UserCheck size={24}/>, num:'Mentors', label:'Industry pros who were once like you' },
              ].map((item, i) => (
                <div className={styles.cscCard} key={i}>
                  <div className={styles.cscIcon}>{item.icon}</div>
                  <div>
                    <div className={styles.cscNum}>{item.num}</div>
                    <div className={styles.cscLabel}>{item.label}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ── FINAL CTA ── */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} className={styles.finalCta}>
        <div className={styles.containerNarrow}>
          <motion.h2 variants={fadeInUp} className={styles.finalCtaH2}>Start Before You Feel Ready.</motion.h2>
          <motion.p variants={fadeInUp} className={styles.finalCtaP}>You don&apos;t need a perfect foundation. You need a community that helps you build one. Join 2,400+ students who stopped waiting.</motion.p>
          <motion.div variants={fadeInUp} className={styles.finalCtaBtns}>
            <a href="#join" className={`${styles.btn} ${styles.btnWhiteSolid}`}>Join Now — Free →</a>
            <a href="#paths" className={`${styles.btn} ${styles.btnGhostWhite}`}>Explore Paths</a>
          </motion.div>
          <motion.div variants={fadeInUp} className={styles.ctaTrust}><span>100% free.</span> No ads. Just real learning.</motion.div>
        </div>
      </motion.section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerGrid}>
            <div>
              <a href="#" className={styles.logo}>
                <div className={styles.logoIcon}>S</div>
                Skill<span>Bridge</span>
              </a>
              <p className={styles.footerMission}>A premium community platform helping students from tier-3 colleges and non-IT backgrounds build real skills completely free.</p>
              <div className={styles.footerSocial}>
                {['𝕏','in','◎','▷'].map((icon, i) => <a href="#" key={i}>{icon}</a>)}
              </div>
            </div>
            <div><h4>Platform</h4><ul>{['Web Development','Java Backend','AI / ML','Community'].map(l=><li key={l}><a href="#">{l}</a></li>)}</ul></div>
            <div><h4>Learn</h4><ul>{['Our Method','Live Sessions','Peer Groups','Mock Interviews'].map(l=><li key={l}><a href="#">{l}</a></li>)}</ul></div>
            <div><h4>About</h4><ul>{['Mission','Team','Contact','Privacy'].map(l=><li key={l}><a href="#">{l}</a></li>)}</ul></div>
          </div>
          <div className={styles.footerBottom}>
            <span>© 2026 SkillBridge. Premium education should be free.</span>
            <span className={styles.footerTagline}>Bridge the gap. Own your future.</span>
            <a href="#home">Back to top ↑</a>
          </div>
        </div>
      </footer>
    </>
  )
}
