import axios from "../utils/axios";
const order = {};

order.placeOrder = (value) => {
  return axios.post("/orders", value);
};

order.getOrders = () => {
  return axios.get("/orders");
};

export default order;
