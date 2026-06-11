import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Calendar, Trophy, UserCheck, PartyPopper } from 'lucide-react';
import styles from '../../../styles/Home.module.css';
import { fadeInUp, staggerContainer } from '../../utils/animations';

export const Community = () => {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    college: '', year: '', level: '', path: '', whatsapp: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  };

  return (
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
  );
};
