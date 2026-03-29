import { useEffect, useState, useContext } from "react";
import API from "../api/api";
import { Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { FiHeart } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import "../styles/products.css";
import { toast } from "react-toastify";

function Products() {

  const role = localStorage.getItem("role");
  const isAdmin = role === "Admin" || role === "Manager";
  const { loadCartCount } = useContext(CartContext);

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCategoryPopup, setShowCategoryPopup] = useState(false);
  const [categoryName, setCategoryName] = useState("");

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [search, setSearch] = useState("");

  const [showProductPopup, setShowProductPopup] = useState(false);
  const [selectedCategoryForProduct, setSelectedCategoryForProduct] = useState(null);

  const [product, setProduct] = useState({
  Name: "",
  Price: "",
  Description: "",
  DiscountPercent: 0,
  Rating: 0, // ✅ ADD
  Variants: [
    { Color: "", Sizes: "", Price: "", Stock: "", Images: [], Preview: [] } // ✅ Sizes
  ]
});

  const baseUrl = "https://moodlinebackend.onrender.com";

  useEffect(() => {
    loadCategories();
    loadProducts();
    loadWishlist();
  }, []);

  

  const loadCategories = async () => {
    const res = await API.get("category");
    setCategories(res.data);
  };

  const loadProducts = async () => {
    const res = await API.get("product");
    setProducts(res.data);
    setLoading(false);
  };

  const loadWishlist = async () => {
    const userId = localStorage.getItem("userId");
    const res = await API.get(`wishlist/${userId}`);
    setWishlist(res.data.map(x => x.productId));
  };

  const toggleWishlist = async (productId) => {
  const userId = localStorage.getItem("userId");

  try {
    const res = await API.post("wishlist", {
      userId: Number(userId),
      productId: Number(productId)
    });

    // 🔥 backend response check
    if (res.data.message === "Added") {
      setWishlist(prev => [...prev, productId]);
    } else if (res.data.message === "Removed") {
      setWishlist(prev => prev.filter(id => id !== productId));
    }

  } catch (err) {
    console.error("Wishlist error", err.response || err);
     toast.warning("Error in wishlist ❌");
  }
};

 const addToCart = async (product) => {
  console.log(product); 
  const userId = localStorage.getItem("userId");

  // ❌ No variant
  if (!product.variants || product.variants.length === 0) {
     toast.warning("No variant available ❌");
    return;
  }

  const variant = product.variants[0];

  // ✅ Size logic
  let firstSize = "Free Size";

  if (variant.sizes && variant.sizes.length > 0) {
    firstSize = variant.sizes[0];
  }

  try {
    await API.post("cart", {
      userId: Number(userId),
      productId: product.id,
      variantId: variant.id,
      size: firstSize,
      color: variant.color,
      quantity: 1
    });

    loadCartCount();
   toast.success("Added to cart 🛒");

  } catch (err) {
    console.error(err);
     toast.warning("Failed to add ❌");
  }
};

  const openProductPopup = (category) => {
    setSelectedCategoryForProduct(category);

    setProduct({
      Name: "",
      Price: "",
      Description: "",
      DiscountPercent: 0,
      Variants: [
        { Color: "", Price: "", Stock: "", Images: [], Preview: [] }
      ]
    });

    setShowProductPopup(true);
  };

  const addCategory = async (e) => {
  e.preventDefault();

  try {
    await API.post("category", {
      name: categoryName
    });

    toast.success("Category Added ✅");
    setShowCategoryPopup(false);
    setCategoryName("");
    loadCategories();

  } catch {
     toast.warning("Failed ❌");
  }
};

  const handleChange = (e) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  const handleVariantChange = (index, field, value) => {
    const updated = [...product.Variants];
    updated[index][field] = value;
    setProduct({ ...product, Variants: updated });
  };

  const handleImageChange = (e, vIndex) => {
    const files = Array.from(e.target.files);

    const updated = [...product.Variants];
    updated[vIndex].Images = files;
    updated[vIndex].Preview = files.map(file => URL.createObjectURL(file));

    setProduct({ ...product, Variants: updated });
  };

  const addVariant = () => {
  setProduct(prev => ({
    ...prev,
    Variants: [
      ...prev.Variants,
      { Color: "", Sizes: "", Price: "", Stock: "", Images: [], Preview: [] }
    ]
  }));
};

  const addProduct = async (e) => {
    e.preventDefault();

    const formData = new FormData();

    formData.append("Name", product.Name);
    formData.append("Description", product.Description);
    formData.append("Price", product.Price);
    formData.append("Rating", product.Rating);
    formData.append("DiscountPercent", product.DiscountPercent);
    formData.append("CategoryId", selectedCategoryForProduct?.id);

    product.Variants.forEach((v, i) => {
      formData.append(`Variants[${i}].Color`, v.Color);
      formData.append(`Variants[${i}].Sizes`, v.Sizes); 
      formData.append(`Variants[${i}].Price`, v.Price);
      formData.append(`Variants[${i}].Stock`, v.Stock);

      if (v.Images?.length) {
        v.Images.forEach(file => {
          formData.append(`Variants[${i}].Images`, file);
        });
      }
    });

    try {
      await API.post("product", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      toast.success("Product Added ✅");
      setShowProductPopup(false);
      loadProducts();

    } catch {
       toast.warning("Upload Failed ❌");
    }
  };

  // ✅ FIXED FILTER
  const filteredProducts = products
    .filter(p =>
      !selectedCategory ||
      p.category === categories.find(c => c.id === selectedCategory)?.name
    )
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <h2>Loading...</h2>;

  return (
    <div className="shop-layout">

      <div className="top-search">
        <input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="sidebar">
        <h3>Categories</h3>
        {isAdmin && (
            <button onClick={() => setShowCategoryPopup(true)}>+ Add</button>
          )}
        <ul>
          <li onClick={() => setSelectedCategory(null)}>All</li>

          {categories.map(c => (
            <li key={c.id} onClick={() => setSelectedCategory(c.id)}>
              {c.name}
              {isAdmin && (
                <button onClick={(e) => {
                  e.stopPropagation();
                  openProductPopup(c);
                }}>+</button>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="products-container">
        <div className="products-grid">

          {filteredProducts.map(p => {

            const img = p.variants?.[0]?.images?.[0]?.imageUrl
              ? baseUrl + p.variants[0].images[0].imageUrl
              : "/no-image.png";

            return (
              <div className="product-card" key={p.id}>

  {/* 🔥 DISCOUNT BADGE */}
  {p.discountPercent > 0 && (
    <div className="badge">
      {p.discountPercent}% OFF
    </div>
  )}

  {/* ❤️ WISHLIST */}
  <div
    className="wishlist-icon"
    onClick={(e) => {
      e.stopPropagation();
      toggleWishlist(p.id);
    }}
  >
    {wishlist.includes(p.id)
      ? <FaHeart color="red" />
      : <FiHeart />}
  </div>

  {/* IMAGE */}
  <Link to={`/product/${p.id}`}>
    <img src={img} alt={p.name} />
  </Link>

  {/* 🔥 CATEGORY (optional safe) */}
  <div className="category">
    {p.category || "Fashion"}
  </div>

  {/* TITLE */}
  <h4>{p.name}</h4>

  {/* 🔥 PRICE BOX */}
  <div className="price-box">
    <span className="price">
      ₹{p.finalPrice || p.price}
    </span>

    {p.discountPercent > 0 && (
      <>
        <span className="old-price">
          ₹{p.price}
        </span>
        <span className="discount">
          {p.discountPercent}% OFF
        </span>
      </>
    )}
  </div>

  {/* 🚚 DELIVERY */}
  <div className="product-delivery">
    🚚 Delivery in 3-5 days
  </div>

  {/* BUTTON */}
  <button onClick={() => addToCart(p)}>
    Add to Cart
  </button>

</div>
            );
          })}

        </div>
      </div>
      {isAdmin && showCategoryPopup && (
        <div className="popup-overlay">
          <div className="popup">

            <h3>Add Category</h3>

            <form onSubmit={addCategory}>
              <input
                placeholder="Category Name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                required
              />

              <button type="submit">Add Category</button>

              <button
                type="button"
                onClick={() => setShowCategoryPopup(false)}
                style={{ marginTop: "10px", background: "#ccc", color: "#000" }}
              >
                Cancel
              </button>
            </form>

          </div>
        </div>
      )}

      {/* POPUP */}
      {isAdmin && showProductPopup && (
        <div className="popup-overlay">
          <div className="popup">

            <h3>Add Product</h3>

            <form onSubmit={addProduct}>

              <input name="Name" placeholder="Name" onChange={handleChange} />
              <input name="Price" type="number" placeholder="Price" onChange={handleChange} />

              {/* ✅ DISCOUNT */}
              <div className="discount-input">
  <input
    type="number"
    placeholder="discount"
    min="0"
    max="90"
    value={product.DiscountPercent}
    onChange={(e) => {
  let val = e.target.value;

  if (val === "") {
    setProduct({ ...product, DiscountPercent: "" });
    return;
  }
  val = val.replace(/^0+/, "");
  let num = Number(val);
  if (num > 90) num = 90;

  setProduct({ ...product, DiscountPercent: num });
}}
  />
</div>

              <p>
                Final Price: ₹
                {product.Price
                  ? product.Price - (product.Price * product.DiscountPercent) / 100
                  : 0}
              </p>

              <input
  type="number"
  placeholder="Rating (0-5)"
  min="0"
  max="5"
  step="0.1"
  value={product.Rating}
  onChange={(e) =>
    setProduct({ ...product, Rating: e.target.value })
  }
/>

              <input name="Description" placeholder="Description" onChange={handleChange} />

              {product.Variants.map((variant, vIndex) => (
                <div key={vIndex} style={{ marginBottom: "15px" }}>

                  <input placeholder="Color"
                    onChange={(e) => handleVariantChange(vIndex, "Color", e.target.value)} />

                    <input
  placeholder="Sizes (S,M,L,XL)"
  onChange={(e) =>
    handleVariantChange(vIndex, "Sizes", e.target.value)
  }
/>

                  <input type="number" placeholder="Price"
                    onChange={(e) => handleVariantChange(vIndex, "Price", e.target.value)} />

                  <input type="number" placeholder="Stock"
                    onChange={(e) => handleVariantChange(vIndex, "Stock", e.target.value)} />

                  <input type="file" multiple onChange={(e) => handleImageChange(e, vIndex)} />

                  <div style={{ display: "flex", gap: "10px" }}>
                    {variant.Preview?.map((img, idx) => (
                      <img key={idx} src={img} width="60" height="60" />
                    ))}
                  </div>

                </div>
              ))}

              <button type="button" onClick={addVariant}>+ Variant</button>
              <button type="submit">Add Product</button>

              <button
    type="button"
    className="cancel-btn"
    onClick={() => setShowProductPopup(false)}
  >
    Cancel
  </button>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}

export default Products;