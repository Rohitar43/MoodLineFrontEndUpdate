import { useEffect, useState } from "react";
import API from "../api/api";
import { useNavigate } from "react-router-dom";
import "../styles/orders.css";

function Orders() {

  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const userId = Number(localStorage.getItem("userId") || 0);
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
  }, [userId]);

  const loadOrders = async () => {
    const storedOrders = JSON.parse(localStorage.getItem("orders") || "[]");
    if (userId) {
      const filtered = storedOrders.filter((o) => Number(o.userId) === userId);
      setOrders(filtered);
      if (filtered.length > 0) {
        setSelectedOrder(filtered[0]);
      }
    } else {
      setOrders(storedOrders);
    }

    if (!storedOrders.length && userId) {
      try {
        const res = await API.get(`order/${userId}`);
        setOrders(res.data);
        if (res.data.length > 0) {
          setSelectedOrder(res.data[0]);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (orders.length === 0) {
    return (
      <div className="orders-page-empty">
        <div className="breadcrumb">
          <span onClick={() => navigate("/")} style={{ cursor: "pointer", color: "#2563eb" }}>
            🏠 Home
          </span>
          <span>/</span>
          <span>My Orders</span>
        </div>

        <div className="empty-orders">
          <div className="empty-orders-content">
            <h2>📦 No Orders Yet</h2>
            <p>You haven't placed any orders yet. Start shopping now!</p>
            <button 
              className="shop-btn"
              onClick={() => navigate("/products")}
            >
              🛍️ Shop Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page-container">
      {/* BREADCRUMB */}
      <div className="breadcrumb">
        <span onClick={() => navigate("/")} style={{ cursor: "pointer", color: "#2563eb" }}>
          🏠 Home
        </span>
        <span>/</span>
        <span>My Orders</span>
      </div>

      <div className="orders-page">
        {/* LEFT - ORDER LIST */}
        <div className="orders-left">
          <h3 className="orders-title">📋 My Orders ({orders.length})</h3>
          <div className="orders-list">
            {orders.map((order) => (
              <div
                key={order.id}
                className={`order-card ${selectedOrder?.id === order.id ? "active" : ""}`}
                onClick={() => setSelectedOrder(order)}
              >
                <div className="order-header">
                  <div className="order-number">
                    <strong>Order #{order.orderId || order.id}</strong>
                  </div>
                  <div className="order-amount">
                    <strong>₹{order.totalAmount?.toLocaleString()}</strong>
                  </div>
                </div>

                <div className="order-details">
                  <p className="order-date">
                    📅 {new Date(order.date).toLocaleDateString()}
                  </p>
                  <p className="order-status">
                    <span className={`status-badge ${order.status?.toLowerCase() || "placed"}`}>
                      {order.status || "Placed"}
                    </span>
                  </p>
                </div>

                <div className="order-items-preview">
                  {order.products?.slice(0, 2).map((p, idx) => (
                    <p key={idx} className="item-preview">
                      {p.quantity}x {p.name?.substring(0, 20)}...
                    </p>
                  ))}
                  {order.products?.length > 2 && (
                    <p className="more-items">+{order.products.length - 2} more items</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT - ORDER SUMMARY */}
        {selectedOrder && (
          <div className="orders-right">
            <h3>📦 Order Details</h3>

            <div className="detail-section">
              <h4>Products</h4>
              <div className="products-list">
                {selectedOrder.products?.map((product, idx) => (
                  <div key={idx} className="product-item">
                    <div className="product-info">
                      <p className="product-name">{product.name}</p>
                      <p className="product-variant">
                        {product.quantity}x @ ₹{product.unitPrice || product.price}
                      </p>
                      {product.color && (
                        <p className="product-color">Color: {product.color}</p>
                      )}
                      {product.size && (
                        <p className="product-size">Size: {product.size}</p>
                      )}
                    </div>
                    <div className="product-total">
                      ₹{(product.quantity * (product.unitPrice || product.price)).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <hr />

            <div className="detail-section">
              <h4>Pricing</h4>
              <div className="price-row">
                <span>Subtotal</span>
                <span>₹{selectedOrder.totalAmount?.toLocaleString()}</span>
              </div>
              <div className="price-row">
                <span>Shipping</span>
                <span className="free">Free</span>
              </div>
              <div className="price-row">
                <span>Tax</span>
                <span>₹0</span>
              </div>
            </div>

            <hr />

            <div className="total-row">
              <span>Total Amount</span>
              <span className="total-amount">₹{selectedOrder.totalAmount?.toLocaleString()}</span>
            </div>

            <div className="delivery-info">
              🚚 Expected Delivery: {new Date(new Date(selectedOrder.date).getTime() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </div>

            <div className="status-info">
              <strong>Status:</strong>
              <span className={`status-large ${selectedOrder.status?.toLowerCase() || "placed"}`}>
                {selectedOrder.status || "Order Placed"}
              </span>
            </div>

            <div className="order-actions">
              <button 
                className="continue-btn"
                onClick={() => navigate("/products")}
              >
                ← Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Orders;