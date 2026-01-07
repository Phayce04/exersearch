import './login.css';

export default function Login() {
  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Login</h1>
        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Password" />
        <button>Login</button>
      </div>
    </div>
  );
}
    