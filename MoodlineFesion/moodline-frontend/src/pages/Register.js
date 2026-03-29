import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../api/api";
import "../styles/login.css";

function Register() {

  const navigate = useNavigate();

  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    roleId: 3
  });

  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false); // 🔥 toggle

  const handleChange = (e) => {
    setData({
      ...data,
      [e.target.name]: e.target.value
    });
  };

  // ================= REGISTER =================
  const registerUser = async (e) => {
    e.preventDefault();

    if (!data.name || !data.email || !data.password || !data.confirmPassword) {
      toast.warning("Please fill all fields");
      return;
    }

    if (data.password !== data.confirmPassword) {
      toast.error("Passwords do not match ❌");
      return;
    }

    try {

      await API.post("/auth/register", data);

      toast.success("OTP sent to your email 📩");

      setIsOtpSent(true); // 🔥 show OTP box

    } catch (err) {
      toast.error(err.response?.data || "Registration Failed ❌");
    }
  };

  // ================= VERIFY OTP =================
  const verifyOtp = async (e) => {
    e.preventDefault();

    if (!otp) {
      toast.warning("Enter OTP");
      return;
    }

    try {

      await API.post("/auth/verify-otp", {
        email: data.email,
        otp: otp
      });

      toast.success("Account verified successfully ✅");

      navigate("/login");

    } catch (err) {
      toast.error(err.response?.data || "Invalid OTP ❌");
    }
  };

  return (
    <div className="login-container">

      {/* LEFT SIDE */}
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

      {/* RIGHT SIDE */}
      <div className="login-right">

        {/* ================= REGISTER FORM ================= */}
        {!isOtpSent ? (
          <form className="login-card" onSubmit={registerUser}>

            <div className="login-header">
              <h2>Create Your Account</h2>
              <p>Joining is free and fast</p>
            </div>

            <div className="form-group">
              <label>👤 Full Name</label>
              <input
                name="name"
                type="text"
                placeholder="Enter your name"
                value={data.name}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>📧 Email Address</label>
              <input
                name="email"
                type="email"
                placeholder="Enter Gmail only"
                value={data.email}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>🔒 Password</label>
              <input
                name="password"
                type="password"
                placeholder="Set your password"
                value={data.password}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>🔐 Confirm Password</label>
              <input
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={data.confirmPassword}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <input type="hidden" name="roleId" value={data.roleId} />

            <button type="submit" className="login-btn">
              Register
            </button>

          </form>
        ) : (

          /* ================= OTP FORM ================= */
          <form className="login-card" onSubmit={verifyOtp}>

            <div className="login-header">
              <h2>Verify OTP</h2>
              <p>Enter OTP sent to {data.email}</p>
            </div>

            <div className="form-group">
              <label>🔢 OTP</label>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="form-input"
              />
            </div>

            <button type="submit" className="login-btn">
              Verify OTP
            </button>

            {/* 🔁 Resend Option */}
            <p
              style={{ cursor: "pointer", marginTop: "10px", textAlign: "center" }}
              onClick={registerUser}
            >
              🔄 Resend OTP
            </p>

          </form>
        )}

      </div>
    </div>
  );
}

export default Register;