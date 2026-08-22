import mongoose from 'mongoose';

const productSchema = mongoose.Schema(
  {

    title: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    images: [
      {
        url: { type: String, required: true }
      }
    ],
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    discountPrice: {
      type: Number,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
    },
    variants: [
      {
        size: String,
        color: String,
        stock: { type: Number, default: 0 },
        sku: String,
      }
    ],
    brand: {
      type: String,
    },
    originalPrice: {
      type: Number,
    },
    status: {
      type: String,
      default: 'Active'
    },
    dynamicFields: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    customAttributes: [
      {
        key: { type: String },
        value: { type: String }
      }
    ],
    isApproved: {
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model('Product', productSchema);

export default Product;
