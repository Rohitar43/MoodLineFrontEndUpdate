import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/profile.css";

function Profile() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [msg, setMsg] = useState("");

  // ✅ Fetch Profile
  useEffect(() => {
  const fetchProfile = async () => {
    try {
      const res = await fetch(
        `https://moodlinebackend.onrender.com/api/auth/profile/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        console.log("API Error:", res.status);
        return;
      }

      const data = await res.json();

      console.log("PROFILE DATA:", data); // 🔥 DEBUG

      setUser(data);
    } catch (err) {
      console.log("Fetch error:", err);
    }
  };

  if (userId && token) {
    fetchProfile();
  }
}, [userId, token]);

  // 🔐 Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMsg("Passwords do not match");
      return;
    }

    setLoading(true);

    const res = await fetch("https://moodlinebackend.onrender.com/api/auth/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId,
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      }),
    });

    const data = await res.text();

    if (res.ok) {
      setMsg("✅ Password Updated");
      setTimeout(() => {
        setShowModal(false);
        setMsg("");
      }, 1500);
    } else {
      setMsg(data);
    }

    setLoading(false);
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <div className="profile-page">

      {/* LEFT SIDEBAR */}
      <div className="profile-sidebar">
        <h3>👤 {user.name}</h3>
        <p>{user.email}</p>

        <button onClick={() => navigate("/orders")}>📦 My Orders</button>
        <button onClick={() => navigate("/wishlist")}>❤️ Wishlist</button>
        <button onClick={() => navigate("/cart")}>🛒 Cart</button>
        <button onClick={() => navigate("/checkout")}>📍 Address</button>

        <button className="danger" onClick={logout}>🚪 Logout</button>
      </div>

      {/* RIGHT CONTENT */}
      <div className="profile-content">

        <div className="profile-card">
          <h2>Account Details</h2>

          <div className="profile-grid">
            <div>
              <label>Name</label>
              <p>{user.name}</p>
            </div>

            <div>
              <label>Email</label>
              <p>{user.email}</p>
            </div>

            <div>
              <label>Role</label>
              <p>{user.role}</p>
            </div>

            <div>
              <label>Joined</label>
              <p>{new Date(user.createdDate).toLocaleDateString()}</p>
            </div>
          </div>

          <button className="primary" onClick={() => setShowModal(true)}>
            🔐 Change Password
          </button>
        </div>

      </div>

      {/* 🔐 MODAL */}
      {showModal && (
        <div className="modal">
          <form className="modal-box" onSubmit={handleChangePassword}>
            <h3>Change Password</h3>

            <input
              type="password"
              placeholder="Old Password"
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, oldPassword: e.target.value })
              }
              required
            />

            <input
              type="password"
              placeholder="New Password"
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, newPassword: e.target.value })
              }
              required
            />

            <input
              type="password"
              placeholder="Confirm Password"
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
              }
              required
            />

            {msg && <p className="msg">{msg}</p>}

            <button type="submit">{loading ? "Updating..." : "Update"}</button>
            <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Profile;