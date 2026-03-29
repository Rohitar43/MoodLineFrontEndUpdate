import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiShoppingCart,
  FiTrash2,
  FiArrowLeft,
  FiPlus,
  FiMinus
} from "react-icons/fi";
import API from "../api/api";
import { CartContext } from "../context/CartContext";
import "../styles/cart.css";

function Cart() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  const { loadCartCount } = useContext(CartContext);
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (userId) {
        const cartKey = `cart_${userId}`;
        const stored = JSON.parse(localStorage.getItem(cartKey) || "[]");

        const enriched = await Promise.all(
          stored.map(async (item) => {
            try {
              const { data: product } = await API.get(`product/${item.productId}`);
              return { ...item, product };
            } catch (err) {
              console.error("Error loading product for cart", item.productId, err);
              return item;
            }
          })
        );

        setCart(enriched);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (id) => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      const cartKey = `cart_${userId}`;
      const stored = JSON.parse(localStorage.getItem(cartKey) || "[]");
      const updated = stored.filter(item => item.id !== id);
      localStorage.setItem(cartKey, JSON.stringify(updated));
    }
    setCart(prev => prev.filter(item => item.id !== id));
    loadCartCount();
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const formatImage = (cartItem) => {
    const product = cartItem.product || {};
    const selectedVariant = product.variants?.find(v => v.id === cartItem.variantId);
    const imageFromVariant = selectedVariant?.images?.[0]?.imageUrl;
    const fallbackImage = product.variants?.[0]?.images?.[0]?.imageUrl || product.imageUrl;
    const imageUrl = imageFromVariant || fallbackImage;
    return imageUrl ? `https://moodlinebackend.onrender.com${imageUrl}` : "/no-image.png";
  };

  const increaseQty = async (id) => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      const cartKey = `cart_${userId}`;
      const stored = JSON.parse(localStorage.getItem(cartKey) || "[]");
      const item = stored.find(i => i.id === id);
      if (item) {
        item.quantity = (item.quantity || 1) + 1;
        localStorage.setItem(cartKey, JSON.stringify(stored));
      }
    }
    setCart(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
    loadCartCount();
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const decreaseQty = async (id) => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      const cartKey = `cart_${userId}`;
      const stored = JSON.parse(localStorage.getItem(cartKey) || "[]");
      const item = stored.find(i => i.id === id);
      if (item && item.quantity > 1) {
        item.quantity = item.quantity - 1;
        localStorage.setItem(cartKey, JSON.stringify(stored));
      }
    }
    setCart(prev =>
      prev.map(item =>
        item.id === id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
    loadCartCount();
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const getTotal = () => {
    return cart.reduce((total, item) => {
      const basePrice = item.product?.variants?.find(v => v.id === item.variantId)?.price || item.product?.price || 0;
      const discount = item.product?.discountPercent || 0;
      const productPrice = discount ? Math.round(basePrice - (basePrice * discount / 100)) : basePrice;
      return total + item.quantity * productPrice;
    }, 0);
  };

  if (loading) return <h2 className="loading">Loading your cart...</h2>;

  if (cart.length === 0) {
    return (
      <div className="cart-page-empty">
        <div className="breadcrumb">
          <span onClick={() => navigate("/")} style={{ cursor: "pointer", color: "#2563eb" }}>
            🏠 Home
          </span>
          <span>/</span>
          <span>Shopping Cart</span>
        </div>
        <div className="empty-cart">
          <FiShoppingCart size={70} />
          <h2>Your Cart is Empty</h2>
          <p>Add items to start shopping 🛍️</p>

          <button onClick={() => navigate("/products")}>
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page-outer">
      <div className="breadcrumb">
        <span onClick={() => navigate("/")} style={{ cursor: "pointer", color: "#2563eb" }}>
          🏠 Home
        </span>
        <span>/</span>
        <span>Shopping Cart</span>
      </div>
      <div className="cart-page">

      {/* LEFT */}
      <div className="cart-left">
        {cart.map(item => {
          const variant = item.product?.variants?.find(v => v.id === item.variantId) || {};
          const basePrice = variant.price || item.product?.price || 0;
          const discount = item.product?.discountPercent || 0;
          const itemPrice = discount ? Math.round(basePrice - (basePrice * discount / 100)) : basePrice;

          return (
            <div className="cart-card" key={item.id}>

              {/* IMAGE */}
              <img
                className="cart-img"
                src={formatImage(item)}
                alt={item.product?.name || "Cart item"}
              />

              {/* INFO */}
              <div className="cart-info">

                {/* TITLE + VARIANT INLINE */}
                <h4>
                  {item.product?.name || "Product"}
                  <span className="mini-variant">
                    ({item.color || variant.color || "N/A"}, {item.size || variant.size || "N/A"})
                  </span>
                </h4>

                <p className="price">Unit: ₹{itemPrice}</p>
                {discount > 0 && (
                  <span className="off">{discount}% OFF</span>
                )}
              </div>

              {/* ACTIONS */}
              <div className="cart-actions">

                <div className="qty-box">
                  <button
                    onClick={() => decreaseQty(item.id)}
                    disabled={item.quantity <= 1}
                  >
                    <FiMinus />
                  </button>

                  <span>{item.quantity}</span>

                  <button onClick={() => increaseQty(item.id)}>
                    <FiPlus />
                  </button>
                </div>

                <button
                  className="remove-btn"
                  onClick={() => removeItem(item.id)}
                >
                  <FiTrash2 /> Remove
                </button>

              </div>

              {/* TOTAL */}
              <div className="item-total-row">
                <span>Total</span>
                <span className="item-total-amount">
                  ₹{item.quantity * itemPrice}
                </span>
              </div>

            </div>
          );
        })}
      </div>

      {/* RIGHT */}
      <div className="cart-right">

        <h3>Order Summary</h3>

        <div className="summary-row">
          <span>Subtotal</span>
          <span>₹{getTotal()}</span>
        </div>

        <div className="summary-row">
          <span>Shipping</span>
          <span className="free">Free</span>
        </div>

        <hr />

        <div className="summary-total">
          <span>Total</span>
          <span>₹{getTotal()}</span>
        </div>

        <div className="delivery-box">
          🚚 Delivery in 3-5 days
        </div>

        <button
          className="checkout-btn"
          onClick={() => navigate("/checkout")}
        >
          Checkout Now
        </button>

        <button
          className="continue-btn"
          onClick={() => navigate("/products")}
        >
          <FiArrowLeft /> Continue Shopping
        </button>

        <p className="secure">🔒 100% Secure Payment</p>

      </div>

    </div>
    </div>
  );
}

export default Cart;