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

  async createCategory(req, res) {
    try {
      const category = await categoryService.createCategory(req.body);
      sendSuccess(res, category, 'Category created');
    } catch (err) {
      sendError(res, err.message, 500);
    }
  }

  async updateCategory(req, res) {
    try {
      const category = await categoryService.updateCategory(req.params.id, req.body);
      if (!category) return sendError(res, 'Category not found', 404);
      sendSuccess(res, category, 'Category updated');
    } catch (err) {
      sendError(res, err.message, 500);
    }
  }

  async deleteCategory(req, res) {
    try {
        await categoryService.deleteCategory(req.params.id);
        sendSuccess(res, null, 'Category deleted');
    } catch (err) {
      sendError(res, err.message, 500);
    }
  }
}

module.exports = new CategoryController();
