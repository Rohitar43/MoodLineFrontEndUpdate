import { useEffect, useState } from "react";
import API from "../api/api";
import { useNavigate } from "react-router-dom";
import "../styles/wishlist.css";
import { FaHeart } from "react-icons/fa";
import { useContext } from "react";
import { CartContext } from "../context/CartContext";
import { toast } from "react-toastify";

function Wishlist() {

  const [wishlist, setWishlist] = useState([]);
  const navigate = useNavigate();
  const { loadCartCount } = useContext(CartContext);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    const userId = localStorage.getItem("userId");
    try {
      if (userId) {
        const wishlistKey = `wishlist_${userId}`;
        const stored = JSON.parse(localStorage.getItem(wishlistKey) || "[]");

        const enriched = await Promise.all(
          stored.map(async (item) => {
            try {
              const { data: product } = await API.get(`product/${item.productId}`);
              return { ...item, product };
            } catch (err) {
              console.error("Error loading wishlist product", item.productId, err);
              return item;
            }
          })
        );

        setWishlist(enriched);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const removeFromWishlist = async (productId) => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      const wishlistKey = `wishlist_${userId}`;
      const stored = JSON.parse(localStorage.getItem(wishlistKey) || "[]");
      const updated = stored.filter(x => x.productId !== productId);
      localStorage.setItem(wishlistKey, JSON.stringify(updated));
    }
    setWishlist(prev => prev.filter(x => x.productId !== productId));
    window.dispatchEvent(new Event("wishlistUpdated"));
  };

  const addToCart = async (productId) => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    if (!token || !userId) {
      localStorage.setItem("redirectAfterLogin", window.location.pathname + window.location.search);
      toast.warning("Please log in to continue 🔐");
      navigate("/login");
      return;
    }

    try {
      const res = await API.get(`product/${productId}`);
      const product = res.data;

      if (!product.variants || product.variants.length === 0) {
        toast.warning("No variant available ❌");
        return;
      }

      const variant = product.variants[0];
      const firstSize = variant.sizes?.[0] || "Free Size";

      console.log("Wishlist.addToCart invoked", { productId, userId });

      const apiRes = await API.post("cart", {
        userId: Number(userId),
        productId: product.id,
        variantId: variant.id,
        quantity: 1,
        size: firstSize,
        color: variant.color,
      });

      console.log("Wishlist.addToCart API response", apiRes.data);

      const cartKey = `cart_${userId}`;
      const stored = JSON.parse(localStorage.getItem(cartKey) || "[]");

      const existingItem = stored.find(
        (item) => item.productId === product.id && item.variantId === variant.id && item.size === firstSize
      );

      if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
      } else {
        stored.push({
          id: Date.now(),
          productId: product.id,
          variantId: variant.id,
          quantity: 1,
          size: firstSize,
          color: variant.color,
        });
      }

      localStorage.setItem(cartKey, JSON.stringify(stored));
      toast.success("Moved to Cart 🛒");
      loadCartCount();
      window.dispatchEvent(new Event("cartUpdated"));
      removeFromWishlist(productId);
    } catch (err) {
      console.error("Wishlist addToCart error", err);
      toast.warning("Unable to add to cart ❌");
    }
  };

  // EMPTY STATE
  if (wishlist.length === 0) {
    return (
      <div className="wishlist-page-empty">
        <div className="breadcrumb">
          <span onClick={() => navigate("/")} style={{ cursor: "pointer", color: "#2563eb" }}>
            🏠 Home
          </span>
          <span>/</span>
          <span>My Wishlist</span>
        </div>
        <div className="empty-wishlist">
          <FaHeart size={70} />
          <h2>Your Wishlist is Empty</h2>
          <p>Save your favorite items here ❤️</p>

          <button onClick={() => navigate("/products")}>
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  const getTotalPrice = () => {
    return wishlist.reduce((total, item) => {
      const product = item.product || {};
      const variant = product.variants?.find(v => v.id === item.variantId) || product.variants?.[0] || {};
      const unitPrice = variant.price || product.price || 0;
      return total + unitPrice;
    }, 0);
  };

  return (
    <div className="wishlist-page-outer">
      <div className="breadcrumb">
        <span onClick={() => navigate("/")} style={{ cursor: "pointer", color: "#2563eb" }}>
          🏠 Home
        </span>
        <span>/</span>
        <span>My Wishlist</span>
      </div>
      <div className="wishlist-page-container">

      {/* LEFT - WISHLIST ITEMS */}
      <div className="wishlist-left">
        <h2 className="wishlist-title">❤️ My Wishlist ({wishlist.length})</h2>

        <div className="wishlist-items">
          {wishlist.map((item, index) => {
            const product = item.product || {};
            const variant = product.variants?.find(v => v.id === item.variantId) || product.variants?.[0] || {};
            const imageUrl = variant.images?.[0]?.imageUrl || product.imageUrl;
            const unitPrice = variant.price || product.price || 0;

            return (
              <div className="wishlist-card" key={item.productId || index}>

                <div className="wishlist-card-img">
                  <img
                    src={
                      imageUrl
                        ? `https://moodlinebackend.onrender.com${imageUrl}`
                        : "/no-image.png"
                    }
                    alt={product.name || "Wishlist product"}
                  />
                </div>

                <div className="wishlist-card-info">
                  <h4>{product.name || item.productName || "Product"}</h4>
                  <p className="wishlist-variant">
                    {variant.color ? `${variant.color}` : ""} 
                    {variant.size ? ` • ${variant.size}` : ""}
                  </p>
                  <p className="wishlist-price">₹{unitPrice.toLocaleString()}</p>
                </div>

                <div className="wishlist-card-actions">
                  <button
                    className="move-to-cart-btn"
                    onClick={() => addToCart(item.productId)}
                    title="Move to Cart"
                  >
                    🛒 Add
                  </button>

                  <button
                    className="remove-btn"
                    onClick={() => removeFromWishlist(item.productId)}
                    title="Remove from Wishlist"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT - WISHLIST SUMMARY */}
      <div className="wishlist-right">
        <h3>📋 Wishlist Summary</h3>

        <div className="wishlist-summary-section">
          <h4>Items</h4>
          <p className="summary-stat">
            <span>Total Items:</span>
            <strong>{wishlist.length}</strong>
          </p>
        </div>

        <hr />

        <div className="wishlist-summary-section">
          <h4>Pricing</h4>
          <div className="summary-row">
            <span>Total Value:</span>
            <strong>₹{getTotalPrice().toLocaleString()}</strong>
          </div>
        </div>

        <hr />

        <div className="wishlist-info-box">
          💡 These items can be purchased anytime. Keep saving your favorites!
        </div>

        <div className="wishlist-button-group">
          <button
            className="checkout-wishlist-btn"
            onClick={() => navigate("/products")}
          >
            Continue Shopping
          </button>

          <button
            className="move-all-btn"
            onClick={() => {
              wishlist.forEach(item => addToCart(item.productId));
            }}
          >
            Add All to Cart
          </button>
        </div>

        <p className="secure-badge">🔒 100% Secure</p>
      </div>

    </div>
    </div>
  );
}

export default Wishlist;