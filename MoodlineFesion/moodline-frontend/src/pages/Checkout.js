import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../api/api";
import { CartContext } from "../context/CartContext";
import "../styles/checkout.css";

function Checkout() {
  const [cart, setCart] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [showModal, setShowModal] = useState(false);

  const navigate = useNavigate();
  const { loadCartCount } = useContext(CartContext);
  const userId = localStorage.getItem("userId");

  // ✅ FIXED FORM
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    label: "",
    isDefault: false
  });

  useEffect(() => {
    loadCart();
    loadAddresses();
  }, []);

  // ✅ AUTO SELECT DEFAULT
  useEffect(() => {
    if (addresses.length > 0) {
      const defaultAddr = addresses.find(a => a.isDefault);
      if (defaultAddr) {
        setSelectedAddress(defaultAddr.id);
      } else {
        // ✅ SELECT FIRST ADDRESS IF NO DEFAULT
        setSelectedAddress(addresses[0].id);
      }
    }
  }, [addresses]);

  const loadCart = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setCart([]);
      return;
    }

    const cartKey = `cart_${userId}`;
    const stored = JSON.parse(localStorage.getItem(cartKey) || "[]");

    const enriched = await Promise.all(
      stored.map(async (item) => {
        try {
          const { data: product } = await API.get(`product/${item.productId}`);
          return { ...item, product };
        } catch (err) {
          console.error("Error loading checkout product", item.productId, err);
          return item;
        }
      })
    );

    setCart(enriched);
  };

  const loadAddresses = async () => {
    const res = await API.get(`address/${userId}`);
    setAddresses(res.data);
  };

  // ✅ FIXED HANDLE CHANGE
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value
    });
  };

  // ✅ SAVE ADDRESS WITH DEFAULT SUPPORT
  const saveAddress = async (e) => {
    e.preventDefault();

    await API.post("address", {
      ...form,
      userId
    });

    setShowModal(false);

    // RESET FORM
    setForm({
      fullName: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pincode: "",
      label: "",
      isDefault: false
    });

    loadAddresses();
  };

  const getTotal = () => {
    return cart.reduce((total, item) => {
      const variantPrice = item.product?.variants?.find(v => v.id === item.variantId)?.price;
      const basePrice = variantPrice || item.product?.price || 0;
      const discount = item.product?.discountPercent || 0;
      const unitPrice = discount ? Math.round(basePrice - (basePrice * discount / 100)) : basePrice;
      return total + item.quantity * unitPrice;
    }, 0);
  };

  const placeOrder = async () => {
    if (!selectedAddress) {
      toast.warning("Please select a delivery address");
      return;
    }

    const address = addresses.find((a) => a.id === selectedAddress);
    if (!address) {
      toast.error("Selected address not found");
      return;
    }

    // ✅ CALCULATE ORIGINAL PRICE & DISCOUNT
    let originalPrice = 0;
    const cartWithPrices = cart.map((item) => {
      const variant = item.product?.variants?.find(v => v.id === item.variantId);
      const basePrice = variant?.price || item.product?.price || 0;
      const discount = item.product?.discountPercent || 0;
      const unitPrice = discount ? Math.round(basePrice - (basePrice * discount / 100)) : basePrice;
      originalPrice += basePrice * item.quantity;
      return {
        ...item,
        basePrice,
        finalPrice: unitPrice,
        discount
      };
    });

    const finalPrice = getTotal();
    const totalDiscountAmount = originalPrice - finalPrice;

    const res = await API.post("order", {
      userId,
      addressId: selectedAddress,
      paymentMethod,
      totalAmount: finalPrice
    });

    const orderId = res.data?.id || Date.now();
    const orderItem = {
      id: orderId,
      orderId,
      userId,
      userName: address.fullName || "Unknown",
      products: cartWithPrices.map((item) => {
        return {
          productId: item.product?.id,
          variantId: item.variantId,
          name: item.product?.name,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          unitPrice: item.finalPrice,
          price: item.finalPrice * item.quantity
        };
      }),
      totalAmount: finalPrice,
      date: new Date().toISOString(),
      status: "Placed"
    };

    const existingOrders = JSON.parse(localStorage.getItem("orders") || "[]");
    localStorage.setItem("orders", JSON.stringify([orderItem, ...existingOrders]));

    const notifications = JSON.parse(localStorage.getItem("adminNotifications") || "[]");
    const newNotification = {
      id: Date.now(),
      orderId,
      userId,
      userName: orderItem.userName,
      totalAmount: finalPrice,
      originalAmount: originalPrice,
      discountAmount: totalDiscountAmount,
      discountPercent: originalPrice > 0 ? Math.round((totalDiscountAmount / originalPrice) * 100) : 0,
      date: orderItem.date,
      read: false,
      // ✅ ADDRESS DETAILS
      address: {
        fullName: address.fullName,
        phone: address.phone,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        label: address.label
      },
      paymentMethod,
      itemCount: cart.length
    };
    localStorage.setItem("adminNotifications", JSON.stringify([newNotification, ...notifications]));

    toast.success("Order Placed 🎉");
    loadCartCount();
    navigate("/");
  };

  return (
    <div className="checkout-page-outer">
      <div className="breadcrumb">
        <span onClick={() => navigate("/")} style={{ cursor: "pointer", color: "#2563eb" }}>
          🏠 Home
        </span>
        <span>/</span>
        <span>Checkout</span>
      </div>
      <div className="checkout-page">

      {/* LEFT */}
      <div className="left">

        {/* ADDRESS */}
        <div className="section">
          <div className="section-header">
            <h3>Delivery Address</h3>
            <button onClick={() => setShowModal(true)}>+ Add New</button>
          </div>

          {addresses.length === 0 ? (
            <div className="empty">
              No address found
              <button onClick={() => setShowModal(true)}>Add Address</button>
            </div>
          ) : (
            addresses.map(a => (
              <div
                key={a.id}
                className={`address ${selectedAddress === a.id ? "active" : ""}`}
                onClick={() => setSelectedAddress(a.id)}
              >
                <input
                  type="radio"
                  checked={selectedAddress === a.id}
                  readOnly
                />

                <div>
                  <b>
                    {a.fullName}
                    {a.isDefault && (
                      <span style={{ color: "green", marginLeft: 6 }}>
                        (Default)
                      </span>
                    )}
                  </b>
                  <p>{a.addressLine1}, {a.city}</p>
                  <span>{a.phone}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ITEMS */}
        <div className="section">
          <h3>Order Items</h3>

          {cart.map(item => {
            const variant = item.product?.variants?.find(v => v.id === item.variantId) || {};
            const basePrice = variant?.price || item.product?.price || 0;
            const discount = item.product?.discountPercent || 0;
            const unitPrice = discount ? Math.round(basePrice - (basePrice * discount / 100)) : basePrice;
            const imageUrl = variant?.images?.[0]?.imageUrl || item.product?.imageUrl;

            return (
              <div className="item" key={item.id}>
                <img
                  src={
                    imageUrl
                      ? `https://moodlinebackend.onrender.com${imageUrl}`
                      : "/no-image.png"
                  }
                  alt={item.product?.name || "Checkout item"}
                />

                <div className="info">
                  <h4>{item.product?.name}</h4>
                  <p>
                    {item.color || variant.color ? `Color: ${item.color || variant.color}` : ""}
                    {item.size ? ` • Size: ${item.size}` : ""}
                  </p>
                  <p>Qty: {item.quantity}</p>
                  <p>Unit Price: ₹{unitPrice}</p>
                  {discount > 0 && <p className="discount">{discount}% OFF</p>}
                </div>

                <div className="price">
                  ₹{item.quantity * unitPrice}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* RIGHT */}
      <div className="right">
        <div className="summary">

          <h3>Order Summary</h3>

          <div className="row">
            <span>Subtotal</span>
            <span>₹{getTotal()}</span>
          </div>

          <div className="row">
            <span>Shipping</span>
            <span className="free">Free</span>
          </div>

          <div className="total">
            <span>Total</span>
            <span>₹{getTotal()}</span>
          </div>

          {/* PAYMENT */}
          <div className="payment">
            <h4>Payment Method</h4>

            <label className={paymentMethod === "COD" ? "active" : ""}>
              <input
                type="radio"
                value="COD"
                checked={paymentMethod === "COD"}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              Cash on Delivery
            </label>

            <label className={paymentMethod === "ONLINE" ? "active" : ""}>
              <input
                type="radio"
                value="ONLINE"
                checked={paymentMethod === "ONLINE"}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              Pay Online (UPI / Card)
            </label>
          </div>

          <button
            className="place-order"
            disabled={!selectedAddress}
            onClick={placeOrder}
          >
            {selectedAddress ? "Place Order" : "Select Address"}
          </button>

        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="overlay">
          <div className="modal modern">

            <div className="modal-header">
              <h3>+ Add New Address</h3>
              <span className="close" onClick={() => setShowModal(false)}>✕</span>
            </div>

            <form onSubmit={saveAddress}>

              <input
                name="label"
                placeholder="Label (Home, Office, etc.)"
                value={form.label}
                onChange={handleChange}
              />

              <div className="grid-2">
                <div>
                  <label>Full Name *</label>
                  <input name="fullName" value={form.fullName} onChange={handleChange} required />
                </div>

                <div>
                  <label>Phone *</label>
                  <input name="phone" value={form.phone} onChange={handleChange} required />
                </div>
              </div>

              <label>Address Line 1 *</label>
              <input name="addressLine1" value={form.addressLine1} onChange={handleChange} required />

              <label>Address Line 2</label>
              <input name="addressLine2" value={form.addressLine2} onChange={handleChange} />

              <div className="grid-2">
                <div>
                  <label>State *</label>
                  <input name="state" value={form.state} onChange={handleChange} required />
                </div>

                <div>
                  <label>City *</label>
                  <input name="city" value={form.city} onChange={handleChange} required />
                </div>
              </div>

              <label>Pincode *</label>
              <input name="pincode" value={form.pincode} onChange={handleChange} required />

              {/* ✅ FIXED CHECKBOX */}
              <label className="checkbox">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={form.isDefault}
                  onChange={handleChange}
                />
                <span>Set as default address</span>
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                <button type="submit" className="save">
                  Save Address
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

export default Checkout;