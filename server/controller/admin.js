const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const cloudinary = require('../lib/cloudinary');
const fs = require('fs');

const admin = {};

admin.default = (_, res) => res.json({ message: 'Hello Admin!' });

admin.getUsers = async (_req, res, next) => {
	try {
		const users = await User.find();
		res.json(users);
	} catch (error) {
		next(error);
	}
};

admin.makeAdmin = async (req, res, next) => {
	try {
		const email = req.params.email;
		const updateObj = { roles: ['admin'] };
		await User.findOneAndUpdate(
			{ email },
			{ $set: updateObj },
			{ upsert: true, new: true }
		);
		res.status(200).json({ success: true });
	} catch (error) {
		next(error);
	}
};

admin.getProducts = async (_req, res, next) => {
	try {
		const products = await Product.find({});
		res.status(200).json(products);
	} catch (error) {
		next(error);
	}
};

admin.addProduct = async (req, res, next) => {
	const { name, category, description, price } = req.body;
	try {
		if (!req.file) return res.json({ message: 'select an image file' });
		const { path } = req.file;
		const { url } = await cloudinary.cloudUpload(path, 'ecom/products');
		fs.unlinkSync(path);
		const product = await Product.create({
			name,
			description,
			category,
			price,
			image: url,
		});

		res.status(201).json({ success: true, product });
	} catch (error) {
		next(error);
	}
};

admin.updateProduct = async (req, res, next) => {
	const productId = req.params.id;
	const { name, category, description, price } = req.body;
	try {
		let image = '';
		if (req.file) {
			const { path } = req.file;
			await cloudinary.cloudUpload(
				path,
				'ecom/products'
			);
			image = path.url;
			fs.unlinkSync(path);
		}
		const updateData = { name, category, description, price };
		if (image) updateData.image = image;

		const product = await Product.findOneAndUpdate(
			{ _id: productId },
			updateData,
			{ new: true }
		);
		res.status(201).json({ success: true, product });
	} catch (e) {
		next(e);
	}
};

admin.deleteProduct = async (req, res, next) => {
	const productId = req.params.id;
	const id = req.body.imageId;
	try {
		// NOTE:temporary preventing deleing from DB
		// await Product.findOneAndDelete({ _id: productId });
		// const result = await cloudinary.cloudDelete(`ecom/products/${id}`);
		res.status(204).json({ success: true, message: 'Delete method is disabled for some reason' });
	} catch (e) {
		next(e);
	}
};

admin.getOrders = async (_req, res, next) => {
	try {
		const orders = await Order.find();
		res.status(200).json(orders);
	} catch (e) {
		next(e);
	}
};

admin.deliveryOrder = async (req, res, next) => {
	const id = req.params.id;
	try {
		const update = {
			isDelivered: req.body.isDelivered,
			deliveredAt: new Date(Date.now()).toUTCString(),
		};
		const order = await Order.findOneAndUpdate(
			{ _id: id },
			{ $set: update },
			{ new: true }
		);
		res.status(200).json(order);
	} catch (error) {
		next(error);
	}
};

admin.deleteOrder = async (req, res, next) => {
	const productId = req.params.id;
	try {
		await Order.findOneAndDelete({ _id: productId });
		res.status(204).json({ success: true });
	} catch (e) {
		next(e);
	}
};

module.exports = admin;
