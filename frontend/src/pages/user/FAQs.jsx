import React, { useState } from "react";
import { Link } from "react-router-dom";

import Footer from "./Footer";
import {
  Search, HelpCircle, User, Dumbbell, UtensilsCrossed,
  CreditCard, ShieldCheck, Smartphone, ChevronDown,
  Rocket, MessageSquare, Mail, Phone, Headphones,
  CheckCircle2, ThumbsUp, ThumbsDown
} from "lucide-react";
import "./FAQs.css";

export default function FAQsPage() {
  const [searchQuery,    setSearchQuery]    = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeFaq,      setActiveFaq]      = useState(null);

  const categories = [
    { id: "all",       label: "All Topics",  icon: <HelpCircle     size={14} /> },
    { id: "account",   label: "Account",     icon: <User           size={14} /> },
    { id: "gyms",      label: "Gyms",        icon: <Dumbbell       size={14} /> },
    { id: "workouts",  label: "Workouts",    icon: <Rocket         size={14} /> },
    { id: "nutrition", label: "Nutrition",   icon: <UtensilsCrossed size={14} /> },
    { id: "billing",   label: "Billing",     icon: <CreditCard     size={14} /> },
    { id: "privacy",   label: "Privacy",     icon: <ShieldCheck    size={14} /> },
    { id: "technical", label: "Technical",   icon: <Smartphone     size={14} /> },
  ];

  const faqs = [
    { category:"account",   question:"How do I create an account?",                       answer:"Getting started is easy — click 'Get Started Free' on our homepage, fill in your name, email, and password, then verify your email. You'll be exploring gyms and building workout plans in under two minutes." },
    { category:"account",   question:"Can I change my email or password?",                 answer:"Yes. Head to Profile Settings then Security. You can update both your email and password at any time. You'll need to confirm your current password first for security." },
    { category:"account",   question:"How do I delete my account?",                        answer:"Go to Settings › Account › Delete Account. Keep in mind this is permanent — all your workout history, saved gyms, and progress data will be removed." },
    { category:"gyms",      question:"How many gyms are available on ExerSearch?",         answer:"We currently list 50+ verified partner gyms across Pasig City, with new ones added regularly. Every gym is vetted and includes real photos, verified reviews, and accurate pricing." },
    { category:"gyms",      question:"Are the gym reviews authentic?",                     answer:"Every review comes from a verified ExerSearch member who has physically visited the gym. We validate membership receipts and use anti-fraud detection — fake reviews are removed immediately." },
    { category:"gyms",      question:"Can I try a gym before committing to membership?",   answer:"Many of our partner gyms offer day passes or trial visits. Check the gym's detail page for a 'Trial Available' badge, or reach out to them directly through the platform." },
    { category:"gyms",      question:"How do I save my favorite gyms?",                   answer:"Tap the heart icon on any gym card to save it. Access your saved list anytime from your dashboard to compare options and make a confident decision." },
    { category:"gyms",      question:"What if I find incorrect gym information?",          answer:"Use the 'Report Issue' button on the gym's page. We review every report and update information within 24–48 hours." },
    { category:"workouts",  question:"How are workout plans personalized?",                answer:"Our AI considers your fitness goals, current level, available equipment, schedule, and any physical limitations — then builds a tailored routine that adapts as you progress." },
    { category:"workouts",  question:"Can I modify my workout plan?",                      answer:"Absolutely. Swap exercises, adjust sets and reps, change rest periods, or request an entirely new plan at any time. Your preferences carry forward into future recommendations." },
    { category:"workouts",  question:"Do I need gym equipment for the workouts?",          answer:"Not at all. During onboarding, tell us whether you prefer gym-based, home-based, or bodyweight-only sessions and we'll tailor the plan accordingly." },
    { category:"workouts",  question:"How often should I refresh my workout plan?",        answer:"Every 4–6 weeks is ideal to avoid plateaus. The app will nudge you when it's time, or you can request a new plan anytime you're ready for a change." },
    { category:"workouts",  question:"Is ExerSearch beginner-friendly?",                  answer:"Very much so. Our beginner programs include clear instructions, form guidance, and gradual progression — you'll build a strong foundation at your own pace." },
    { category:"nutrition", question:"Is the meal planning feature really free?",          answer:"Yes, completely free. Our AI generates personalized Filipino meal plans based on your calorie targets, daily budget, and dietary preferences — no subscription needed." },
    { category:"nutrition", question:"Can I set dietary restrictions?",                    answer:"Yes — vegetarian, vegan, halal, pescatarian, low-carb, keto, and more. Set your preferences once and every generated plan will respect them." },
    { category:"nutrition", question:"How accurate are the nutrition calculations?",       answer:"Very. Each ingredient is measured per 100g and scaled precisely to serving size, giving you reliable macronutrient data for every meal." },
    { category:"nutrition", question:"Can I see individual ingredient breakdowns?",        answer:"Every meal includes a full breakdown — ingredient amounts, calories, macros, and estimated cost per item, so you always know exactly what you're eating." },
    { category:"nutrition", question:"What are macro presets?",                            answer:"Presets are ready-made protein/carbs/fats ratios tuned for common goals — Weight Loss (35/40/25), Muscle Gain (40/35/25), Keto (25/5/70), and more. Pick one and we handle the math." },
    { category:"billing",   question:"Is ExerSearch completely free to use?",              answer:"Yes — 100% free, no credit card required. Gym discovery, workout planning, progress tracking, and nutrition tools are all included at no cost. Our gym partners fund the platform." },
    { category:"billing",   question:"Will core features ever become paid?",               answer:"No. Essential ExerSearch features will always be free. Optional premium add-ons like 1-on-1 coaching may come later, but the core experience stays free forever." },
    { category:"billing",   question:"Do gyms pay to appear on ExerSearch?",               answer:"Yes. Gyms pay a listing fee to be featured, which keeps the platform free for users and ensures only committed, quality gyms make the cut." },
    { category:"privacy",   question:"Is my personal data safe?",                          answer:"Yes. All data is protected with SSL/TLS encryption. We never sell personal information. Gym details are only shared when you actively express interest in membership." },
    { category:"privacy",   question:"What information do you collect?",                   answer:"We collect your name, email, fitness preferences, workout history, and gym activity to improve your experience. Everything is downloadable from Settings › Privacy › Download My Data." },
    { category:"privacy",   question:"Can I use ExerSearch without sharing my real name?", answer:"Yes. A pseudonym and valid email are all you need. Some features like gym inquiries may require additional verification." },
    { category:"technical", question:"Which devices and browsers are supported?",          answer:"Any modern browser works — Chrome, Firefox, Safari, Edge. ExerSearch is fully responsive across desktops, tablets, and phones. A native mobile app is on the way." },
    { category:"technical", question:"Do I need to install anything?",                     answer:"Nothing to install. ExerSearch runs entirely in your browser. Native iOS and Android apps with offline workout tracking are in development for 2024." },
    { category:"technical", question:"Why is the page slow to load?",                     answer:"Try clearing your browser cache, switching to a faster connection, or updating your browser. If the issue continues, contact our support team." },
    { category:"technical", question:"Can I access ExerSearch without internet?",         answer:"Not yet — an active connection is currently required. In the meantime, screenshots of your workout plans work great at the gym. Offline mode is coming in our mobile app." },
  ];

  const contactOptions = [
    { icon: <Mail size={22} />,        title: "Email Us",    detail: "support@exersearch.com", description: "We reply within 24 hours" },
    { icon: <Phone size={22} />,       title: "Call Us",     detail: "+63 917 123 4567",        description: "Mon – Fri · 9AM – 6PM" },
    { icon: <MessageSquare size={22} />, title: "Live Chat", detail: "Available Now",            description: "Instant help from the team" },
  ];

  
  const calculateSimilarity = (s1, s2) => {
    const a = s1.length > s2.length ? s1 : s2;
    const b = s1.length > s2.length ? s2 : s1;
    if (!a.length) return 1;
    return (a.length - levenshteinDistance(a, b)) / a.length;
  };

  const levenshteinDistance = (s1, s2) => {
    const m = [];
    for (let i = 0; i <= s2.length; i++) m[i] = [i];
    for (let j = 0; j <= s1.length; j++) m[0][j] = j;
    for (let i = 1; i <= s2.length; i++)
      for (let j = 1; j <= s1.length; j++)
        m[i][j] = s2[i-1] === s1[j-1]
          ? m[i-1][j-1]
          : Math.min(m[i-1][j-1]+1, m[i][j-1]+1, m[i-1][j]+1);
    return m[s2.length][s1.length];
  };

  const searchFaqs = (query) => {
    if (!query.trim()) return faqs;
    const terms = query.toLowerCase().split(' ').filter(t => t.length > 2);
    return faqs.map(faq => {
      let score = 0;
      const q = faq.question.toLowerCase();
      const a = faq.answer.toLowerCase();
      const c = categories.find(x => x.id === faq.category)?.label.toLowerCase() || '';
      terms.forEach(t => {
        if (q.includes(t)) score += 10;
        if (a.includes(t)) score += 5;
        if (c.includes(t)) score += 3;
        q.split(' ').forEach(w => { if (w.startsWith(t)) score += 7; });
        a.split(' ').forEach(w => { if (w.startsWith(t)) score += 3; });
        q.split(' ').forEach(w => { if (w.length > 3 && t.length > 3 && calculateSimilarity(w, t) > 0.7) score += 5; });
      });
      return { ...faq, relevanceScore: score };
    }).filter(f => f.relevanceScore > 0).sort((a, b) => b.relevanceScore - a.relevanceScore);
  };

  const filteredFaqs = searchQuery.trim()
    ? searchFaqs(searchQuery).filter(f => activeCategory === "all" || f.category === activeCategory)
    : faqs.filter(f => activeCategory === "all" || f.category === activeCategory);

  const toggleFaq = (i) => setActiveFaq(activeFaq === i ? null : i);

  return (
    <div className="fq">
      
      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <section className="fq-hero">
        <div className="fq-hero__glow" />
        <div className="fq-wrap">

          <div className="fq-hero__content">
            <p className="fq-hero__eyebrow">
              <HelpCircle size={12} strokeWidth={2.5} />
              Frequently Asked Questions
            </p>
            <h1 className="fq-hero__title">
              Got questions?<br />
              <span>We have answers.</span>
            </h1>
            <p className="fq-hero__sub">
              Everything you need to know about ExerSearch —<br/>
              from gym discovery to nutrition planning.
            </p>

            {/* Search */}
            <div className="fq-searchbar">
              <Search className="fq-searchbar__ico" size={16} strokeWidth={2.5} />
              <input
                type="text"
                className="fq-searchbar__input"
                placeholder="Search articles — try &quot;gym reviews&quot; or &quot;meal plan&quot;"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="fq-searchbar__clear" onClick={() => setSearchQuery("")}>
                  ✕
                </button>
              )}
            </div>

            {!searchQuery && (
              <div className="fq-popular">
                <span>Quick searches —</span>
                {["create account", "gym reviews", "meal planner", "always free"].map((t, i) => (
                  <button key={i} className="fq-popular__chip" onClick={() => setSearchQuery(t)}>
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Stat strip */}
          <div className="fq-hero__stats">
            {[
              ["28+",  "Help Articles"],
              ["50+",  "Partner Gyms"],
              ["24h",  "Avg. Response"],
              ["100%", "Free Platform"],
            ].map(([v, l]) => (
              <div key={l} className="fq-hero__stat">
                <span className="fq-hero__stat-n">{v}</span>
                <span className="fq-hero__stat-l">{l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          MAIN — sidebar + accordion
      ══════════════════════════════════════ */}
      <section className="fq-main">
        <div className="fq-wrap fq-main__grid">

          {/* Sidebar */}
          <aside className="fq-sidebar">
            <p className="fq-sidebar__heading">Browse by Topic</p>
            <nav>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className={`fq-catbtn ${activeCategory === cat.id ? "fq-catbtn--on" : ""}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  <span className="fq-catbtn__ico">{cat.icon}</span>
                  <span className="fq-catbtn__lbl">{cat.label}</span>
                  <span className="fq-catbtn__n">
                    {faqs.filter(f => cat.id === "all" || f.category === cat.id).length}
                  </span>
                </button>
              ))}
            </nav>
            <div className="fq-sidebar__help">
              <p>Didn't find your answer?</p>
              <Link to="/contact" className="fq-sidebar__cta">
                <Headphones size={14} />
                Contact Support
              </Link>
            </div>
          </aside>

          {/* FAQ panel */}
          <div className="fq-panel">
            <div className="fq-panel__hdr">
              {searchQuery ? (
                <>
                  <h2 className="fq-panel__title">Search Results</h2>
                  <p className="fq-panel__meta">
                    <CheckCircle2 size={13} className="fq-panel__check" />
                    <strong>{filteredFaqs.length}</strong>&nbsp;
                    result{filteredFaqs.length !== 1 ? "s" : ""} for&nbsp;
                    <em>"{searchQuery}"</em>
                  </p>
                </>
              ) : (
                <>
                  <h2 className="fq-panel__title">
                    {categories.find(c => c.id === activeCategory)?.label}
                  </h2>
                  <p className="fq-panel__meta">
                    {filteredFaqs.length}&nbsp;article{filteredFaqs.length !== 1 ? "s" : ""}
                  </p>
                </>
              )}
            </div>

            {filteredFaqs.length > 0 ? (
              <ul className="fq-list">
                {filteredFaqs.map((faq, i) => {
                  const open    = activeFaq === i;
                  const catMeta = categories.find(c => c.id === faq.category);
                  return (
                    <li
                      key={i}
                      className={`fq-item ${open ? "fq-item--open" : ""}`}
                      style={{ "--delay": `${i * 0.035}s` }}
                      onClick={() => toggleFaq(i)}
                    >
                      <div className="fq-item__head">
                        <div className="fq-item__ico">{catMeta?.icon}</div>
                        <div className="fq-item__mid">
                          <p className="fq-item__q">{faq.question}</p>
                          <span className="fq-item__tag">{catMeta?.label}</span>
                        </div>
                        <ChevronDown
                          size={15}
                          strokeWidth={2.5}
                          className={`fq-item__chevron ${open ? "fq-item__chevron--open" : ""}`}
                        />
                      </div>

                      <div className={`fq-item__body ${open ? "fq-item__body--open" : ""}`}>
                        <p className="fq-item__ans">{faq.answer}</p>
                        <div className="fq-item__foot">
                          <span>Helpful?</span>
                          <button className="fq-helpful fq-helpful--yes" onClick={e => e.stopPropagation()} title="Yes, this helped">
                            <ThumbsUp size={13} strokeWidth={2} />
                            <span>Yes</span>
                          </button>
                          <button className="fq-helpful fq-helpful--no" onClick={e => e.stopPropagation()} title="No, not helpful">
                            <ThumbsDown size={13} strokeWidth={2} />
                            <span>No</span>
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="fq-empty">
                <div className="fq-empty__ico">
                  <HelpCircle size={28} strokeWidth={1.5} />
                </div>
                <h3>No results found</h3>
                <p>Try different keywords or browse a topic from the sidebar</p>
                <button
                  className="fq-empty__btn"
                  onClick={() => { setSearchQuery(""); setActiveCategory("all"); }}
                >
                  View All Articles
                </button>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════
          CONTACT
      ══════════════════════════════════════ */}
      <section className="fq-contact">
        <div className="fq-wrap">
          <div className="fq-contact__hdr">
            <p className="fq-contact__eyebrow">Support</p>
            <h2 className="fq-contact__title">Still need <em>help?</em></h2>
            <p className="fq-contact__sub">
              Our support team is standing by — reach us any way you prefer.
            </p>
          </div>
          <div className="fq-contact__grid">
            {contactOptions.map((o, i) => (
              <div key={i} className="fq-ccard">
                <div className="fq-ccard__ico">{o.icon}</div>
                <h3 className="fq-ccard__title">{o.title}</h3>
                <p className="fq-ccard__detail">{o.detail}</p>
                <p className="fq-ccard__desc">{o.description}</p>
                <button className="fq-ccard__btn">Get in Touch</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CTA
      ══════════════════════════════════════ */}
      <section className="fq-cta">
        <div className="fq-wrap fq-cta__inner">
          <div>
            <h2 className="fq-cta__title">Can't find <em>what you're looking for?</em></h2>
            <p className="fq-cta__sub">
              Send us a message — we'll get back to you within 24 hours.
            </p>
          </div>
          <Link to="/contact" className="fq-cta__btn">
            <Mail size={15} strokeWidth={2.5} />
            Contact Support
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}