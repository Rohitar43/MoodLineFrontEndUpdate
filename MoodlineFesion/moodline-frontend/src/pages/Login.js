import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../api/api";
import "../styles/login.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/");
    }
  }, [navigate]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const loginUser = async (e) => {

    e.preventDefault();

    if (!email || !password) {
      toast.warning("Please enter both email and password ⚠️");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address 📧");
      return;
    }

    try {

      setLoading(true);

      const res = await API.post("/auth/login", {
  email,
  password
});
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("userId", res.data.userId);

      toast.success("Login Successful 🎉");

      setTimeout(() => {
        const stateFrom = location.state?.from;
        const locationRedirect = stateFrom
          ? `${stateFrom.pathname || "/"}${stateFrom.search || ""}`
          : null;
        const redirectPath =
          localStorage.getItem("redirectAfterLogin") ||
          locationRedirect ||
          "/products";

        localStorage.removeItem("redirectAfterLogin");
        navigate(redirectPath);
      }, 1000);

    } catch (error) {

      console.error(error);

      toast.error("Invalid email or password ❌");

    } finally {

      setLoading(false);

    }
  };

  return (

    <div className="login-container">

      {/* Left Banner with E-commerce Benefits */}

      <div className="login-left">

        <div className="login-branding">

          <h1>🛍️ Moodline Fashion</h1>

          <p className="tagline">Discover Your Perfect Style</p>

        </div>

        <div className="ecommerce-benefits">

          <div className="benefit-item">
            <span className="benefit-icon">✨</span>
            <p>Trendy Collections</p>
          </div>

          <div className="benefit-item">
            <span className="benefit-icon">🚚</span>
            <p>Fast Delivery</p>
          </div>

          <div className="benefit-item">
            <span className="benefit-icon">🛡️</span>
            <p>Secure Payment</p>
          </div>

          <div className="benefit-item">
            <span className="benefit-icon">💝</span>
            <p>Best Prices</p>
          </div>

        </div>

      </div>

      {/* Right Login Form */}

      <div className="login-right">

        <form className="login-card" onSubmit={loginUser}>

          <div className="login-header">
            <h2>Welcome Back</h2>
            <p>Shop from the latest fashion trends</p>
          </div>

          <div className="form-group">
            <label htmlFor="email">📧 Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">🔒 Password</label>
            <div className="password-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <span
              className="forgot-password"
              onClick={() => navigate("/forgot-password")}
            >
              Forgot Password?
            </span>
          </div>

          <button type="submit" disabled={loading} className="login-btn">

            {loading ? "🔄 Logging in..." : "Login to Shop"}

          </button>

          <div className="divider">
            <span>OR</span>
          </div>

          <div className="social-login">
            <button type="button" className="social-btn google">
              <span>Google</span>
            </button>
            <button type="button" className="social-btn facebook">
              <span>Facebook</span>
            </button>
          </div>

          <div className="auth-footer">
            <p>
              Don't have an account?
              <span
                className="register-link"
                onClick={() => navigate("/register")}
              >
                Register Now
              </span>
            </p>
            <p className="terms">
              By logging in, you agree to our 
              <span
                className="terms-link"
                onClick={() => toast.info("Coming soon: Terms & Conditions 🚧", { autoClose: 2000 })}
                style={{ cursor: "pointer", color: "#2563eb" }}
              >
                Terms & Conditions
              </span>
            </p>
          </div>

        </form>

      </div>

    </div>

  );
}

export default Login;