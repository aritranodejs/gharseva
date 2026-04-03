const Category = require('../models/Category');

class CategoryRepository {
  async findAll(query = {}) {
    return await Category.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'services', // collection name is 'services'
          localField: '_id',
          foreignField: 'categoryId',
          as: 'services'
        }
      },
      {
        $addFields: {
          serviceCount: { $size: '$services' }
        }
      },
      { $project: { services: 0 } } // Don't return all services, just the count
    ]);
  }

  async findBySlug(slug) {
    return await Category.findOne({ slug });
  }

  async update(id, data) {
    return await Category.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id) {
    return await Category.findByIdAndDelete(id);
  }
}

module.exports = new CategoryRepository();
