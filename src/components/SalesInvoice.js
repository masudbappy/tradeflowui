import React, { useState, useEffect, useCallback } from 'react';
import './SalesInvoice.css';
import authService from '../services/authService';

const paymentMethods = ['Cash', 'Bank', 'Mobile Banking'];

function SalesInvoice() {
  // Step 1: Customer and Date
  const [customerQuery, setCustomerQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [customerSearchError, setCustomerSearchError] = useState(null);
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

  // Sale creation states
  const [saleResponse, setSaleResponse] = useState(null);
  const [isCreatingSale, setIsCreatingSale] = useState(false);
  const [saleError, setSaleError] = useState(null);

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

  // API call function for sales
  const salesApiCall = async (endpoint, options = {}) => {
    const url = `http://localhost:8081${endpoint}`;
    
    const config = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
      ...options,
    };

    console.log('Making Sales API call:', { url, config });

    const response = await fetch(url, config);
    
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorBody = await response.text();
        console.log('Error response body:', errorBody);
        if (errorBody) {
          errorMessage = `${errorMessage} - ${errorBody}`;
        }
      } catch (e) {
        // Ignore errors when trying to read error body
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  };

  // API call function for customers
  const customersApiCall = async (endpoint, options = {}) => {
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

  // Search customers with debouncing
  const searchCustomers = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setCustomerSearchResults([]);
      setCustomerSearchError(null);
      setShowCustomerList(false);
      return;
    }

    setIsSearchingCustomers(true);
    setCustomerSearchError(null);
    setShowCustomerList(true);

    try {
      const data = await customersApiCall(`/api/customers/search?q=${encodeURIComponent(query)}`);
      console.log('Customer search API response:', data);
      console.log('Response type:', typeof data);
      console.log('Is array:', Array.isArray(data));
      
      // Handle different possible response formats
      let customers = [];
      if (Array.isArray(data)) {
        customers = data;
      } else if (data && Array.isArray(data.content)) {
        // Paginated response
        customers = data.content;
      } else if (data && Array.isArray(data.data)) {
        // Response wrapped in data property
        customers = data.data;
      } else if (data && data.customers && Array.isArray(data.customers)) {
        // Response with customers property
        customers = data.customers;
      } else {
        console.warn('Unexpected response format:', data);
        customers = [];
      }
      
      console.log('Processed customers:', customers);
      setCustomerSearchResults(customers);
    } catch (error) {
      console.error('Error searching customers:', error);
      setCustomerSearchError('Failed to search customers. Please try again.');
      setCustomerSearchResults([]);
    } finally {
      setIsSearchingCustomers(false);
    }
  }, []);

  // Debounced customer search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchCustomers(customerQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [customerQuery, searchCustomers]);

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

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setCustomerQuery(customer.name);
    setShowCustomerList(false);
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

  // Create sale and print invoice
  const handleCreateAndPrint = async () => {
    // Validation
    if (!selectedCustomer) {
      alert('Please select a customer');
      return;
    }

    if (invoiceProducts.length === 0) {
      alert('Please add at least one product');
      return;
    }

    if (parseFloat(amountPaid) < 0) {
      alert('Amount paid cannot be negative');
      return;
    }

    try {
      setIsCreatingSale(true);
      setSaleError(null);

      // Prepare the sale payload according to your API specification
      const salePayload = {
        customer: {
          customerId: selectedCustomer.customerId || selectedCustomer.id,
          phone: selectedCustomer.phoneNumber || selectedCustomer.phone,
          address: selectedCustomer.address,
          dueAmount: parseFloat(selectedCustomer.dueAmount || selectedCustomer.balance || 0)
        },
        date: invoiceDate,
        products: invoiceProducts.map(product => ({
          productId: product.productId,
          productName: product.name,
          productCode: product.productCode,
          unit: product.unit,
          stock: product.availableStock,
          quantity: parseFloat(product.quantity),
          sellingPrice: parseFloat(product.sellingPrice),
          totalPrice: parseFloat(product.total)
        })),
        discount: parseFloat(discount) || 0,
        laborCost: parseFloat(otherCost) || 0,
        amountPaid: parseFloat(amountPaid) || 0,
        paymentMethod: paymentMethod
      };

      console.log('Creating sale with payload:', salePayload);

      // Create the sale
      const response = await salesApiCall('/api/sales', {
        body: JSON.stringify(salePayload)
      });

      console.log('Sale created successfully:', response);
      setSaleResponse(response);

      // Show success message
      alert(`Sale created successfully! Sale Code: ${response.saleCode}`);

      // Print the invoice
      setShowPrint(true);
      setTimeout(() => {
        window.print();
        setShowPrint(false);
        
        // Optional: Reset form after successful creation
        // resetForm();
      }, 500);

    } catch (error) {
      console.error('Error creating sale:', error);
      setSaleError(error.message);
      alert(`Failed to create sale: ${error.message}`);
    } finally {
      setIsCreatingSale(false);
    }
  };

  // Legacy print function (for draft functionality)
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
            <div><strong>Invoice Date:</strong> {saleResponse ? saleResponse.date : invoiceDate}</div>
            {saleResponse && (
              <>
                <div><strong>Sale Code:</strong> {saleResponse.saleCode}</div>
                <div><strong>Sale ID:</strong> {saleResponse.saleId}</div>
                <div><strong>Created:</strong> {new Date(saleResponse.createdAt).toLocaleString()}</div>
              </>
            )}
          </div>
          {selectedCustomer && (
            <div className="customer-info">
              <div><strong>Name:</strong> {saleResponse ? saleResponse.customerName : selectedCustomer.name}</div>
              <div><strong>Address:</strong> {selectedCustomer.address}</div>
              <div><strong>Phone:</strong> {selectedCustomer.phoneNumber || selectedCustomer.phone}</div>
              <div><strong>Due Amount:</strong> ৳ {(selectedCustomer.dueAmount || selectedCustomer.balance || 0).toLocaleString()}</div>
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
            <div>Subtotal: <strong>৳ {saleResponse ? (saleResponse.totalPrice - saleResponse.laborCost + saleResponse.discountAmount).toLocaleString() : subtotal.toLocaleString()}</strong></div>
            <div>Discount: <strong>৳ {saleResponse ? saleResponse.discountAmount.toLocaleString() : parseFloat(discount).toLocaleString()}</strong></div>
            <div>Labor Cost: <strong>৳ {saleResponse ? saleResponse.laborCost.toLocaleString() : parseFloat(otherCost).toLocaleString()}</strong></div>
            <div>Grand Total: <strong>৳ {saleResponse ? saleResponse.totalPrice.toLocaleString() : grandTotal.toLocaleString()}</strong></div>
          </div>
          <div className="calc-row">
            <div>Amount Paid: <strong>৳ {saleResponse ? saleResponse.paidAmount.toLocaleString() : parseFloat(amountPaid).toLocaleString()}</strong></div>
            <div>Payment Method: <strong>{saleResponse ? saleResponse.paymentMethod : paymentMethod}</strong></div>
            <div>Due Amount: <strong>৳ {saleResponse ? saleResponse.dueAmount.toLocaleString() : dueAmount.toLocaleString()}</strong></div>
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
                onChange={e => setCustomerQuery(e.target.value)}
                onFocus={() => customerQuery.length >= 2 && setShowCustomerList(true)}
              />
            </div>
            {showCustomerList && customerQuery && (
              <div className="customer-list">
                {isSearchingCustomers ? (
                  <div className="search-loading">
                    Searching customers...
                    <span className="loading-spinner"></span>
                  </div>
                ) : customerSearchError ? (
                  <div className="search-error">
                    {customerSearchError}
                  </div>
                ) : customerSearchResults.length > 0 ? (
                  customerSearchResults.map((customer, idx) => {
                    console.log('Rendering customer:', customer); // Debug log
                    return (
                      <div key={customer.customerId || customer.id || idx} className="customer-item" onClick={() => handleCustomerSelect(customer)}>
                        <div className="customer-info">
                          <strong>{customer.name || 'No Name'}</strong> ({customer.phoneNumber || customer.phone || 'No Phone'})
                          <div className="customer-details">
                            Address: {customer.address || 'No Address'} | Due: ৳{(customer.dueAmount || customer.balance || 0).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="no-results">
                    No customers found for "{customerQuery}"
                    {customerSearchResults.length === 0 && !isSearchingCustomers && !customerSearchError && (
                      <div style={{fontSize: '12px', color: '#666', marginTop: '5px'}}>
                        Debug: Results array is empty
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {selectedCustomer && (
              <div className="customer-info">
                <div><strong>Name:</strong> {selectedCustomer.name}</div>
                <div><strong>Phone:</strong> {selectedCustomer.phoneNumber}</div>
                <div><strong>Address:</strong> {selectedCustomer.address}</div>
                <div><strong>Due Amount:</strong> ৳ {selectedCustomer.dueAmount?.toLocaleString() || '0'}</div>
                {selectedCustomer.customerId && <div><strong>Customer ID:</strong> {selectedCustomer.customerId}</div>}
              </div>
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
                                <span className="price-info">Buying Price: ৳{product.buyingPrice?.toLocaleString()}</span>
                                <span className="type-info">Type: {product.typeEntity?.name}</span>
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
            {saleError && (
              <div className="error-message" style={{color: 'red', marginTop: '10px', padding: '10px', background: '#ffe6e6', border: '1px solid #ff9999', borderRadius: '4px'}}>
                <strong>Error creating sale:</strong> {saleError}
              </div>
            )}
            <div className="invoice-actions">
              <button 
                className="create-btn" 
                onClick={handleCreateAndPrint}
                disabled={isCreatingSale}
              >
                {isCreatingSale ? 'Creating Sale...' : 'Create & Print Invoice'}
              </button>
              <button className="draft-btn" onClick={handlePrint}>Print Draft</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default SalesInvoice;
