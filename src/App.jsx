import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
// import './App.css'

function App() {

  const products = [
    { id: 1, code: 'GR1', name: "Green Tea", price: 3.11 },
    { id: 2, code: "SR1", name: "Strawberries", price: 5.00 },
    { id: 3, code: "CF1", name: "Coffee", price: 11.23 },
  ];

  // Hard code for the meantime.
  const promos = [
    {
      id: 1, product_code: 'GR1', discount_code: 'B2:3.11', discount_name: 'Buy one green tea and get one free',
    },
    {
      id: 2, product_code: 'SR1', discount_code: 'PT:3-9999:4.5', discount_name: 'Product Limit of 3 get new price 4.50',
    },
    {
      id: 3, product_code: 'CF1', discount_code: 'PT:3-9999:66.66%', discount_name: 'Product Limit of 3 get new price of 2/3 of its original price',
    },
  ];

  const [cart, setCart] = useState([]);
  const [lastProduct, setLastProduct] = useState(null);
  const [bundle, setBundle] = useState([]);

  useEffect(() => {
    if (lastProduct) {
      addBundle(lastProduct);
      setLastProduct(null);
    }
  }, [lastProduct]);

  const addToCart = (product) => {

    setCart((prev) => {

      const exists = prev.find((item) => item.id === product.id);

      if (exists) {
        const item = prev.map((item) =>
          item.id === product.id ? promoComputation({ ...item, qty: item.qty + 1, subtotal: item.price * (item.qty + 1) }) : promoComputation({
            ...item,
          })
        );

        console.log(item);

        return item;

      } else {

        const item = { ...product, qty: 1, subtotal: product.price };

        return [...prev, promoComputation(item)];

      }
    });
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const promoComputation = (product) => {
    try {

      const promo = promos.find(item => item.product_code === product.code);

      if (promo) {
        const promoParse = parseDiscountText(promo.product_code, promo.discount_code, product.price);

        if (promoParse.type == 'tier') {
          if (product.qty >= promoParse.min && product.qty <= promoParse.max) {
            const subtotal = promoParse.price * product.qty;
            return {
              ...product,
              price: promoParse.price,
              subtotal: subtotal,
              discount_name: promo.discount_name,
            };
          }
        } else if (promoParse.type == 'bundle') {


          const excess = product.qty % promoParse.qty;
          const promoQty = Math.trunc(product.qty / promoParse.qty);
          const promoPrice = promoParse.price;
          const promoSubtotal = promoQty * promoParse.price;
          const excessSubtotal = excess * product.price;
          const subtotal = promoSubtotal + excessSubtotal;


          const discountText = `${promo.discount_name} x ${promoQty}`

          return {
            ...product,
            subtotal: subtotal,
            discount_name: promoSubtotal != 0 ? discountText : '',
          }
        }
      }

      return product;
    } catch (e) {
      console.log(e.message);
    }
  }

  const addBundle = (product) => {
    setBundle((prev) => {
      const existing = prev.find((item) => item.id === product.id);

      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, qty: (item.qty || 0) + 1 }
            : item
        );
      }

      return [...prev, { ...product, qty: 1, price: 0 }];
    });
  };

  const parseDiscountText = (promoCode, discountCode = '', originalPrice = 0) => {
    if (!promoCode || !discountCode) {
      return { type: 'normal', min: 0, max: 0, price: 0 };
    }

    switch (promoCode) {
      case 'SR1':
      case 'CF1': {
        // Tier promo, format: "PT:3-9999:4.5"
        const parts = discountCode.split(":");
        if (parts.length !== 3) {
          throw new Error(`Invalid tier promo format: ${discountCode}`);
        }

        const [min, max] = parts[1].split("-").map(Number);

        const price = parts[2].includes('%')
          ? originalPrice * (parseFloat(parts[2]) / 100)
          : parseFloat(parts[2]);

        console.log("Parts:", parts);
        console.log("Parts:", price);

        return { type: 'tier', min, max, price };
      }

      case 'GR1': {
        // Bundle promo, format: "B2:3.11"
        const match = discountCode.match(/^[A-Z](\d+):([\d.]+)$/i);
        if (!match) {
          throw new Error(`Invalid bundle promo format: ${discountCode}`);
        }

        const qty = parseInt(match[1], 10);
        const price = parseFloat(match[2]);

        return { type: 'bundle', qty, price };
      }

      default:
        return { type: 'normal', min: 0, max: 0, price: 0 };
    }
  };

  const total = cart.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <>

      <div className="min-h-screen bg-gray-50 p-6">
        <h1 className="text-3xl font-bold underline mb-6">Mini POS</h1>

        {/* Products */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {products.map((p) => (
            <div
              key={p.id}
              className="border rounded-lg p-4 shadow-sm flex flex-col items-center"
            >
              <div className="text-lg font-semibold">{p.name} ({p.code})</div>
              <div className="text-gray-500 mb-3">{p.price} €</div>
              <button
                onClick={() => addToCart(p)}
                className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>

        {/* Cart */}
        <div className="bg-white shadow-md rounded-lg p-4 max-w-md mx-auto">
          <h2 className="text-xl font-bold mb-3">Cart</h2>
          {cart.length === 0 ? (
            <p className="text-gray-500">Cart is empty</p>
          ) : (
            <ul className="divide-y">
              {cart.map((item) => (
                // Make the li a column so subrow sits below the main row
                <li key={item.id} className="flex flex-col py-2">
                  {/* main row */}
                  <div className="flex items-center justify-between">
                    <span>
                      {item.name}({item.code}) x {item.qty}
                    </span>

                    <div className="flex items-center gap-3">
                      {/* <span className="font-semibold">€{(item.price * item.qty).toFixed(2)}</span> */}
                      <span className="font-semibold">€{(item.subtotal).toFixed(2)}</span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="ml-3 text-red-600 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {
                    item.discount_name && (<ul className="mt-2 ml-4 text-sm text-gray-600 list-disc space-y-1 list-none">
                      <li>{item.discount_name}</li>
                    </ul>)
                  }

                  {/* <ul className="mt-2 ml-4 text-sm text-gray-600 list-disc space-y-1 list-none">

                  {
                    bundle.map((item) =>
                        <li key={item.id}>Free {item.name} x {item.qty} €{item.price}</li>
                    )
                  }
                   </ul> */}
                </li>
              ))}
            </ul>

          )}

          {/* Total */}
          <div className="mt-4 flex justify-between items-center">
            <span className="font-bold">Total:</span>
            <span className="font-bold">{total.toFixed(2)} €</span>
          </div>


        </div>

      </div>
    </>
  )
}

export default App;