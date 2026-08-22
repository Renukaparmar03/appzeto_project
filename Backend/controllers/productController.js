import Product from '../models/productModel.js';

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    let query = {};

    // Filter by category only if a specific valid category is requested and not 'All'
    if (req.query.category && req.query.category !== 'All') {
      query.category = req.query.category;
    }

    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Seller
export const createProduct = async (req, res) => {
  try {
    const { title, price, discountPrice, originalPrice, brand, status, description, image, images, category, stock, sku, variants, dynamicFields, customAttributes } = req.body;

    const fallbackSku = sku || `PRD-${Date.now().toString().slice(-6)}`;
    const mainImage = image || (images && images[0]?.url) || images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80';

    const product = new Product({
      title: title || 'New Product',
      price: Number(price) || 0,
      discountPrice: discountPrice ? Number(discountPrice) : Number(price) || 0,
      originalPrice: originalPrice ? Number(originalPrice) : Number(price) || 0,
      brand: brand || 'Store Brand',
      status: status || 'Active',
      description: description || 'No description provided.',
      image: mainImage,
      images: Array.isArray(images) && images.length > 0 ? images.map(img => typeof img === 'string' ? { url: img } : img) : [{ url: mainImage }],
      category: category || 'Grocery & Kitchen',
      stock: stock !== undefined ? Number(stock) : 50,
      sku: fallbackSku,
      variants: Array.isArray(variants) ? variants : [],
      dynamicFields: dynamicFields || {},
      customAttributes: customAttributes || [],
      isApproved: true // Direct admin addition is automatically approved
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Seller
export const updateProduct = async (req, res) => {
  try {
    const { title, price, discountPrice, originalPrice, brand, status, description, image, images, category, stock, dynamicFields, customAttributes } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
      product.title = title || product.title;
      product.price = price || product.price;
      product.discountPrice = discountPrice !== undefined ? discountPrice : product.discountPrice;
      product.originalPrice = originalPrice !== undefined ? originalPrice : product.originalPrice;
      product.brand = brand || product.brand;
      product.status = status || product.status;
      product.description = description || product.description;
      product.image = image || product.image;
      product.images = images || product.images;
      product.category = category || product.category;
      product.stock = stock !== undefined ? stock : product.stock;
      product.dynamicFields = dynamicFields !== undefined ? dynamicFields : product.dynamicFields;
      product.customAttributes = customAttributes !== undefined ? customAttributes : product.customAttributes;

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Seller
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      await product.deleteOne();
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update product approval status
// @route   PUT /api/products/:id/approve
// @access  Private/Admin
export const updateProductApproval = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      product.isApproved = req.body.isApproved;
      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
