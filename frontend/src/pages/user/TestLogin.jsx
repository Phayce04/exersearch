import { useState, useEffect } from "react";
import {
  Eye, EyeOff, ArrowLeft, Check, User, Store, ShieldCheck, Mail
} from "lucide-react";
import "./TestLogin.css";

// ── Replace these src values with your actual PNG paths ──
const LOGO_LEFT_SRC  = "/src/assets/exersearchlogo.png";  // wordmark on the left dark panel
const LOGO_RIGHT_SRC = "gymlogo.png";                     // icon on the right form panel

const ROLES = [
  { id: "user",       Icon: User,        label: "Regular User",  desc: "Find gyms, track workouts & meal plans" },
  { id: "owner",      Icon: Store,       label: "Gym Owner",     desc: "Manage listings and promotions" },
  { id: "superadmin", Icon: ShieldCheck, label: "Super Admin",   desc: "Full platform access & management" },
];
const PW_RULES = [
  { id: "len", label: "8+ characters",    test: p => p.length >= 8 },
  { id: "up",  label: "Uppercase letter", test: p => /[A-Z]/.test(p) },
  { id: "num", label: "Number",           test: p => /[0-9]/.test(p) },
  { id: "sym", label: "Special char",     test: p => /[!@#$%^&*()\-_=+[\]{};':"\\|,.<>/?]/.test(p) },
];

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

const LEFT_CONTENT = {
  login:  { tag: "Welcome back",    title: <>Find Your <em>Perfect</em><br/>Gym Again</>,       desc: "Sign in to access your personalised gym finder, meal plans, and progress tracker." },
  signup: { tag: "Join ExerSearch", title: <>Start Your <em>Fitness</em><br/>Journey Today</>,  desc: "Create a free account and discover the best gyms and fitness resources near you." },
  role:   { tag: "One more step",   title: <>Choose How<br/>You Want to <em>Continue</em></>,   desc: "Pick the role that best describes you. You can change this later in settings." },
  verify: { tag: "Almost done",     title: <>Check Your<br/><em>Email</em> Inbox</>,             desc: "Click the verification link we sent you to activate your account and get started." },
};

function LeftPanel({ view }) {
  const c = LEFT_CONTENT[view] || LEFT_CONTENT.login;
  return (
    <div className="auth-left">
      <div className="auth-left__photo" />
      <div className="auth-left__content">
        {/* ExerSearch wordmark logo on left panel */}
        <div className="auth-logo">
          <img className="auth-logo__wordmark" src={LOGO_LEFT_SRC} alt="ExerSearch" />
        </div>
        <div className="auth-left__copy">
          <div className="auth-left__tag">
            <div className="auth-left__tag-line"/>
            <span className="auth-left__tag-text">{c.tag}</span>
          </div>
          <h1 className="auth-left__title" key={view}>{c.title}</h1>
          <p className="auth-left__desc">{c.desc}</p>
          <div className="auth-left__stats">
            {[["500+","Partner gyms"],["50k+","Active users"],["4.9★","App rating"]].map(([n,l]) => (
              <div key={l}>
                <div className="auth-left__stat-num">{n}</div>
                <div className="auth-left__stat-label">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginView({ onSwitch, onGoogle, onSubmit, loading, error }) {
  const [email, setEmail] = useState("");
  const [pw,    setPw]    = useState("");
  const [show,  setShow]  = useState(false);
  return (
    <div className="auth-view--login">
      <div className="auth-hd">
        <h2 className="auth-hd__title">Sign in</h2>
        <p className="auth-hd__sub">Don't have an account? <button onClick={onSwitch}>Create one free</button></p>
      </div>
      <button className="auth-google" onClick={onGoogle}><GoogleLogo/>Continue with Google</button>
      <div className="auth-div"><div className="auth-div__line"/><span className="auth-div__text">or with email</span><div className="auth-div__line"/></div>
      {error && <div className="auth-err"><ShieldCheck size={14}/>{error}</div>}
      <form onSubmit={e=>{e.preventDefault();onSubmit({email,password:pw});}}>
        <div className="auth-field">
          <label className="auth-field__label">Email address</label>
          <div className="auth-field__row">
            <input className="auth-input" type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required/>
          </div>
        </div>
        <div className="auth-field">
          <label className="auth-field__label">Password</label>
          <div className="auth-field__row">
            <input className="auth-input" type={show?"text":"password"} placeholder="Enter your password" value={pw} onChange={e=>setPw(e.target.value)} required/>
            <button type="button" className="auth-eye" onClick={()=>setShow(v=>!v)}>{show?<EyeOff size={15}/>:<Eye size={15}/>}</button>
          </div>
        </div>
        <div className="auth-forgot"><button type="button">Forgot password?</button></div>
        <button className="auth-submit" type="submit" disabled={loading}>
          {loading?<><span className="auth-spinner"/>Signing in…</>:"Sign in to ExerSearch"}
        </button>
      </form>
    </div>
  );
}

function RoleView({ email, onSelect, onBack, loading }) {
  const [sel, setSel] = useState(null);
  return (
    <div className="auth-view--role">
      <button className="auth-back" onClick={onBack}><ArrowLeft size={14}/>Back</button>
      <div className="auth-role-hd__title">Who are you?</div>
      <p className="auth-role-hd__sub">Select how you'd like to use ExerSearch.</p>
      <div className="auth-role-chip">
        <div className="auth-role-chip__av"><User size={16}/></div>
        <div>
          <p className="auth-role-chip__email">{email}</p>
          <p className="auth-role-chip__hint">Choose your role below</p>
        </div>
      </div>
      <div className="auth-roles">
        {ROLES.map(({id,Icon,label,desc})=>(
          <button key={id} className={`auth-role-card${sel===id?" sel":""}`} onClick={()=>setSel(id)}>
            <div className="auth-role-card__icon"><Icon size={18} strokeWidth={2}/></div>
            <div style={{flex:1}}>
              <p className="auth-role-card__label">{label}</p>
              <p className="auth-role-card__desc">{desc}</p>
            </div>
            <div className="auth-role-card__check">{sel===id&&<Check size={11} strokeWidth={3}/>}</div>
          </button>
        ))}
      </div>
      <button className="auth-submit" style={{marginTop:14}} disabled={!sel||loading} onClick={()=>onSelect(sel)}>
        {loading?<><span className="auth-spinner"/>Continuing…</>:`Continue as ${ROLES.find(r=>r.id===sel)?.label||"…"}`}
      </button>
    </div>
  );
}

function SignupView({ onSwitch, onGoogle, onSubmit, loading, error }) {
  const [f,setF] = useState({firstName:"",lastName:"",email:"",phone:"",password:"",confirm:""});
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  const [showPw,  setShowPw]  = useState(false);
  const [showCfm, setShowCfm] = useState(false);
  const rules   = PW_RULES.map(r=>({...r,ok:r.test(f.password)}));
  const allOk   = rules.every(r=>r.ok);
  const match   = f.password && f.confirm && f.password===f.confirm;
  const noMatch = f.confirm && f.password!==f.confirm;
  return (
    <div className="auth-view--signup">
      <div className="auth-hd">
        <h2 className="auth-hd__title">Create account</h2>
        <p className="auth-hd__sub">Already have one? <button onClick={onSwitch}>Sign in</button></p>
      </div>
      <button className="auth-google" onClick={onGoogle}><GoogleLogo/>Sign up with Google</button>
      <div className="auth-div"><div className="auth-div__line"/><span className="auth-div__text">or with email</span><div className="auth-div__line"/></div>
      {error && <div className="auth-err"><ShieldCheck size={14}/>{error}</div>}
      <form onSubmit={e=>{e.preventDefault();if(allOk&&match)onSubmit(f);}}>
        <div className="auth-2col">
          <div className="auth-field">
            <label className="auth-field__label">First name</label>
            <div className="auth-field__row"><input className="auth-input" type="text" placeholder="Juan" value={f.firstName} onChange={e=>set("firstName",e.target.value)} required/></div>
          </div>
          <div className="auth-field">
            <label className="auth-field__label">Last name</label>
            <div className="auth-field__row"><input className="auth-input" type="text" placeholder="Dela Cruz" value={f.lastName} onChange={e=>set("lastName",e.target.value)} required/></div>
          </div>
        </div>
        <div className="auth-field">
          <label className="auth-field__label">Email address</label>
          <div className="auth-field__row"><input className="auth-input" type="email" placeholder="juan@example.com" value={f.email} onChange={e=>set("email",e.target.value)} required/></div>
        </div>
        <div className="auth-field">
          <label className="auth-field__label">Contact number</label>
          <div className="auth-field__row">
            <div className="auth-prefix"><span className="auth-prefix__flag">🇵🇭</span>+63</div>
            <input className="auth-input auth-input--phone" type="tel" placeholder="9XX XXX XXXX" value={f.phone} onChange={e=>set("phone",e.target.value.replace(/\D/g,"").slice(0,10))} required/>
          </div>
        </div>
        <div className="auth-field">
          <label className="auth-field__label">Password</label>
          <div className="auth-field__row">
            <input className="auth-input" type={showPw?"text":"password"} placeholder="Create a strong password" value={f.password} onChange={e=>set("password",e.target.value)} required/>
            <button type="button" className="auth-eye" onClick={()=>setShowPw(v=>!v)}>{showPw?<EyeOff size={15}/>:<Eye size={15}/>}</button>
          </div>
          {f.password&&<div className="auth-rules">{rules.map(r=><div key={r.id} className={`auth-rule${r.ok?" ok":""}`}><div className="auth-rule__dot"/>{r.label}</div>)}</div>}
        </div>
        <div className="auth-field">
          <label className="auth-field__label">Confirm password</label>
          <div className="auth-field__row">
            <input className={`auth-input${match?" auth-input--ok":noMatch?" auth-input--bad":""}`} type={showCfm?"text":"password"} placeholder="Re-enter your password" value={f.confirm} onChange={e=>set("confirm",e.target.value)} required/>
            {f.confirm&&<span className={`auth-match${noMatch?" auth-match--bad":""}`}>{match?<Check size={13} strokeWidth={3}/>:<span style={{fontSize:13}}>✕</span>}</span>}
            <button type="button" className="auth-eye" onClick={()=>setShowCfm(v=>!v)}>{showCfm?<EyeOff size={15}/>:<Eye size={15}/>}</button>
          </div>
        </div>
        <button className="auth-submit" type="submit" disabled={loading||!allOk||!match}>
          {loading?<><span className="auth-spinner"/>Creating account…</>:"Create my account"}
        </button>
      </form>
    </div>
  );
}

function VerifyView({ email, onResend, onVerified, onLogout }) {
  const [sent,setSent] = useState(false);
  const [cd,setCd]     = useState(0);
  useEffect(()=>{
    if(cd<=0)return;
    const t=setTimeout(()=>{setCd(c=>c-1);if(cd===1)setSent(false);},1000);
    return()=>clearTimeout(t);
  },[cd]);
  function handleResend(){onResend();setSent(true);setCd(60);}
  return (
    <div className="auth-view--verify">
      <div className="auth-verify">
        <div className="auth-verify__rings">
          <div className="auth-verify__ring"/>
          <div className="auth-verify__ring"/>
          <div className="auth-verify__ring"/>
          <div className="auth-verify__icon"><Mail size={22} strokeWidth={1.8}/></div>
        </div>
        <h2 className="auth-verify__title">Check your inbox</h2>
        <p className="auth-verify__body">We sent a verification link to</p>
        <span className="auth-verify__email">{email}</span>
        <p className="auth-verify__body" style={{marginBottom:20}}>
          Click the link to activate your account.<br/>Don't see it? Check your spam folder.
        </p>
        <div className="auth-verify__btns">
          <button className="auth-vbtn auth-vbtn--primary" onClick={onVerified}><Check size={15} strokeWidth={2.5}/>I've verified my email</button>
          <button className="auth-vbtn auth-vbtn--outline" onClick={handleResend} disabled={cd>0}><Mail size={14}/>{cd>0?`Resend in ${cd}s`:"Resend verification email"}</button>
          <button className="auth-vbtn auth-vbtn--ghost" onClick={onLogout}>Sign out &amp; try again</button>
        </div>
        {sent&&<p className="auth-verify__ok">Verification email sent.</p>}
      </div>
    </div>
  );
}

export default function Auth() {
  const [view,      setView]      = useState("login");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [userEmail, setUserEmail] = useState("");
  const go = v => { setError(""); setView(v); };

  async function handleLogin({email,password}) {
    setLoading(true); setError("");
    try {
      await new Promise(r=>setTimeout(r,1100));
      setUserEmail(email); go("role");
    } catch(e){ setError(e.message||"Invalid email or password."); }
    finally { setLoading(false); }
  }
  async function handleRoleSelect(role) {
    setLoading(true);
    try {
      await new Promise(r=>setTimeout(r,800));
      console.log("Role selected:", role);
    } catch(e){ setError(e.message||"Something went wrong."); }
    finally { setLoading(false); }
  }
  async function handleSignup(data) {
    setLoading(true); setError("");
    try {
      await new Promise(r=>setTimeout(r,1300));
      setUserEmail(data.email); go("verify");
    } catch(e){ setError(e.message||"Something went wrong."); }
    finally { setLoading(false); }
  }

  return (
    <div className="auth-root">
      <LeftPanel view={view}/>
      <div className="auth-right">
        {/* Gym logo top-right of the form panel */}
        <div className="auth-right__logo">
          <img src={LOGO_RIGHT_SRC} alt="Gym" className="auth-right__logo-img" />
        </div>
        <div className="auth-right__inner">
          <div className="auth-card">
            {view==="login"  && <LoginView  onSwitch={()=>go("signup")} onGoogle={()=>{}} onSubmit={handleLogin}  loading={loading} error={error}/>}
            {view==="role"   && <RoleView   email={userEmail} onSelect={handleRoleSelect} onBack={()=>go("login")} loading={loading}/>}
            {view==="signup" && <SignupView onSwitch={()=>go("login")}  onGoogle={()=>{}} onSubmit={handleSignup} loading={loading} error={error}/>}
            {view==="verify" && <VerifyView email={userEmail} onResend={()=>{}} onVerified={()=>{}} onLogout={()=>go("login")}/>}
          </div>
        </div>
      </div>
    </div>
  );
}