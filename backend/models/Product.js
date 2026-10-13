const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, index: true },
    description: { type: String, default: '' },
    brand: { type: String, default: '' },
    category: { type: String, required: true, index: true },
    price: { type: Number, required: true, min: 0 },
    actualPrice: { type: Number, default: 0 },
    stock: { type: Number, default: 0, min: 0 },
    images: { type: [String], default: [] },
    featured: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text', brand: 'text' });

productSchema.pre('validate', function makeSlug(next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = `${this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')}-${Date.now().toString(36)}`;
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
