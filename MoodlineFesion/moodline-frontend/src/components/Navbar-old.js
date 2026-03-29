import { NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useContext } from "react";
import { FiShoppingCart, FiUser } from "react-icons/fi";
import { CartContext } from "../context/CartContext"; // ✅ ADD
import "../styles/navbar.css";
import logo from "../assets/logo.png";

function Navbar() {
  const navigate = useNavigate();
  const dropdownRef = useRef();

  const { cartCount } = useContext(CartContext); // ✅ USE CONTEXT

  const [token, setToken] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    setToken(localStorage.getItem("token"));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");

    navigate("/login");
    window.location.reload();
  };

  return (
    <nav className="navbar">
      
      {/* LOGO */}
      <div className="logo" onClick={() => navigate("/")}>
        <img src={logo} alt="logo" />
        <span>LUXE</span>
      </div>

      {/* NAV LINKS */}
      <div className="nav-links">
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/products">Shop</NavLink>
        <NavLink to="/contact">Contact</NavLink>
      </div>

      {/* RIGHT SIDE */}
      <div className="nav-right">

        {/* CART ICON */}
        <NavLink to="/cart" className="cart-icon">
          <FiShoppingCart />
          {cartCount > 0 && (
            <span className="cart-badge">{cartCount}</span>
          )}
        </NavLink>

        {/* PROFILE */}
        {token ? (
          <div className="profile-menu" ref={dropdownRef}>
            <span
              className="profile-icon"
              onClick={() => setShowMenu(!showMenu)}
            >
              <FiUser />
            </span>

            {showMenu && (
              <div className="dropdown">
                <NavLink to="/profile">Profile</NavLink>
                <button onClick={logout}>Logout</button>
              </div>
            )}
          </div>
        ) : (
          <NavLink to="/login" className="login-btn">
            Login
          </NavLink>
        )}

      </div>
    </nav>
  );
}

export default Navbar;