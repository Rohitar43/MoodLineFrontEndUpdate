import { useNavigate } from "react-router-dom";
import "../styles/home.css";
import hero from "../assets/hero-fashion.jpg";
import men from "../assets/men-fashion.jpg";
import women from "../assets/women-fashion.jpg";
import shoes from "../assets/shoes.jpg";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home">

      {/* HERO */}
      <section
        className="hero"
        style={{ backgroundImage: `url(${hero})` }}
      >
        <div className="hero-content">
          <h1>Redefine Your Everyday Elegance.</h1>

          <p>
            Discover our new season collection. Premium fabrics,
            flawless tailoring and timeless designs.
          </p>

          <button onClick={() => navigate("/products")}>
            SHOP COLLECTION
          </button>
        </div>
      </section>

      {/* 🔥 NEW ARRIVALS HEADER */}
      <section className="categories">

        <div className="section-header">
          <div>
            <h2>New Arrivals</h2>
            <p>Curated essentials for your closet</p>
          </div>

          <span
            className="view-all"
            onClick={() => navigate("/products")}
          >
            View All →
          </span>
        </div>

        <div className="category-grid">
          <div className="card">
            <img src={men} alt="men" />
            <span>Men</span>
          </div>

          <div className="card">
            <img src={women} alt="women" />
            <span>Women</span>
          </div>

          <div className="card">
            <img src={shoes} alt="shoes" />
            <span>Footwear</span>
          </div>
        </div>

      </section>

      {/* FEATURES */}
      <section className="features">
        <div className="feature">
          <h3>Premium Quality</h3>
          <p>
            Ethically sourced materials and expert craftsmanship in every piece.
          </p>
        </div>

        <div className="feature">
          <h3>Sustainable Practice</h3>
          <p>
            We are committed to reducing our environmental footprint step by step.
          </p>
        </div>

        <div className="feature">
          <h3>Cash on Delivery</h3>
          <p>
            Pay conveniently at your doorstep. Risk-free shopping experience.
          </p>
        </div>
      </section>

    </div>
  );
}

export default Home;