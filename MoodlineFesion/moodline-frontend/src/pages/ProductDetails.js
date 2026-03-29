import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import API from "../api/api";
import { CartContext } from "../context/CartContext";
import { FiShoppingCart } from "react-icons/fi";
import { FaHeart, FaWhatsapp } from "react-icons/fa";
import { toast } from "react-toastify";
import "../styles/productDetails.css";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loadCartCount } = useContext(CartContext);

  const [selectedSize, setSelectedSize] = useState(null);

  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [related, setRelated] = useState([]);
  const [qty, setQty] = useState(1);
  const [wishlist, setWishlist] = useState([]);
  const [mainImage, setMainImage] = useState(null);

  const [added, setAdded] = useState(false);
  const [wishAdded, setWishAdded] = useState(false);

  const baseUrl = "https://moodlinebackend.onrender.com";

  useEffect(() => {
    fetchProduct();
    loadWishlist();
  }, [id]);

  const fetchProduct = async () => {
    const res = await API.get(`/product/${id}`);
    const data = res.data;

    setProduct(data);

    if (data.variants?.length > 0) {
      setSelectedVariant(data.variants[0]);
      setMainImage(data.variants[0].images?.[0]?.imageUrl);
    }

    const all = await API.get("/product");

    // 🔥 REMOVE DUPLICATE
    const unique = [...new Map(all.data.map(p => [p.id, p])).values()];

    const relatedItems = unique.filter(
      x => x.category === data.category && x.id !== data.id
    );

    setRelated(relatedItems.slice(0, 4));
  };

  const loadWishlist = async () => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      const wishlistKey = `wishlist_${userId}`;
      const stored = JSON.parse(localStorage.getItem(wishlistKey) || "[]");
      setWishlist(stored.map(x => x.productId));
    }
  };

  const toggleWishlist = async () => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      localStorage.setItem("redirectAfterLogin", window.location.pathname + window.location.search);
      toast.warning("Please log in to continue 🔐");
      navigate("/login");
      return;
    }

    const wishlistKey = `wishlist_${userId}`;
    const stored = JSON.parse(localStorage.getItem(wishlistKey) || "[]");
    const isInWishlist = stored.some((item) => item.productId === product.id);

    if (isInWishlist) {
      const updated = stored.filter((item) => item.productId !== product.id);
      localStorage.setItem(wishlistKey, JSON.stringify(updated));
      setWishlist(prev => prev.filter(id => id !== product.id));
    } else {
      const newItem = { productId: product.id, addedAt: new Date().toISOString() };
      const updated = [...stored, newItem];
      localStorage.setItem(wishlistKey, JSON.stringify(updated));
      setWishlist(prev => [...prev, product.id]);
    }

    setWishAdded(true);
    setTimeout(() => setWishAdded(false), 1000);
    window.dispatchEvent(new Event("wishlistUpdated"));
  };

  const addToCart = async () => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      localStorage.setItem("redirectAfterLogin", window.location.pathname + window.location.search);
      toast.warning("Please log in to continue 🔐");
      navigate("/login");
      return false;
    }

    if (!selectedSize) {
      toast.warning("Please select size ⚠️");
      return false;
    }

    console.log("ProductDetails.addToCart", { productId: product.id, userId, selectedSize });

    try {
      const res = await API.post("cart", {
        userId: Number(userId),
        productId: Number(product.id),
        variantId: selectedVariant.id,
        quantity: qty,
        size: selectedSize,
        color: selectedVariant.color,
      });

      console.log("ProductDetails.addToCart API response", res.data);

      const cartKey = `cart_${userId}`;
      const stored = JSON.parse(localStorage.getItem(cartKey) || "[]");
      const existingItem = stored.find(
        (item) => item.productId === product.id && item.variantId === selectedVariant.id && item.size === selectedSize
      );

      if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + qty;
      } else {
        stored.push({
          id: Date.now(),
          productId: product.id,
          variantId: selectedVariant.id,
          quantity: qty,
          size: selectedSize,
          color: selectedVariant.color,
        });
      }

      localStorage.setItem(cartKey, JSON.stringify(stored));
      loadCartCount();
      setAdded(true);
      setTimeout(() => setAdded(false), 1000);
      window.dispatchEvent(new Event("cartUpdated"));
      return true;
    } catch (err) {
      console.error("ProductDetails cart error", err);
      toast.warning("Failed to add to cart ❌");
      return false;
    }
  };

  const buyNow = async () => {
    const addedToCart = await addToCart();
    if (addedToCart) {
      navigate("/cart");
    }
  };

  const shareWhatsApp = () => {
    const url = window.location.href;
    const text = `🔥 ${product.name}\nPrice: ₹${unitPrice}\n👉 ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };

  if (!product) return <h2>Loading...</h2>;

  const discount = product.discountPercent || 0;
  const basePrice = selectedVariant?.price || product.price;

  const unitPrice = discount
    ? Math.round(basePrice - (basePrice * discount / 100))
    : basePrice;

  const totalPrice = unitPrice * qty;
  const savings = (basePrice - unitPrice) * qty;

  return (
    <div className="pdp-container">
      {/* BREADCRUMB */}
      <div className="breadcrumb">
        <span onClick={() => navigate("/")} style={{ cursor: "pointer", color: "#2563eb" }}>
          🏠 Home
        </span>
        <span>/</span>
        <span onClick={() => navigate("/products")} style={{ cursor: "pointer", color: "#2563eb" }}>
          Products
        </span>
        <span>/</span>
        <span>{product.name}</span>
      </div>

      <div className="pdp">

        {/* LEFT - IMAGE SECTION */}
        <div className="pdp-left">

          {/* THUMBNAILS */}
          <div className="thumbs">
            {selectedVariant?.images?.map((img, i) => (
              <img
                key={i}
                src={baseUrl + img.imageUrl}
                alt={`View ${i + 1}`}
                className={`thumb-img ${
                  mainImage === img.imageUrl ? "active" : ""
                }`}
                onClick={() => setMainImage(img.imageUrl)}
              />
            ))}
          </div>

          {/* MAIN IMAGE */}
          <div className="main-img">
            {discount > 0 && (
              <span className="discount-badge">{discount}% OFF</span>
            )}
            <img
              src={
                mainImage
                  ? baseUrl + mainImage
                  : "/no-image.png"
              }
              alt={product.name}
            />
          </div>

        </div>

        {/* RIGHT - PRODUCT INFO */}
        <div className="pdp-right">

          {/* HEADER */}
          <div className="product-header">
            <h1>{product.name}</h1>
            <div className="rating-reviews">
              <span className="rating">⭐ {product.rating || 4.5}/5</span>
              <span className="reviews">(245 reviews)</span>
            </div>
          </div>

          {/* PRICE SECTION */}
          <div className="price-section">
            <div className="price-display">
              <span className="current-price">₹{totalPrice.toLocaleString()}</span>
              {discount > 0 && (
                <>
                  <span className="original-price">₹{(basePrice * qty).toLocaleString()}</span>
                  <span className="discount-percentage">{discount}% OFF</span>
                </>
              )}
            </div>
            {discount > 0 && (
              <p className="savings">You save ₹{savings.toLocaleString()}</p>
            )}
            <p className="unit-price">₹{unitPrice.toLocaleString()} per item</p>
          </div>

          {/* STOCK STATUS */}
          <div className={`stock-status ${selectedVariant?.stock > 0 ? "in-stock" : "out-stock"}`}>
            {selectedVariant?.stock > 0 ? (
              <>✓ In Stock: {selectedVariant?.stock} available</>
            ) : (
              <>✕ Out of Stock</>
            )}
          </div>

          {/* VARIANTS - COLOR */}
          <div className="variant-section">
            <h4>Choose Color</h4>
            <div className="color-list">
              {product.variants?.map((v) => (
                <div
                  key={v.id}
                  className={`color-circle ${
                    selectedVariant?.id === v.id ? "active" : ""
                  }`}
                  style={{ backgroundColor: v.color }}
                  onClick={() => {
                    setSelectedVariant(v);
                    setMainImage(v.images?.[0]?.imageUrl);
                    setSelectedSize(null);
                  }}
                  title={v.color}
                >
                  {selectedVariant?.id === v.id && <span className="tick">✓</span>}
                </div>
              ))}
            </div>
            <p className="selected-color">
              Selected: <strong>{selectedVariant?.color}</strong>
            </p>
          </div>

          {/* SIZE */}
          <div className="size-section">
            <h4>Choose Size</h4>
            <div className="size-list">
              {selectedVariant?.sizes?.map((s, i) => (
                <button
                  key={i}
                  className={`size-btn ${selectedSize === s ? "active" : ""}`}
                  onClick={() => setSelectedSize(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            {selectedSize && (
              <p className="selected-size">
                ✓ Selected Size: <strong>{selectedSize}</strong>
              </p>
            )}
          </div>

          {/* QUANTITY */}
          <div className="quantity-section">
            <h4>Quantity</h4>
            <div className="quantity-box">
              <button onClick={() => setQty(qty > 1 ? qty - 1 : 1)} className="qty-btn">−</button>
              <span className="qty-display">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="qty-btn">+</button>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="actions">
            <button 
              className={`cart-btn ${added ? "success" : ""}`} 
              onClick={addToCart}
              disabled={!selectedSize}
            >
              {added ? "✓ Added to Cart" : <>🛒 Add to Cart</>}
            </button>

            <button 
              className="buy-btn" 
              onClick={buyNow}
              disabled={!selectedSize}
            >
              ⚡ Buy Now
            </button>

            <button 
              className={`icon-btn wishlist-btn ${wishAdded ? "active" : ""}`} 
              onClick={toggleWishlist}
              title="Add to Wishlist"
            >
              <FaHeart color={wishlist.includes(product.id) ? "#ef4444" : "#9ca3af"} />
            </button>

            <button 
              className="icon-btn whatsapp-btn" 
              onClick={shareWhatsApp}
              title="Share on WhatsApp"
            >
              <FaWhatsapp />
            </button>
          </div>

          {/* DELIVERY INFO */}
          <div className="delivery-section">
            <div className="delivery-item">
              <span className="icon">🚚</span>
              <div>
                <p className="label">Free Delivery</p>
                <p className="info">On orders above ₹499</p>
              </div>
            </div>
            <div className="delivery-item">
              <span className="icon">⏱️</span>
              <div>
                <p className="label">Fast Delivery</p>
                <p className="info">3-5 business days</p>
              </div>
            </div>
            <div className="delivery-item">
              <span className="icon">🔄</span>
              <div>
                <p className="label">Easy Returns</p>
                <p className="info">30-day return policy</p>
              </div>
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="description-section">
            <h3>Product Details</h3>
            <p>{product.description}</p>
          </div>

        </div>

      </div>
    </div>
  );
}

export default ProductDetails;