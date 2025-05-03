const supabase = require('../config/supabase');

class ProductModel {
  static async createProduct(productData, sellerId) {
    const { name, description, price, image_url, industry, availability, brand, key_features, specification } = productData;

    // Validate images
    if (!image_url) {
      throw new Error('Please provide at least one image');
    }
    
    if (!Array.isArray(image_url)) {
      throw new Error('Image data should be provided as an array');
    }

    if (image_url.length === 0) {
      throw new Error('Please provide at least one image');
    }
    
    // Validate image URLs
    const imageUrls = [];
    for (const imageUrl of image_url) {
      try {
        if (!imageUrl || typeof imageUrl !== 'string') {
          throw new Error('Image URL must be a valid string');
        }

        if (!imageUrl.startsWith('http')) {
          throw new Error('Invalid image URL format');
        }

        imageUrls.push(imageUrl);
      } catch (error) {
        throw new Error(`Failed to process image: ${error.message}`);
      }
    }

    // Create product first
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert([{
        name,
        description,
        price,
        seller_id: sellerId,
        status: 'pending',
        category: industry,
        availability,
        brand,
        key_features,
        specification
      }])
      .select()
      .single();

    if (productError) {
      throw new Error(productError.message);
    }

    // Insert image URLs into product_images table
    const productImages = imageUrls.map(url => ({
      product_id: product.id,
      image_url: url
    }));

    const { error: imageError } = await supabase
      .from('product_images')
      .insert(productImages);

    if (imageError) {
      // If image insertion fails, delete the product
      await supabase
        .from('products')
        .delete()
        .eq('id', product.id);
      throw new Error('Failed to save product images');
    }

    // Get the complete product with images
    const { data: completeProduct, error: fetchError } = await supabase
      .from('products')
      .select(`
        *,
        product_images (image_url)
      `)
      .eq('id', product.id)
      .single();

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    return completeProduct;
  }

  static async findById(id) {
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        users!products_seller_id_fkey(name, email),
        product_images(image_url)
      `)
      .eq('id', id)
      .single();

    if (error) {
      return null;
    }

    return product;
  }

  static async findAll(filters = {}) {
    let query = supabase
      .from('products')
      .select(`
        *,
        users!products_seller_id_fkey(name, email),
        product_images(image_url)
      `);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.seller_id) {
      query = query.eq('seller_id', filters.seller_id);
    }

    if (filters.industry) {
      query = query.eq('industry', filters.industry);
    }
    
    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    const { data: products, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return products;
  }

  static async updateProduct(id, updateData, sellerId) {
    // Verify product belongs to seller
    const { data: existingProduct } = await supabase
      .from('products')
      .select('seller_id')
      .eq('id', id)
      .single();

    if (!existingProduct || existingProduct.seller_id !== sellerId) {
      throw new Error('Unauthorized to update this product');
    }

    const { image_url, ...productData } = updateData;

    // Update product data
    const { data: product, error: productError } = await supabase
      .from('products')
      .update(productData)
      .eq('id', id)
      .select()
      .single();

    if (productError) {
      throw new Error(productError.message);
    }

    // Update images if provided
    if (image_url && Array.isArray(image_url)) {
      // Delete existing images
      await supabase
        .from('product_images')
        .delete()
        .eq('product_id', id);

      // Insert new images
      const productImages = image_url.map(url => ({
        product_id: id,
        image_url: url
      }));

      const { error: imageError } = await supabase
        .from('product_images')
        .insert(productImages);

      if (imageError) {
        throw new Error('Failed to update product images');
      }
    }

    // Get updated product with images
    const { data: updatedProduct, error: fetchError } = await supabase
      .from('products')
      .select(`
        *,
        product_images(image_url)
      `)
      .eq('id', id)
      .single();

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    return updatedProduct;
  }

  static async deleteProduct(id, sellerId) {
    // Verify product belongs to seller
    const { data: existingProduct } = await supabase
      .from('products')
      .select('seller_id')
      .eq('id', id)
      .single();

    if (!existingProduct || existingProduct.seller_id !== sellerId) {
      throw new Error('Unauthorized to delete this product');
    }

    // Delete product images first
    await supabase
      .from('product_images')
      .delete()
      .eq('product_id', id);

    // Delete the product
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    return true;
  }

  static async updateStatus(id, status) {
    const { data: product, error } = await supabase
      .from('products')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return product;
  }
  
  // Find multiple products by their IDs
  static async findByIds(ids) {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return [];
    }
    
    // Use Supabase's .in() filter to get all products with the given IDs
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        product_images(image_url)
      `)
      .in('id', ids);
      
    if (error) {
      throw new Error(error.message);
    }
    
    return products || [];
  }
}

module.exports = ProductModel;