import axios from '../utils/axios';

export const getUsers = () => {
	return axios.get('admin/users');
};

export const getProducts = () => {
	return axios.get('admin/products');
};

export const addProduct = (info) => {
	return axios.post('admin/products', info);
};

export const updateProduct = (id, info) => {
	return axios.put(`admin/products/${id}`, info);
};

export const deleteProduct = (id) => {
	return axios.delete(`admin/products/${id}`);
};

export const getOrders = () => {
	return axios.get(`admin/orders`);
};

export const updateOrder = (id, info) => {
	return axios.put(`admin/orders/${id}`, info);
};

export const deleteOrder = (id) => {
	return axios.delete(`admin/orders/${id}`);
};

export const makeAdmin = (email) => {
	return axios.get(`admin/make-admin/${email}`);
};
