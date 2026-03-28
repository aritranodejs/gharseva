const categoryRepository = require('../repositories/categoryRepository');

class CategoryService {
  async getAllCategories() {
    return await categoryRepository.findAll({ isActive: true });
  }

  async getCategoryBySlug(slug) {
    return await categoryRepository.findBySlug(slug);
  }
}

module.exports = new CategoryService();
