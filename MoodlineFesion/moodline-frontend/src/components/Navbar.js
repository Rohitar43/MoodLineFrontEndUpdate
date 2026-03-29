import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef, useContext } from "react";
import { FiShoppingCart, FiUser, FiSearch, FiMenu, FiX } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import { CartContext } from "../context/CartContext";
import "../styles/navbar.css";
import logo from "../assets/logo.png";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef();
  const mobileMenuRef = useRef();

  const { cartCount } = useContext(CartContext);
  const [wishlistCount, setWishlistCount] = useState(0);

  const [token, setToken] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setToken(localStorage.getItem("token"));
    loadWishlistCount();
  }, [location.pathname]);

  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem("token"));
      loadWishlistCount();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("cartUpdated", loadWishlistCount);
    window.addEventListener("wishlistUpdated", loadWishlistCount);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("cartUpdated", loadWishlistCount);
      window.removeEventListener("wishlistUpdated", loadWishlistCount);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadWishlistCount = () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setWishlistCount(0);
      return;
    }

    const wishlistKey = `wishlist_${userId}`;
    const stored = JSON.parse(localStorage.getItem(wishlistKey) || "[]");
    setWishlistCount(Array.isArray(stored) ? stored.length : 0);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    setToken(null);
    setWishlistCount(0);
    setShowMenu(false);
    navigate("/login");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (window.location.pathname === '/products') {
        window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`;
      } else {
        navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      }
      setSearchQuery("");
      setShowMobileMenu(false);
    }
  };

  return (
    <nav className="navbar">
      {/* LEFT SIDE - LOGO + LINKS */}
      <div className="navbar-left">
        {/* LOGO */}
        <div className="navbar-logo" onClick={() => navigate("/")}>
          <img src={logo} alt="logo" />
          <span>MOODLINE</span>
        </div>

        {/* DESKTOP NAV LINKS */}
        <div className="nav-links">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "") }>
            Home
          </NavLink>
          <NavLink to="/products" className={({ isActive }) => (isActive ? "active" : "") }>
            Shop
          </NavLink>
          <NavLink to="/contact" className={({ isActive }) => (isActive ? "active" : "") }>
            Contact
          </NavLink>
          {token && ["Admin", "Manager"].includes(localStorage.getItem("role")) && (
            <NavLink to="/admin/notifications" className={({ isActive }) => (isActive ? "active" : "") }>
              Admin
            </NavLink>
          )}
        </div>
      </div>

      {/* CENTER - SEARCH BAR */}
      <form className="search-bar" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search for products, brands..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="search-btn" title="Search">
          <FiSearch />
        </button>
      </form>

      {/* RIGHT SIDE - ICONS + MENU */}
      <div className="navbar-right">
        {/* WISHLIST ICON */}
        <div className="wishlist-wrapper">
          <NavLink to="/wishlist" className="navbar-icon wishlist-icon">
            <FaHeart />
            {wishlistCount > 0 && <span className="badge">{wishlistCount}</span>}
          </NavLink>
        </div>

        {/* CART ICON */}
        <div className="cart-wrapper">
          <NavLink to="/cart" className="navbar-icon cart-icon">
            <FiShoppingCart />
            {cartCount > 0 && <span className="badge">{cartCount}</span>}
          </NavLink>
        </div>

        {/* USER PROFILE */}
        {token ? (
          <div className="profile-menu" ref={dropdownRef}>
            <button
              className="navbar-icon profile-icon"
              onClick={() => setShowMenu(!showMenu)}
              title="Profile"
            >
              <FiUser />
            </button>

            {showMenu && (
              <div className="dropdown-menu">
                {/* <NavLink to="/profile">Profile</NavLink> */}
                <NavLink to="/orders">My Orders</NavLink>
                <NavLink to="/wishlist">Wishlist</NavLink>
                <button onClick={logout}>Logout</button>
              </div>
            )}
          </div>
        ) : (
          <NavLink to="/login" className="login-btn">
            Login
          </NavLink>
        )}

        {/* MOBILE MENU TOGGLE */}
        <button
          className="mobile-menu-toggle"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          ref={mobileMenuRef}
        >
          {showMobileMenu ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {/* MOBILE MENU */}
      {showMobileMenu && (
        <div className="mobile-menu">
          <div className="mobile-menu-content">
            <NavLink to="/" end onClick={() => setShowMobileMenu(false)}>
              Home
            </NavLink>
            <NavLink to="/products" onClick={() => setShowMobileMenu(false)}>
              Shop
            </NavLink>
            <NavLink to="/contact" onClick={() => setShowMobileMenu(false)}>
              Contact
            </NavLink>
            {token && (
              <>
                <NavLink to="/profile" onClick={() => setShowMobileMenu(false)}>
                  Profile
                </NavLink>
                <NavLink to="/orders" onClick={() => setShowMobileMenu(false)}>
                  My Orders
                </NavLink>
                <NavLink to="/wishlist" onClick={() => setShowMobileMenu(false)}>
                  Wishlist
                </NavLink>
                { ["Admin", "Manager"].includes(localStorage.getItem("role")) && (
                  <NavLink to="/admin/notifications" onClick={() => setShowMobileMenu(false)}>
                    Admin
                  </NavLink>
                ) }
                <button className="logout-btn" onClick={logout}>
                  Logout
                </button>
              </>
            )}
            {!token && (
              <NavLink to="/login" className="mobile-login-btn" onClick={() => setShowMobileMenu(false)}>
                Login
              </NavLink>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
