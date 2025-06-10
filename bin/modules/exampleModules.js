/*
  Example Modules
*/

const { InternalServerError, NotFoundError, BadRequestError } = require("../helpers/error");
const { Product } = require("../../models");
const logger = require('../helpers/utils/logger');

module.exports.createProduct = async (productData) => {
  try {
    const existData = await this.detailProduct({
      name: productData.name,
      avail_size: productData.avail_size
    });

    logger.info("Checking if data exist"); // Try to log every action, so debugging will be easier
    if (existData) {
      throw new BadRequestError("Product already exist");
    };

    const result = await Product.create(productData);

    return result;
  } catch (error) {
    console.log(error);
    throw new InternalServerError(error.message);
  }
}

module.exports.detailProduct = async (attr) => {
  try {
    const data = await Product.findAll({
      where: attr
    });

    if (!data) {
      throw new NotFoundError("Product not found");
    }

    return data;
  } catch (error) {
    throw new InternalServerError(error.message);
  }
}

module.exports.allProduct = async () => {
  try {
    const data = await Product.findAll();

    if (!data) {
      throw new NotFoundError("Data not found");
    }

    return data;
  } catch (error) {
    throw new InternalServerError(error.message);
  }
}

module.exports.updateProduct = async (name, updatedData) => {
  try {
    const rawData = await this.detailProduct({ name });

    const data = rawData.find(item => item.avail_size === updatedData.avail_size);

    if (!data) {
      throw new NotFoundError("Product Not Found");
    }

    const result = await data.update(updatedData);

    return result;
  } catch (error) {
    throw new InternalServerError(error.message);
  }
}

module.exports.deleteProduct = async (id) => {
  try {
    const data = await Product.findOne({
      where: {
        product_id: id
      }
    })

    if (!data) {
      throw new NotFoundError("Product Not Found");
    }
    const result = await data.destroy();

    return result;
  } catch (error) {
    throw new InternalServerError(error.message);
  }
}