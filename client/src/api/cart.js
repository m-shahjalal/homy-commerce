import axios from "../utils/axios";

const cart = {};

cart.getCart = () => {
  return axios.get("/cart");
};

cart.addToCart = (item) => {
  return axios.post("/cart/add");
};

cart.removeFromCart = (item) => {
  return axios.post("/cart/remove");
};

cart.clearCart = () => {
  return axios.post("/cart/clear");
};
