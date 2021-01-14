import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storagedProducts = await AsyncStorage.getItem('@GoMarket:products');

      if (storagedProducts) {
        setProducts([...JSON.parse(storagedProducts)]);
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      products.findIndex(p => p.id === id);
      const updatedProduct = [...products];
      const index = updatedProduct.findIndex(p => p.id === id);
      updatedProduct[index].quantity += 1;

      setProducts(updatedProduct);

      await AsyncStorage.setItem(
        'GoMarket:products',
        JSON.stringify(updatedProduct),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const updatedProduct = [...products];
      const index = updatedProduct.findIndex(p => p.id === id);
      if (updatedProduct[index].quantity > 1)
        updatedProduct[index].quantity -= 1;

      setProducts(updatedProduct);
      await AsyncStorage.setItem(
        'GoMarket:products',
        JSON.stringify(updatedProduct),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async productWithoutQuantity => {
      if (!products.find(p => p.id === productWithoutQuantity.id))
        setProducts([...products, { ...productWithoutQuantity, quantity: 1 }]);
      else increment(productWithoutQuantity.id);
      await AsyncStorage.setItem(
        'GoMarket:products',
        JSON.stringify([
          ...products,
          { ...productWithoutQuantity, quantity: 1 },
        ]),
      );
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
