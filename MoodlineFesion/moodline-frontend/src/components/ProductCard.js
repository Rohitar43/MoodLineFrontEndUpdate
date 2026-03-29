import { Link } from "react-router-dom";

function ProductCard({product,addToCart}){

  const discount = product.discountPercent || 0;
  const basePrice = product.price || 0;
  const finalPrice = discount ? Math.round(basePrice - (basePrice * discount / 100)) : basePrice;

return(

<div className="product-card">

<Link to={`/product/${product.id}`}>

<div className="img-container">

<img
src={`https://moodlinebackend.onrender.com${product.imageUrl}`}
alt={product.name}
/>

</div>

</Link>

<h4>{product.name}</h4>

<p className="price">₹{finalPrice}</p>
{discount > 0 && <span className="off">{discount}% OFF</span>}

<button
className="cart-btn"
onClick={()=>addToCart(product)}
>
Add to Cart
</button>

</div>

);

}

export default ProductCard;