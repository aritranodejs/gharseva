const Category = require('../models/Category');

class CategoryRepository {
  async findAll(query = {}) {
    return await Category.find(query);
  }

  async findBySlug(slug) {
    return await Category.findOne({ slug });
  }

  async create(data) {
    return await Category.create(data);
  }
}

module.exports = new CategoryRepository();
