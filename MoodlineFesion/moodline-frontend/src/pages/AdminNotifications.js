import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/adminNotifications.css";

function AdminNotifications() {
  const [orders, setOrders] = useState([]);
  const [ordersWithDiscounts, setOrdersWithDiscounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const navigate = useNavigate();

  // ✅ FETCH FROM API (FIXED PORT)
  useEffect(() => {
    setLoading(true);
    fetch("https://moodlinebackend.onrender.com/api/Order/admin/all")
      .then(res => res.json())
      .then(data => {
        setOrders(data || []);
        // ✅ Calculate discounts for each order
        calculateDiscounts(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("API Error:", err);
        setLoading(false);
      });
  }, []);

  // ✅ CALCULATE DISCOUNT FOR EACH ORDER ITEM
  const calculateDiscounts = async (orders) => {
    try {
      const ordersWithCalcDiscounts = await Promise.all(
        orders.map(async (order) => {
          let totalDiscountAmount = 0;
          let totalOriginalPrice = 0;

          // Fetch product details for each item to get discount percent
          const itemsWithDiscount = await Promise.all(
            order.items.map(async (item) => {
              try {
                const response = await fetch(`https://moodlinebackend.onrender.com/api/product/${item.productId}`);
                const product = await response.json();
                
                const discountPercent = product.discountPercent || 0;
                const originalPrice = item.unitPrice / (1 - discountPercent / 100);
                const discountAmount = (originalPrice - item.unitPrice) * item.quantity;

                totalDiscountAmount += discountAmount;
                totalOriginalPrice += originalPrice * item.quantity;

                return {
                  ...item,
                  discountPercent,
                  originalPrice: Math.round(originalPrice),
                  discountAmount: Math.round(discountAmount)
                };
              } catch (err) {
                console.error(`Error fetching product ${item.productId}:`, err);
                return item;
              }
            })
          );

          return {
            ...order,
            items: itemsWithDiscount,
            totalDiscountAmount: Math.round(totalDiscountAmount),
            totalOriginalPrice: Math.round(totalOriginalPrice),
            discountPercent: totalOriginalPrice > 0 ? Math.round((totalDiscountAmount / totalOriginalPrice) * 100) : 0
          };
        })
      );

      setOrdersWithDiscounts(ordersWithCalcDiscounts);
    } catch (err) {
      console.error("Error calculating discounts:", err);
      setOrdersWithDiscounts(orders);
    }
  };

  // ✅ CALCULATE STATISTICS
  const stats = useMemo(() => {
    const ordersList = ordersWithDiscounts.length > 0 ? ordersWithDiscounts : orders;
    return {
      total: ordersList.length,
      placed: ordersList.filter(o => o.status === "Placed").length,
      cancelled: ordersList.filter(o => o.status === "Cancelled").length,
      totalAmount: ordersList.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      totalItems: ordersList.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0),
      totalDiscount: ordersList.reduce((sum, o) => sum + (o.totalDiscountAmount || 0), 0),
    };
  }, [orders, ordersWithDiscounts]);

  // ✅ FILTER + SEARCH
  const filteredOrders = useMemo(() => {
    const ordersList = ordersWithDiscounts.length > 0 ? ordersWithDiscounts : orders;
    return ordersList
      .filter(o => {
        if (filterStatus === "Placed") return o.status === "Placed";
        if (filterStatus === "Cancelled") return o.status === "Cancelled";
        return true;
      })
      .filter(o => {
        const s = searchTerm.toLowerCase();
        return (
          o.orderId.toString().includes(s) ||
          (o.address?.fullName || "").toLowerCase().includes(s) ||
          (o.address?.city || "").toLowerCase().includes(s) ||
          (o.address?.state || "").toLowerCase().includes(s) ||
          (o.address?.phone || "").toLowerCase().includes(s) ||
          (o.address?.pincode || "").toLowerCase().includes(s) ||
          o.totalAmount.toString().includes(s)
        );
      })
      .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
  }, [orders, ordersWithDiscounts, searchTerm, filterStatus]);

  const formatDate = (date) => {
    return new Date(date).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="admin-notifications-container">

      {/* HEADER */}
      <div className="notifications-header">
        <h1 className="notifications-title">
          📦 Admin Orders
          {stats.total > 0 && <span className="notifications-badge">{stats.total}</span>}
        </h1>
        <div className="notifications-controls">
          <button onClick={() => window.location.reload()} className="btn btn-primary">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* STATISTICS */}
      {stats.total > 0 && (
        <div className="notification-stats">
          <div className="stat-card">
            <div className="stat-label">Total Orders</div>
            <div className="stat-value">{stats.total}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Placed</div>
            <div className="stat-value" style={{ color: "#10b981" }}>
              {stats.placed}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Cancelled</div>
            <div className="stat-value" style={{ color: "#ef4444" }}>
              {stats.cancelled}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Amount</div>
            <div className="stat-value" style={{ fontSize: "18px" }}>
              ₹{stats.totalAmount.toLocaleString()}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Items</div>
            <div className="stat-value">{stats.totalItems}</div>
          </div>
          {stats.totalDiscount > 0 && (
            <div className="stat-card discount-stat">
              <div className="stat-label">💰 Total Discount Save</div>
              <div className="discount-stat-value">
                ₹{stats.totalDiscount.toLocaleString()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 🔍 SEARCH & FILTER */}
      {orders.length > 0 && (
        <div className="search-filter-container">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Search by Order ID, Customer, City, Phone, Amount..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Orders ({stats.total})</option>
            <option value="Placed">Placed ({stats.placed})</option>
            <option value="Cancelled">Cancelled ({stats.cancelled})</option>
          </select>
        </div>
      )}

      {/* LOADING STATE */}
      {loading && <p style={{ textAlign: "center", color: "#666" }}>⏳ Loading orders...</p>}

      {/* 📭 EMPTY */}
      {!loading && filteredOrders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <h3 className="empty-state-title">
            {orders.length === 0 ? "No Orders Yet" : "No Results Found"}
          </h3>
          <p className="empty-state-message">
            {orders.length === 0
              ? "All set! You'll see new orders here."
              : "Try adjusting your search or filter criteria."}
          </p>
        </div>
      ) : (
        <div className="notifications-list">
          {filteredOrders.map(order => (
            <div key={order.orderId} className={`notification-card ${order.status.toLowerCase()}`}>

              {/* HEADER */}
              <div className="notification-header">
                <h3 className="notification-title">
                  <span className="order-badge">Order #{order.orderId}</span>
                  <span className={`status-badge ${order.status.toLowerCase()}`}>
                    {order.status}
                  </span>
                </h3>
              </div>

              {/* TOP INFO */}
              <div className="notification-details">
                <div className="detail-item">
                  <div className="detail-label">👤 Customer</div>
                  <div className="detail-value">{order.address?.fullName || "N/A"}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">📱 Phone</div>
                  <div className="detail-value">{order.address?.phone || "N/A"}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">💰 Amount</div>
                  <div className="amount-value">₹{order.totalAmount.toLocaleString()}</div>
                </div>
                {order.totalDiscountAmount > 0 && (
                  <div className="detail-item discount-highlight">
                    <div className="detail-label">🎁 Discount Save</div>
                    <div className="discount-value">₹{order.totalDiscountAmount.toLocaleString()} ({order.discountPercent}%)</div>
                  </div>
                )}
                <div className="detail-item">
                  <div className="detail-label">💳 Payment</div>
                  <div className="detail-value">{order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment"}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">📅 Date</div>
                  <div className="detail-value">{formatDate(order.createdDate)}</div>
                </div>
              </div>

              {/* 📍 ADDRESS */}
              <div className="address-section">
                <div className="address-header">
                  <span className="address-icon">📍 Delivery Address</span>
                </div>
                <div className="address-details">
                  <p className="address-line"><strong>{order.address?.fullName || "Unknown"}</strong></p>
                  <p className="address-line">{order.address?.addressLine1 || ""}</p>
                  {order.address?.addressLine2 && <p className="address-line">{order.address.addressLine2}</p>}
                  <p className="address-line"><strong>{order.address?.city || ""}, {order.address?.state || ""}</strong></p>
                  <p className="address-line">📮 Pincode: <strong>{order.address?.pincode || ""}</strong></p>
                </div>
              </div>

              {/* 📦 ITEMS */}
              <div className="items-section">
                <div className="items-header">
                  <span>📦 Items ({order.items?.length || 0})</span>
                </div>
                <div className="items-list">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="item-row">
                      <div className="item-info">
                        <strong>{item.productName}</strong>
                        <div className="item-details">
                          {item.color && <span className="item-detail">🎨 {item.color}</span>}
                          {item.size && <span className="item-detail">📏 {item.size}</span>}
                          {item.discountPercent > 0 && (
                            <span className="item-detail discount-badge">
                              🎁 {item.discountPercent}% OFF
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="item-quantity">
                        <span>{item.quantity}x</span>
                      </div>
                      <div className="item-price">
                        {item.originalPrice && item.originalPrice > item.unitPrice && (
                          <div className="unit-price">₹{item.originalPrice}</div>
                        )}
                        <div className="total-price">₹{item.unitPrice}</div>
                        {item.discountAmount > 0 && (
                          <div className="discount-amount">Save ₹{Math.round(item.discountAmount / item.quantity)}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="items-footer">
                  <strong>Total Items:</strong> {order.items?.reduce((sum, i) => sum + i.quantity, 0)} | <strong>Order Total:</strong> ₹{order.totalAmount.toLocaleString()}
                  {order.totalDiscountAmount > 0 && (
                    <span className="items-discount"> | <strong style={{ color: "#ef4444" }}>Discount: ₹{order.totalDiscountAmount.toLocaleString()}</strong></span>
                  )}
                </div>
              </div>

              {/* FOOTER ACTIONS */}
              <div className="notification-footer">
                <span className="timestamp">Order Date: {new Date(order.createdDate).toLocaleDateString("en-IN")}</span>
                <div className="button-group">
                  <button className="btn btn-primary" onClick={() => setSelectedOrder(order)}>
                    👁️ View Details
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* ✅ DETAILS MODAL */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order #{selectedOrder.orderId} Details</h2>
              <button className="close-btn" onClick={() => setSelectedOrder(null)}>✕</button>
            </div>

            <div className="modal-content">
              {/* ORDER STATUS & BASIC INFO */}
              <div className="detail-section">
                <h3>Order Information</h3>
                <div className="detail-grid">
                  <div className="detail-box">
                    <div className="label">Order ID</div>
                    <div className="value">#{selectedOrder.orderId}</div>
                  </div>
                  <div className="detail-box">
                    <div className="label">Status</div>
                    <div className="value">
                      <span className={`status-badge ${selectedOrder.status.toLowerCase()}`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                  </div>
                  <div className="detail-box">
                    <div className="label">Payment Method</div>
                    <div className="value">{selectedOrder.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment"}</div>
                  </div>
                  <div className="detail-box">
                    <div className="label">Order Date</div>
                    <div className="value">{formatDate(selectedOrder.createdDate)}</div>
                  </div>
                </div>
              </div>

              {/* CUSTOMER DETAILS */}
              <div className="detail-section">
                <h3>Customer Information</h3>
                <div className="detail-grid">
                  <div className="detail-box">
                    <div className="label">👤 Name</div>
                    <div className="value">{selectedOrder.address?.fullName || "N/A"}</div>
                  </div>
                  <div className="detail-box">
                    <div className="label">📱 Phone</div>
                    <div className="value">{selectedOrder.address?.phone || "N/A"}</div>
                  </div>
                </div>
              </div>

              {/* DELIVERY ADDRESS */}
              <div className="detail-section">
                <h3>📍 Delivery Address</h3>
                <div className="address-box">
                  <p><strong>{selectedOrder.address?.fullName}</strong></p>
                  <p>{selectedOrder.address?.addressLine1}</p>
                  {selectedOrder.address?.addressLine2 && <p>{selectedOrder.address?.addressLine2}</p>}
                  <p>{selectedOrder.address?.city}, {selectedOrder.address?.state} - {selectedOrder.address?.pincode}</p>
                </div>
              </div>

              {/* ORDER ITEMS */}
              <div className="detail-section">
                <h3>📦 Order Items</h3>
                <div className="items-detail-table">
                  <div className="table-header">
                    <div className="col-name">Product</div>
                    <div className="col-qty">Qty</div>
                    <div className="col-price">Unit Price</div>
                    <div className="col-discount">Discount</div>
                    <div className="col-total">Total</div>
                  </div>
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="table-row">
                      <div className="col-name">
                        <strong>{item.productName}</strong>
                        {item.color && <div className="item-meta">Color: {item.color}</div>}
                        {item.size && <div className="item-meta">Size: {item.size}</div>}
                      </div>
                      <div className="col-qty">{item.quantity}</div>
                      <div className="col-price">
                        {item.originalPrice && item.originalPrice > item.unitPrice && (
                          <div className="original-price">₹{item.originalPrice}</div>
                        )}
                        <div>₹{item.unitPrice}</div>
                      </div>
                      <div className="col-discount">
                        {item.discountPercent > 0 ? (
                          <>
                            <div className="discount-pct">{item.discountPercent}%</div>
                            <div className="discount-amt">₹{Math.round(item.discountAmount / item.quantity)}</div>
                          </>
                        ) : (
                          "-"
                        )}
                      </div>
                      <div className="col-total">₹{item.totalPrice}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PRICE SUMMARY */}
              <div className="detail-section">
                <h3>💰 Price Summary</h3>
                <div className="price-summary">
                  <div className="summary-row">
                    <span>Original Price:</span>
                    <span>₹{selectedOrder.totalOriginalPrice?.toLocaleString() || selectedOrder.totalAmount.toLocaleString()}</span>
                  </div>
                  {selectedOrder.totalDiscountAmount > 0 && (
                    <div className="summary-row discount-row">
                      <span>💰 Discount ({selectedOrder.discountPercent}%):</span>
                      <span>-₹{selectedOrder.totalDiscountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="summary-row total-row">
                    <span>Final Amount:</span>
                    <span>₹{selectedOrder.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => window.print()}>🖨️ Print</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminNotifications;