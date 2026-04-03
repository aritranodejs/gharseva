const categoryRepository = require('../repositories/categoryRepository');

class CategoryService {
  async getAllCategories() {
    return await categoryRepository.findAll({ isActive: true });
  }

  async getCategoryBySlug(slug) {
    return await categoryRepository.findBySlug(slug);
  }

  async createCategory(data) {
    if (!data.slug && data.name) {
      data.slug = data.name.toLowerCase().replace(/ /g, '-');
    }
    return await categoryRepository.create(data);
  }

  async updateCategory(id, data) {
    return await categoryRepository.update(id, data);
  }

  async deleteCategory(id) {
    return await categoryRepository.delete(id);
  }
}

module.exports = new CategoryService();
