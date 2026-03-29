import { createContext, useState, useEffect, useCallback } from "react";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  const getCartKey = useCallback(() => {
    const userId = localStorage.getItem("userId");
    return userId ? `cart_${userId}` : null;
  }, []);

  const getWishlistKey = useCallback(() => {
    const userId = localStorage.getItem("userId");
    return userId ? `wishlist_${userId}` : null;
  }, []);

  const loadCartCount = useCallback(async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setCartCount(0);
      return;
    }

    const cartKey = `cart_${userId}`;
    const stored = JSON.parse(localStorage.getItem(cartKey) || "[]");
    setCartCount(stored.length);
  }, []);

  const loadWishlistCount = useCallback(async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setWishlistCount(0);
      return;
    }

    const wishlistKey = `wishlist_${userId}`;
    const stored = JSON.parse(localStorage.getItem(wishlistKey) || "[]");
    setWishlistCount(stored.length);
  }, []);

  useEffect(() => {
    loadCartCount();
    loadWishlistCount();

    const handleStorageChange = () => {
      loadCartCount();
      loadWishlistCount();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("cartUpdated", handleStorageChange);
    window.addEventListener("wishlistUpdated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("cartUpdated", handleStorageChange);
      window.removeEventListener("wishlistUpdated", handleStorageChange);
    };
  }, [loadCartCount, loadWishlistCount]);

  return (
    <CartContext.Provider
      value={{
        cartCount,
        wishlistCount,
        loadCartCount,
        loadWishlistCount,
        getCartKey,
        getWishlistKey
      }}
    >
      {children}
    </CartContext.Provider>
  );
};