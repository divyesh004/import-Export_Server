const supabase = require('../config/supabase');

class CartModel {
  static async addToCart(userId, productData) {
    const { product_id, quantity } = productData;

    // Verify product exists and is approved
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .eq('status', 'approved')
      .single();

    if (productError || !product) {
      throw new Error('Product not found or not approved');
    }

    // Check if product already exists in cart
    const { data: existingItem } = await supabase
      .from('cart')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', product_id)
      .single();

    if (existingItem) {
      // Update quantity if product already in cart
      const { data: updatedItem, error } = await supabase
        .from('cart')
        .update({ quantity: existingItem.quantity + quantity })
        .eq('id', existingItem.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return updatedItem;
    }

    // Add new item to cart
    const { data: cartItem, error } = await supabase
      .from('cart')
      .insert([{ user_id: userId, product_id, quantity }])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return cartItem;
  }

  static async getUserCart(userId) {
    const { data: cartItems, error } = await supabase
      .from('cart')
      .select('*, products(*)')
      .eq('user_id', userId);

    if (error) {
      throw new Error(error.message);
    }

    return cartItems;
  }

  static async removeFromCart(cartId, userId) {
    // Verify cart item belongs to user
    const { data: existingItem } = await supabase
      .from('cart')
      .select('user_id')
      .eq('id', cartId)
      .single();

    if (!existingItem || existingItem.user_id !== userId) {
      throw new Error('Unauthorized to remove this cart item');
    }

    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('id', cartId);

    if (error) {
      throw new Error(error.message);
    }

    return true;
  }

  static async clearCart(userId) {
    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('user_id', userId);

    if (error) {
      throw new Error(error.message);
    }

    return true;
  }

  static async updateQuantity(cartId, userId, quantity) {
    // Verify cart item belongs to user
    const { data: existingItem } = await supabase
      .from('cart')
      .select('user_id')
      .eq('id', cartId)
      .single();

    if (!existingItem || existingItem.user_id !== userId) {
      throw new Error('Unauthorized to update this cart item');
    }

    const { data: updatedItem, error } = await supabase
      .from('cart')
      .update({ quantity })
      .eq('id', cartId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return updatedItem;
  }
}

module.exports = CartModel;