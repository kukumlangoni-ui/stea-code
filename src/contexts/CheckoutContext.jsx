import React, { createContext, useContext } from "react";
import { useNavigate } from "react-router-dom";

const CheckoutContext = createContext();

export const CheckoutProvider = ({ children }) => {
  const navigate = useNavigate();

  const openCheckout = (product) => {
    if (!product?.id) return;
    if (product.isChabaData || product.market === "china") return;
    navigate(`/marketplace/checkout/${product.id}`);
  };

  return (
    <CheckoutContext.Provider value={{ openCheckout }}>
      {children}
    </CheckoutContext.Provider>
  );
};

export const useCheckout = () => useContext(CheckoutContext);
