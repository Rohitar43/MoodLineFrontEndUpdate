import { useEffect, useState, useContext } from "react";
import API from "../api/api";
import { Link, useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { FiHeart } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import "../styles/products.css";
import { toast } from "react-toastify";

function Products() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const isAdmin = role === "Admin" || role === "Manager";
  const { loadCartCount } = useContext(CartContext);

  // ===== STATE =====
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  // Admin Popups
  const [showCategoryPopup, setShowCategoryPopup] = useState(false);
  const [showProductPopup, setShowProductPopup] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [selectedCategoryForProduct, setSelectedCategoryForProduct] = useState(null);

  // Filter State
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedRatings, setSelectedRatings] = useState([]);
  const [discountRange, setDiscountRange] = useState([0, 100]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);
  
  // Read search from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const search = params.get('search');
    if (search) {
      setSearchQuery(search);
    }
  }, []);

  // Product form
  const [product, setProduct] = useState({
    Name: "",
    Price: "",
    Description: "",
    DiscountPercent: 0,
    Rating: 0,
    Variants: [
      { Color: "", Sizes: "", Price: "", Stock: "", Images: [], Preview: [] },
    ],
  });

  const baseUrl = "https://moodlinebackend.onrender.com";

  // ===== LOAD DATA =====
  useEffect(() => {
    loadCategories();
    loadProducts();
    loadWishlist();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await API.get("category");
      setCategories(res.data);
    } catch (err) {
      console.error("Error loading categories:", err);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await API.get("product");
      setProducts(res.data);
    } catch (err) {
      console.error("Error loading products:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadWishlist = async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (userId) {
        const wishlistKey = `wishlist_${userId}`;
        const stored = JSON.parse(localStorage.getItem(wishlistKey) || "[]");
        setWishlist(stored.map((x) => x.productId));
      }
    } catch (err) {
      console.error("Error loading wishlist:", err);
    }
  };

  // ===== WISHLIST & CART =====
  const toggleWishlist = async (productId) => {
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
    const isInWishlist = stored.some((item) => item.productId === productId);

    try {
      if (isInWishlist) {
        const updated = stored.filter((item) => item.productId !== productId);
        localStorage.setItem(wishlistKey, JSON.stringify(updated));
        setWishlist((prev) => prev.filter((id) => id !== productId));
        toast.success("Removed from wishlist 💔");
      } else {
        const newItem = {
          productId,
          addedAt: new Date().toISOString()
        };
        const updated = [...stored, newItem];
        localStorage.setItem(wishlistKey, JSON.stringify(updated));
        setWishlist((prev) => [...prev, productId]);
        toast.success("Added to wishlist ❤️");
      }

      window.dispatchEvent(new Event("wishlistUpdated"));
    } catch (err) {
      console.error("Wishlist error", err);
      toast.warning("Failed to update wishlist ❌");
    }
  };

  const addToCart = async (product) => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      localStorage.setItem("redirectAfterLogin", window.location.pathname + window.location.search);
      toast.warning("Please log in to continue 🔐");
      navigate("/login");
      return;
    }

    if (!product.variants || product.variants.length === 0) {
      toast.warning("No variant available ❌");
      return;
    }

    const variant = product.variants[0];
    console.log("Products.addToCart invoked", { productId: product.id, userId });

    try {
      const res = await API.post("cart", {
        userId: Number(userId),
        productId: Number(product.id),
        quantity: 1,
        variantId: variant.id,
        size: variant.sizes?.[0] || "Free Size",
        color: variant.color,
      });

      console.log("Products.addToCart API response", res.data);

      const cartKey = `cart_${userId}`;
      const stored = JSON.parse(localStorage.getItem(cartKey) || "[]");
      const existingItem = stored.find(
        (item) => item.productId === product.id && item.variantId === variant.id
      );

      if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
      } else {
        stored.push({
          id: Date.now(),
          productId: product.id,
          variantId: variant.id,
          quantity: 1,
          color: variant.color,
          size: variant.sizes?.[0] || "Free Size",
        });
      }

      localStorage.setItem(cartKey, JSON.stringify(stored));
      toast.success("Added to cart ✅");
      loadCartCount();
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err) {
      console.error("Cart error", err);
      toast.warning("Failed to add to cart ❌");
    }
  };

  // ===== FILTER LOGIC =====
  const getUniqueValues = (array, key) => {
    return [...new Set(array.map((item) => item[key]).filter(Boolean))];
  };

  const filteredProducts = products
    // Filter by category - check both 'category' and 'categoryName' fields
    .filter((p) => {
      if (selectedCategories.length === 0) return true;
      const productCategory = p.category || p.categoryName || '';
      return selectedCategories.includes(productCategory);
    })
    // Filter by price
    .filter((p) => {
      const finalPrice = p.finalPrice || p.price || 0;
      return finalPrice >= priceRange[0] && finalPrice <= priceRange[1];
    })
    // Filter by brand
    .filter((p) => {
      if (selectedBrands.length === 0) return true;
      const productBrand = p.brand || '';
      return selectedBrands.includes(productBrand);
    })
    // Filter by rating - check >= not exact match
    .filter((p) => {
      if (selectedRatings.length === 0) return true;
      const productRating = p.rating || 0;
      return selectedRatings.some(r => productRating >= r);
    })
    // Filter by discount
    .filter((p) => {
      const discount = p.discountPercent || 0;
      return discount >= discountRange[0] && discount <= discountRange[1];
    })
    // Filter by stock
    .filter((p) => {
      if (!inStockOnly) return true;
      const stock = p.variants?.[0]?.stock || p.stock || 0;
      return stock > 0;
    })
    // Filter by search query
    .filter((p) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      const name = (p.name || '').toLowerCase();
      const description = (p.description || '').toLowerCase();
      return name.includes(query) || description.includes(query);
    });

  const uniqueBrands = getUniqueValues(products, "brand");
  const uniqueRatings = [5, 4, 3, 2, 1];
  const maxPrice = Math.max(...products.map((p) => p.price || 0), 100000);

  // ===== ADMIN FUNCTIONS =====
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct({ ...product, [name]: value });
  };

  const handleVariantChange = (vIndex, key, value) => {
    const newVariants = [...product.Variants];
    newVariants[vIndex][key] = value;
    setProduct({ ...product, Variants: newVariants });
  };

  const openProductPopup = (category) => {
    setSelectedCategoryForProduct(category);
    setProduct({
      Name: "",
      Price: "",
      Description: "",
      DiscountPercent: 0,
      Rating: 0,
      Variants: [
        { Color: "", Sizes: "", Price: "", Stock: "", Images: [], Preview: [] },
      ],
    });
    setShowProductPopup(true);
  };

  const addCategory = async (e) => {
    e.preventDefault();
    try {
      await API.post("category", { name: categoryName });
      toast.success("Category added ✅");
      setShowCategoryPopup(false);
      setCategoryName("");
      loadCategories();
    } catch {
      toast.warning("Failed to add category ❌");
    }
  };

  const addProduct = async (e) => {
    e.preventDefault();
    
    if (!selectedCategoryForProduct) {
      toast.warning("Please select a category ⚠️");
      return;
    }
    
    const formData = new FormData();
    formData.append("Name", product.Name);
    formData.append("Price", product.Price);
    formData.append("Description", product.Description);
    formData.append("Rating", product.Rating);
    formData.append("DiscountPercent", product.DiscountPercent);
    formData.append("CategoryId", selectedCategoryForProduct.id || selectedCategoryForProduct);

    product.Variants.forEach((v, i) => {
      formData.append(`Variants[${i}].Color`, v.Color);
      formData.append(`Variants[${i}].Sizes`, v.Sizes);
      formData.append(`Variants[${i}].Price`, v.Price);
      formData.append(`Variants[${i}].Stock`, v.Stock);

      if (v.Images?.length) {
        v.Images.forEach((file) => {
          formData.append(`Variants[${i}].Images`, file);
        });
      }
    });

    try {
      await API.post("product", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Product added ✅");
      setShowProductPopup(false);
      loadProducts();
    } catch {
      toast.warning("Failed to add product ❌");
    }
  };

  // ===== TOGGLE FILTER SECTIONS =====
  const toggleFilterSection = (sectionName) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  };

  // ===== RESET ALL FILTERS =====
  const resetFilters = () => {
    setSelectedCategories([]);
    setPriceRange([0, maxPrice]);
    setSelectedBrands([]);
    setSelectedRatings([]);
    setDiscountRange([0, 100]);
    setInStockOnly(false);
    setSearchQuery("");
  };

  if (loading) {
    return (
      <div className="products-wrapper">
        <div className="shop-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="products-wrapper">
      <div className="shop-container">
        {/* BREADCRUMB */}
        <div className="breadcrumb">
          <span onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
            Home
          </span>
          <span>/</span>
          <span>Products</span>
        </div>

        {/* HEADER */}
        <div className="products-header">
          <h1>
            Shop Products{" "}
            <span style={{ color: "#999", fontSize: "0.85em" }}>
              ({filteredProducts.length})
            </span>
          </h1>
          <button className="filter-toggle" onClick={() => setIsFilterOpen(true)}>
            Filter
          </button>
          <div className="sort-controls">
            <select className="sort-dropdown" defaultValue="relevance">
              <option value="relevance">Sort by: Relevance</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="newest">Newest First</option>
              <option value="rating">Top Rated</option>
            </select>

            {isAdmin && (
              <button
                onClick={() => {
                  setCategoryName("");
                  setShowCategoryPopup(true);
                }}
                style={{
                  padding: "0.5rem 1rem",
                  background: "#2563eb",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                + Category
              </button>
            )}
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="products-main">
          {/* SIDEBAR FILTERS */}
          <aside className={`filters-sidebar ${isFilterOpen ? "open" : ""}`}>
            {/* SEARCH IN SIDEBAR */}
            <div className="filter-section">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  marginBottom: "0.75rem",
                }}
              />
            </div>

            {/* CATEGORIES FILTER */}
            <div className="filter-section">
              <div
                className="filter-section-title"
                onClick={() => toggleFilterSection("categories")}
              >
                Categories
                <span
                  className={`collapse-icon ${
                    !collapsedSections.categories ? "open" : ""
                  }`}
                >
                  ▼
                </span>
              </div>
              <div
                className={
                  collapsedSections.categories
                    ? "filter-collapsed"
                    : "filter-content"
                }
              >
                {categories.map((cat) => (
                  <div key={cat.id} className="filter-option">
                    <input
                      type="checkbox"
                      id={`cat-${cat.id}`}
                      checked={selectedCategories.includes(cat.name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCategories([...selectedCategories, cat.name]);
                        } else {
                          setSelectedCategories(
                            selectedCategories.filter((c) => c !== cat.name)
                          );
                        }
                      }}
                    />
                    <label htmlFor={`cat-${cat.id}`}>{cat.name}</label>
                    <span className="filter-count">
                      ({products.filter((p) => (p.category || p.categoryName) === cat.name).length})
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* PRICE RANGE FILTER */}
            <div className="filter-section">
              <div
                className="filter-section-title"
                onClick={() => toggleFilterSection("price")}
              >
                Price Range
                <span
                  className={`collapse-icon ${
                    !collapsedSections.price ? "open" : ""
                  }`}
                >
                  ▼
                </span>
              </div>
              <div
                className={
                  collapsedSections.price ? "filter-collapsed" : "filter-content"
                }
              >
                <div className="price-inputs">
                  <input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) =>
                      setPriceRange([Number(e.target.value), priceRange[1]])
                    }
                    min="0"
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) =>
                      setPriceRange([priceRange[0], Number(e.target.value)])
                    }
                    max={maxPrice}
                    placeholder="Max"
                  />
                </div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "#666",
                    textAlign: "center",
                    marginBottom: "0.75rem",
                  }}
                >
                  ₹{priceRange[0].toLocaleString()} - ₹
                  {priceRange[1].toLocaleString()}
                </div>
              </div>
            </div>

            {/* RATING FILTER */}
            <div className="filter-section">
              <div
                className="filter-section-title"
                onClick={() => toggleFilterSection("rating")}
              >
                Rating
                <span
                  className={`collapse-icon ${
                    !collapsedSections.rating ? "open" : ""
                  }`}
                >
                  ▼
                </span>
              </div>
              <div
                className={
                  collapsedSections.rating
                    ? "filter-collapsed"
                    : "filter-content"
                }
              >
                {uniqueRatings.map((rating) => (
                  <div key={rating} className="rating-option">
                    <input
                      type="checkbox"
                      id={`rating-${rating}`}
                      checked={selectedRatings.includes(rating)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRatings([...selectedRatings, rating]);
                        } else {
                          setSelectedRatings(
                            selectedRatings.filter((r) => r !== rating)
                          );
                        }
                      }}
                    />
                    <div className="stars">
                      {[...Array(rating)].map((_, i) => (
                        <span key={i} className="star">
                          ★
                        </span>
                      ))}
                      {[...Array(5 - rating)].map((_, i) => (
                        <span key={i} style={{ color: "#ddd" }}>
                          ★
                        </span>
                      ))}
                      <span className="rating-text">& above</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DISCOUNT FILTER */}
            <div className="filter-section">
              <div
                className="filter-section-title"
                onClick={() => toggleFilterSection("discount")}
              >
                Discount
                <span
                  className={`collapse-icon ${
                    !collapsedSections.discount ? "open" : ""
                  }`}
                >
                  ▼
                </span>
              </div>
              <div
                className={
                  collapsedSections.discount
                    ? "filter-collapsed"
                    : "filter-content"
                }
              >
                <div className="price-inputs">
                  <input
                    type="number"
                    value={discountRange[0]}
                    onChange={(e) =>
                      setDiscountRange([Number(e.target.value), discountRange[1]])
                    }
                    min="0"
                    max="100"
                    placeholder="Min %"
                  />
                  <input
                    type="number"
                    value={discountRange[1]}
                    onChange={(e) =>
                      setDiscountRange([discountRange[0], Number(e.target.value)])
                    }
                    min="0"
                    max="100"
                    placeholder="Max %"
                  />
                </div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "#666",
                    textAlign: "center",
                  }}
                >
                  {discountRange[0]}% - {discountRange[1]}%
                </div>
              </div>
            </div>

            {/* AVAILABILITY FILTER */}
            <div className="filter-section">
              <div className="filter-option">
                <input
                  type="checkbox"
                  id="in-stock"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                />
                <label htmlFor="in-stock">In Stock Only</label>
              </div>
            </div>

            {/* RESET BUTTON */}
            <button className="reset-filters" onClick={resetFilters}>
              Clear All Filters
            </button>

            {/* ADMIN ADD PRODUCT BUTTON */}
            {isAdmin && (
              <button
                onClick={() => {
                  if (categories.length === 0) {
                    toast.warning("Please add a category first ⚠️");
                    return;
                  }
                  openProductPopup(null);
                }}
                style={{
                  width: "100%",
                  marginTop: "1rem",
                  padding: "0.875rem 1rem",
                  background: "#27ae60",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  font: "inherit",
                  cursor: "pointer",
                }}
              >
                + Add Product
              </button>
            )}
          </aside>

          {isFilterOpen && (
            <div className="filter-backdrop" onClick={() => setIsFilterOpen(false)}></div>
          )}

          {/* PRODUCTS GRID */}
          <main>
            <div className="products-grid">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => {
                  const img = p.variants?.[0]?.images?.[0]?.imageUrl
                    ? baseUrl + p.variants[0].images[0].imageUrl
                    : "/no-image.png";
                  const finalPrice = p.finalPrice || p.price;

                  return (
                    <div className="product-card" key={p.id}>
                      {/* DISCOUNT BADGE */}
                      {p.discountPercent > 0 && (
                        <div className="discount-badge">
                          {p.discountPercent}% OFF
                        </div>
                      )}

                      {/* WISHLIST BUTTON */}
                      <button
                        className={`wishlist-btn ${
                          wishlist.includes(p.id) ? "active" : ""
                        }`}
                        onClick={() => toggleWishlist(p.id)}
                        title="Add to wishlist"
                      >
                        {wishlist.includes(p.id) ? (
                          <FaHeart />
                        ) : (
                          <FiHeart />
                        )}
                      </button>

                      {/* IMAGE */}
                      <div className="product-image-wrapper">
                        <Link to={`/product/${p.id}`}>
                          <img src={img} alt={p.name} />
                        </Link>
                      </div>

                      {/* PRODUCT DETAILS */}
                      <div className="product-details">
                        <div className="product-category">{p.category || "Fashion"}</div>

                        <h4 className="product-name">{p.name}</h4>

                        {/* RATING */}
                        {p.rating && (
                          <div className="product-rating">
                            <div className="rating-stars">
                              {[...Array(Math.floor(p.rating))].map((_, i) => (
                                <span key={i} className="star">
                                  ★
                                </span>
                              ))}
                              {[...Array(5 - Math.floor(p.rating))].map((_, i) => (
                                <span key={i} style={{ color: "#ddd" }}>
                                  ★
                                </span>
                              ))}
                            </div>
                            {p.rating && (
                              <span className="rating-value">
                                {p.rating.toFixed(1)}
                              </span>
                            )}
                          </div>
                        )}

                        {/* PRICING */}
                        <div className="pricing-section">
                          <div className="current-price">
                            <span className="price-current">
                              ₹{finalPrice.toLocaleString()}
                            </span>
                            {p.discountPercent > 0 && (
                              <>
                                <span className="price-original">
                                  ₹{p.price.toLocaleString()}
                                </span>
                                <span className="price-discount">
                                  {p.discountPercent}% off
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* DELIVERY */}
                        <div className="delivery-info">
                          <span className="delivery-icon">🚚</span>
                          <span>Delivery in 3-5 days</span>
                        </div>

                        {/* TAGS */}
                        {p.new && (
                          <div className="product-tags">
                            <span className="tag">New</span>
                          </div>
                        )}

                        {/* ADD TO CART BUTTON */}
                        <button
                          className="add-to-cart-btn"
                          onClick={() => addToCart(p)}
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">📭</div>
                  <h3>No Products Found</h3>
                  <p>Try adjusting your filters or search query</p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* CATEGORY POPUP */}
      {isAdmin && showCategoryPopup && (
        <div className="popup-overlay" onClick={() => setShowCategoryPopup(false)}>
          <div className="popup" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
              }}
            >
              <h3 style={{ margin: 0 }}>Add Category</h3>
              <button
                onClick={() => setShowCategoryPopup(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: "#999",
                }}
              >
                <IoClose />
              </button>
            </div>

            <form onSubmit={addCategory}>
              <input
                placeholder="Category Name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                required
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                  marginTop: "1rem",
                }}
              >
                <button type="submit" style={{ background: "#2563eb" }}>
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowCategoryPopup(false)}
                  style={{ background: "#f5f5f5", color: "#212121" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRODUCT POPUP */}
      {isAdmin && showProductPopup && (
        <div className="popup-overlay" onClick={() => setShowProductPopup(false)}>
          <div
            className="popup"
            onClick={(e) => e.stopPropagation()}
            style={{ maxwidth: "600px", maxHeight: "80vh", overflowY: "auto" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
              }}
            >
              <h3 style={{ margin: 0 }}>Add Product</h3>
              <button
                onClick={() => setShowProductPopup(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: "#999",
                }}
              >
                <IoClose />
              </button>
            </div>

            <form onSubmit={addProduct}>
              {/* CATEGORY SELECTOR */}
              <select
                value={selectedCategoryForProduct?.id || ""}
                onChange={(e) => {
                  const selected = categories.find(c => c.id === Number(e.target.value));
                  setSelectedCategoryForProduct(selected);
                }}
                required
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  fontSize: "0.95rem",
                  fontFamily: "inherit",
                }}
              >
                <option value="">-- Select Category --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <input
                name="Name"
                placeholder="Product Name"
                onChange={handleChange}
                required
              />

              <input
                name="Price"
                type="number"
                placeholder="Price"
                onChange={handleChange}
                required
              />

              <div>
                <input
                  type="number"
                  placeholder="Discount %"
                  min="0"
                  max="90"
                  value={product.DiscountPercent}
                  onChange={(e) =>
                    setProduct({
                      ...product,
                      DiscountPercent: Math.min(90, Number(e.target.value)),
                    })
                  }
                />
                <p style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "#666" }}>
                  Final Price: ₹
                  {product.Price
                    ? (product.Price - (product.Price * product.DiscountPercent) / 100).toFixed(0)
                    : 0}
                </p>
              </div>

              <input
                type="number"
                placeholder="Rating (0-5)"
                min="0"
                max="5"
                step="0.1"
                value={product.Rating}
                onChange={(e) => setProduct({ ...product, Rating: e.target.value })}
              />

              <textarea
                name="Description"
                placeholder="Description"
                onChange={handleChange}
                rows="3"
              ></textarea>

              {product.Variants.map((variant, vIndex) => (
                <div key={vIndex} style={{ marginBottom: "1rem", paddingTop: "1rem", borderTop: "1px solid #f0f0f0" }}>
                  <h4 style={{ fontSize: "0.95rem", marginBottom: "0.75rem" }}>
                    Variant {vIndex + 1}
                  </h4>

                  <input
                    placeholder="Color"
                    value={variant.Color}
                    onChange={(e) =>
                      handleVariantChange(vIndex, "Color", e.target.value)
                    }
                  />

                  <input
                    placeholder="Sizes (S,M,L,XL)"
                    value={variant.Sizes}
                    onChange={(e) =>
                      handleVariantChange(vIndex, "Sizes", e.target.value)
                    }
                  />

                  <input
                    type="number"
                    placeholder="Variant Price"
                    value={variant.Price}
                    onChange={(e) =>
                      handleVariantChange(vIndex, "Price", e.target.value)
                    }
                  />

                  <input
                    type="number"
                    placeholder="Stock"
                    value={variant.Stock}
                    onChange={(e) =>
                      handleVariantChange(vIndex, "Stock", e.target.value)
                    }
                  />

                  <input
                    type="file"
                    multiple
                    onChange={(e) =>
                      handleVariantChange(vIndex, "Images", Array.from(e.target.files))
                    }
                  />
                </div>
              ))}

              <button type="submit" style={{ marginTop: "1rem", background: "#27ae60" }}>
                Add Product
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Products;
