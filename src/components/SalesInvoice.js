import React, { useState, useEffect, useCallback } from 'react';
import './SalesInvoice.css';
import authService from '../services/authService';

const customers = [
  { id: 1, name: 'Mr. Rahman', phone: '01711111111', address: 'Dhaka', balance: 5000 },
  { id: 2, name: 'Ms. Akter', phone: '01822222222', address: 'Chittagong', balance: 12000 },
  { id: 3, name: 'Mr. Khan', phone: '01933333333', address: 'Sylhet', balance: 8000 },
  { id: 4, name: 'Ms. Islam', phone: '01644444444', address: 'Rajshahi', balance: 3000 },
];

const paymentMethods = ['Cash', 'Bank', 'Mobile Banking'];

function SalesInvoice() {
  // Step 1: Customer and Date
  const [customerQuery, setCustomerQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '', balance: 0 });
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);

  // Step 2: Products from API
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [invoiceProducts, setInvoiceProducts] = useState([]);
  const [showProductSearch, setShowProductSearch] = useState(false);

  // Step 3: Payment
  const [discount, setDiscount] = useState(0);
  const [otherCost, setOtherCost] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0]);

  // API call function for products
  const productsApiCall = async (endpoint, options = {}) => {
    const url = `http://localhost:8081${endpoint}`;
    
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  };

  // Search products with debouncing
  const searchProducts = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const data = await productsApiCall(`/api/products/search?q=${encodeURIComponent(query)}&page=0&size=20`);
      setSearchResults(data.content || []);
    } catch (error) {
      console.error('Error searching products:', error);
      setSearchError('Failed to search products. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchProducts(productSearchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [productSearchQuery, searchProducts]);

  // Customer search logic
  const filteredCustomers = customers.filter(
    c => c.name.toLowerCase().includes(customerQuery.toLowerCase()) || c.phone.includes(customerQuery)
  );

  const handleCustomerSelect = (c) => {
    setSelectedCustomer(c);
    setCustomerQuery(c.name);
    setShowCustomerList(false);
  };

  const handleAddCustomer = (e) => {
    e.preventDefault();
    setSelectedCustomer(newCustomer);
    setShowAddCustomer(false);
    setCustomerQuery(newCustomer.name);
  };

  // Product logic - Add product from search results with stock validation
  const handleAddProductFromSearch = async (product) => {
    try {
      // Check real-time stock availability
      const stockCheck = await productsApiCall(`/api/products/${product.productId}`);
      
      if (stockCheck.stock <= 0) {
        alert(`${product.name} is out of stock!`);
        return;
      }

      const existingProductIndex = invoiceProducts.findIndex(p => p.productId === product.productId);
      
      if (existingProductIndex >= 0) {
        // If product already exists, increase quantity (with stock validation)
        const updated = [...invoiceProducts];
        const newQuantity = updated[existingProductIndex].quantity + 1;
        
        if (newQuantity > stockCheck.stock) {
          alert(`Cannot add more. Only ${stockCheck.stock} ${product.unit} available in stock.`);
          return;
        }
        
        updated[existingProductIndex].quantity = newQuantity;
        updated[existingProductIndex].total = updated[existingProductIndex].quantity * updated[existingProductIndex].sellingPrice;
        setInvoiceProducts(updated);
      } else {
        // Add new product
        const newProduct = {
          productId: product.productId,
          name: product.name,
          productCode: product.productCode,
          quantity: 1,
          unit: product.unit,
          sellingPrice: product.sellingPrice,
          availableStock: stockCheck.stock,
          total: product.sellingPrice
        };
        setInvoiceProducts([...invoiceProducts, newProduct]);
      }
      
      // Clear search after adding
      setProductSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Error checking stock availability. Please try again.');
    }
  };

  const handleRemoveProductRow = (idx) => {
    const updated = invoiceProducts.filter((_, index) => index !== idx);
    setInvoiceProducts(updated);
  };

  const handleProductChange = async (idx, field, value) => {
    const updated = [...invoiceProducts];
    const product = updated[idx];
    
    if (field === 'quantity') {
      // Validate stock availability in real-time
      try {
        const stockCheck = await productsApiCall(`/api/products/${product.productId}`);
        
        if (parseFloat(value) > stockCheck.stock) {
          alert(`Cannot set quantity to ${value}. Only ${stockCheck.stock} ${product.unit} available in stock.`);
          return;
        }
        
        updated[idx].availableStock = stockCheck.stock;
      } catch (error) {
        console.error('Error checking stock:', error);
        alert('Error validating stock. Please try again.');
        return;
      }
    }
    
    updated[idx][field] = value;
    
    // Recalculate total when quantity or selling price changes
    if (field === 'quantity' || field === 'sellingPrice') {
      updated[idx].total = (parseFloat(updated[idx].quantity) || 0) * (parseFloat(updated[idx].sellingPrice) || 0);
    }
    
    setInvoiceProducts(updated);
  };

  // Calculation logic
  const subtotal = invoiceProducts.reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);
  const grandTotal = subtotal - (parseFloat(discount) || 0) + (parseFloat(otherCost) || 0);
  const dueAmount = grandTotal - (parseFloat(amountPaid) || 0);

  // Print logic
  const [showPrint, setShowPrint] = useState(false);
  const handlePrint = () => {
    setShowPrint(true);
    setTimeout(() => {
      window.print();
      setShowPrint(false);
    }, 100);
  };

  return (
    <div className="invoice-container">
      {showPrint ? (
        <div className="print-invoice">
          <h2>Sales Invoice</h2>
          <div className="invoice-header">
            <div><strong>Invoice Date:</strong> {invoiceDate}</div>
          </div>
          {selectedCustomer && (
            <div className="customer-info">
              <div><strong>Name:</strong> {selectedCustomer.name}</div>
              <div><strong>Address:</strong> {selectedCustomer.address}</div>
              <div><strong>Phone:</strong> {selectedCustomer.phone}</div>
              <div><strong>Current Balance:</strong> ৳ {selectedCustomer.balance}</div>
            </div>
          )}
          <table className="product-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Unit</th>
                <th>Quantity</th>
                <th>Selling Price</th>
                <th>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoiceProducts.map((prod, idx) => (
                <tr key={idx}>
                  <td>{prod.name}</td>
                  <td>{prod.unit}</td>
                  <td>{prod.quantity}</td>
                  <td>৳{prod.sellingPrice.toLocaleString()}</td>
                  <td>৳{prod.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="calc-row">
            <div>Subtotal: <strong>৳ {subtotal}</strong></div>
            <div>Discount: <strong>৳ {discount}</strong></div>
            <div>Other Cost: <strong>৳ {otherCost}</strong></div>
            <div>Grand Total: <strong>৳ {grandTotal}</strong></div>
          </div>
          <div className="calc-row">
            <div>Amount Paid: <strong>৳ {amountPaid}</strong></div>
            <div>Payment Method: <strong>{paymentMethod}</strong></div>
            <div>Due Amount: <strong>৳ {dueAmount}</strong></div>
          </div>
        </div>
      ) : (
        <>
          <h2>Create New Sales Invoice</h2>
          {/* Step 1: Customer Details & Date */}
          <div className="invoice-section">
            <h3>Step 1: Customer Details & Invoice Date</h3>
            
            {/* Date Selection */}
            <div className="date-row">
              <label>
                <strong>Invoice Date:</strong>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={e => setInvoiceDate(e.target.value)}
                  className="date-input"
                />
              </label>
            </div>
            
            {/* Customer Selection */}
            <div className="customer-row">
              <input
                type="text"
                placeholder="Search customer by name or phone"
                value={customerQuery}
                onChange={e => { setCustomerQuery(e.target.value); setShowCustomerList(true); }}
                onFocus={() => setShowCustomerList(true)}
              />
              <button className="add-customer-btn" onClick={() => setShowAddCustomer(true)}>+ Add New Customer</button>
            </div>
            {showCustomerList && customerQuery && (
              <div className="customer-list">
                {filteredCustomers.map((c, idx) => (
                  <div key={idx} className="customer-item" onClick={() => handleCustomerSelect(c)}>
                    {c.name} ({c.phone})
                  </div>
                ))}
              </div>
            )}
            {selectedCustomer && (
              <div className="customer-info">
                <div><strong>Name:</strong> {selectedCustomer.name}</div>
                <div><strong>Address:</strong> {selectedCustomer.address}</div>
                <div><strong>Current Balance:</strong> ৳ {selectedCustomer.balance}</div>
              </div>
            )}
            {showAddCustomer && (
              <form className="add-customer-form" onSubmit={handleAddCustomer}>
                <input placeholder="Name" value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} required />
                <input placeholder="Phone" value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} required />
                <input placeholder="Address" value={newCustomer.address} onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })} required />
                <input placeholder="Opening Balance" type="number" value={newCustomer.balance} onChange={e => setNewCustomer({ ...newCustomer, balance: e.target.value })} />
                <button type="submit">Save</button>
                <button type="button" onClick={() => setShowAddCustomer(false)}>Cancel</button>
              </form>
            )}
          </div>
          
          {/* Step 2: Search and Add Products from Inventory */}
          <div className="invoice-section">
            <h3>Step 2: Search and Add Products from Inventory</h3>
            
            {/* Product Search */}
            <div className="product-search-section">
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search products by name, code, or category..."
                  value={productSearchQuery}
                  onChange={e => setProductSearchQuery(e.target.value)}
                  className="product-search-input"
                />
                <button 
                  className="search-toggle-btn" 
                  onClick={() => setShowProductSearch(!showProductSearch)}
                >
                  {showProductSearch ? 'Hide Search' : 'Show Search'}
                </button>
              </div>
              
              {/* Search Results */}
              {productSearchQuery.length >= 2 && (
                <div className="search-results">
                  {isSearching ? (
                    <div className="search-loading">
                      Searching products...
                      <span className="loading-spinner"></span>
                    </div>
                  ) : searchError ? (
                    <div className="error-message">
                      {searchError}
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="product-search-results">
                      <h4>Search Results ({searchResults.length} products found)</h4>
                      <div className="product-results-grid">
                        {searchResults.map((product) => (
                          <div key={product.productId} className="product-result-card">
                            <div className="product-result-info">
                              <div className="product-result-name">{product.name}</div>
                              <div className="product-result-code">Code: {product.productCode}</div>
                              <div className="product-result-details">
                                <span className="stock-info">Stock: {product.stock} {product.unit}</span>
                                <span className="price-info">Price: ৳{product.sellingPrice?.toLocaleString()}</span>
                                <span className="category-info">Category: {product.category?.name}</span>
                              </div>
                            </div>
                            <button 
                              className="add-to-invoice-btn"
                              onClick={() => handleAddProductFromSearch(product)}
                              disabled={product.stock <= 0}
                            >
                              {product.stock <= 0 ? 'Out of Stock' : 'Add to Invoice'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="no-search-results">
                      No products found matching "{productSearchQuery}"
                    </div>
                  )}
                </div>
              )}
              
              {productSearchQuery.length > 0 && productSearchQuery.length < 2 && (
                <div className="search-hint">Type at least 2 characters to search...</div>
              )}
            </div>
            
            {/* Selected Products Table */}
            {invoiceProducts.length > 0 && (
              <div className="selected-products">
                <h4>Selected Products for Invoice</h4>
                <table className="product-table">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Product Code</th>
                      <th>Unit</th>
                      <th>Available Stock</th>
                      <th>Quantity</th>
                      <th>Selling Price</th>
                      <th>Total Amount</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceProducts.map((prod, idx) => (
                      <tr key={idx}>
                        <td>{prod.name}</td>
                        <td>{prod.productCode}</td>
                        <td>{prod.unit}</td>
                        <td className="stock-cell">
                          {prod.availableStock} {prod.unit}
                        </td>
                        <td>
                          <input
                            type="number"
                            value={prod.quantity}
                            onChange={e => handleProductChange(idx, 'quantity', e.target.value)}
                            min="0.01"
                            max={prod.availableStock}
                            step="0.01"
                            className="quantity-input"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={prod.sellingPrice}
                            onChange={e => handleProductChange(idx, 'sellingPrice', e.target.value)}
                            min="0"
                            step="0.01"
                            className="price-input"
                          />
                        </td>
                        <td className="total-cell">৳{prod.total.toLocaleString()}</td>
                        <td>
                          <button 
                            className="remove-product-btn" 
                            onClick={() => handleRemoveProductRow(idx)}
                            title="Remove Product"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {/* Step 3: Final Calculation & Payment */}
          <div className="invoice-section">
            <h3>Step 3: Final Calculation & Payment</h3>
            <div className="calc-row">
              <div>Subtotal: <strong>৳ {subtotal}</strong></div>
              <div>
                Discount: <input type="number" value={discount} onChange={e => setDiscount(e.target.value)} min="0" />
              </div>
            </div>
            <div className="calc-row">
              <div>
                Other Cost (Labor/Transport): <input type="number" value={otherCost} onChange={e => setOtherCost(e.target.value)} min="0" />
              </div>
              <div>Grand Total: <strong>৳ {grandTotal}</strong></div>
            </div>
            <div className="calc-row">
              <div>
                Amount Paid: <input type="number" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} min="0" />
              </div>
              <div>
                Payment Method: <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                  {paymentMethods.map((m, idx) => <option key={idx} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="calc-row">
              <div>Due Amount: <strong>৳ {dueAmount}</strong></div>
            </div>
            <div className="invoice-actions">
              <button className="create-btn" onClick={handlePrint}>Create & Print Invoice</button>
              <button className="draft-btn">Save as Draft</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default SalesInvoice;
