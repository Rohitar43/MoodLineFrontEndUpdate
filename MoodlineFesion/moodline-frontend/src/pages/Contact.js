import { FiPhone, FiMail, FiMapPin } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "../styles/contact.css";

function Contact() {
  const navigate = useNavigate();

  return (
    <div className="contact-page-outer">
      <div className="breadcrumb">
        <span onClick={() => navigate("/")} style={{ cursor: "pointer", color: "#2563eb" }}>
          🏠 Home
        </span>
        <span>/</span>
        <span>Contact Us</span>
      </div>
      <div className="contact-page">

      {/* HEADER */}
      <div className="contact-header">
        <h1>Contact Us</h1>
        <p>We’re here to help. Reach out anytime.</p>
      </div>

      {/* MAIN CONTAINER */}
      <div className="contact-container">

        {/* LEFT SIDE */}
        <div className="contact-left">

          <div className="contact-item">
            <FiMail />
            <div>
              <h4>Email</h4>
              <p>ronitrajak2000@gmail.com</p>
            </div>
          </div>

          <div className="contact-item">
            <FiPhone />
            <div>
              <h4>Phone</h4>
              <p>+91 8770975489</p>
            </div>
          </div>

          <div className="contact-item whatsapp">
            <FaWhatsapp />
            <div>
              <h4>WhatsApp</h4>
              <p>+91 8770975489</p>
            </div>
          </div>

        </div>

        {/* RIGHT SIDE */}
        <div className="contact-right">
          <div className="address-box">
            <FiMapPin />
            <h4>Store Address</h4>
            <p>
              sagar, MP 470002
            </p>
          </div>
        </div>

      </div>

    </div>
    </div>
  );
}

export default Contact;