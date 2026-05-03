import axios from '../utils/axios';

const products = {};

products.getProducts = (page = 1, q = '') => {
	return axios.get(`products?page=${page}&q=${q}`);
};

products.getSingleProduct = (id) => {
	return axios.get(`products/${id}`);
};

products.getCategory = (category) => {
	return axios.get(`products/category/${category}`);
};

products.getPopularProduct = () => {
	return axios.get(`products/popular`);
};

products.createReview = (id, info) => {
	return axios.post(`products/${id}/review`, info);
};

products.searchProducts = (info) => {
	return axios.get(`products/search?q=${info}`);
};
export default products;
