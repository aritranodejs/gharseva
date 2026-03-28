const categoryService = require('../services/categoryService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

class CategoryController {
  async getCategories(req, res) {
    try {
      const categories = await categoryService.getAllCategories();
      sendSuccess(res, categories);
    } catch (err) {
      sendError(res, err.message, 500);
    }
  }

  async getCategoryBySlug(req, res) {
    try {
      const category = await categoryService.getCategoryBySlug(req.params.slug);
      if (!category) return sendError(res, 'Category not found', 404);
      sendSuccess(res, category);
    } catch (err) {
      sendError(res, err.message, 500);
    }
  }
}

module.exports = new CategoryController();
