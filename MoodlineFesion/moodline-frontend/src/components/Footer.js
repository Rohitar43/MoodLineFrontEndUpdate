import { useNavigate } from "react-router-dom";
import { FaHome, FaShoppingBag, FaHeart, FaUser } from "react-icons/fa";
import { toast } from "react-toastify";
import logo from "../assets/logo.png";
import "../styles/footer.css";

function Footer() {
  const navigate = useNavigate();

  return (
    <>
      {/* ===== MOBILE FOOTER (UNCHANGED) ===== */}
      <div className="mobile-footer">
        <div onClick={() => navigate("/")}>
          <FaHome />
          <span>Home</span>
        </div>

        <div onClick={() => navigate("/products")}>
          <FaShoppingBag />
          <span>Shop</span>
        </div>

        <div onClick={() => navigate("/wishlist")}>
          <FaHeart />
          <span>Wishlist</span>
        </div>

        <div onClick={() => navigate("/profile")}>
          <FaUser />
          <span>Account</span>
        </div>
      </div>

      {/* ===== DESKTOP FOOTER ===== */}
      <footer className="desktop-footer">

        <div className="footer-row">

          {/* BRAND */}
          <div className="footer-brand" onClick={() => navigate("/")}>
            <img src={logo} alt="logo" />
            <span>LUXE</span>
          </div>

          {/* NAVIGATION */}
          <div className="footer-group">
            <p className="footer-title">Explore</p>
            <div className="footer-links">
              <span onClick={() => navigate("/")}>Home</span>
              <span onClick={() => navigate("/products")}>Shop</span>
              <span onClick={() => navigate("/contact")}>Contact</span>
            </div>
          </div>

          {/* CONTACT */}
          <div className="footer-group">
            <p className="footer-title">Contact Us</p>
            <div className="footer-contact">
              <span>support@luxe.com</span>
              <span>+91 98765 43210</span>
              <span>Mon-Fri: 9am - 7pm IST</span>
            </div>
          </div>

          {/* COMPANY */}
          <div className="footer-group">
            <p className="footer-title">Company</p>
            <div className="footer-links">
              <span
                onClick={() => {
                  toast.info("Coming soon: About Us 🚧", { autoClose: 2000 });
                }}
              >
                About Us
              </span>
              <span
                onClick={() => {
                  toast.info("Coming soon: Terms of Use 🚧", { autoClose: 2000 });
                }}
              >
                Terms of Use
              </span>
              <span
                onClick={() => {
                  toast.info("Coming soon: Privacy Policy 🚧", { autoClose: 2000 });
                }}
              >
                Privacy Policy
              </span>
            </div>
          </div>

        </div>

        <div className="footer-bottom">
          © 2026 LUXE. All rights reserved.
        </div>

      </footer>
    </>
  );
}

export default Footer;