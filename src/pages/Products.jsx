import React, { useState } from 'react';
import Header from '../components/Header';
import { Plus, Search, Edit2, Trash2, Filter, X, Image as ImageIcon, DollarSign, FileText, FolderTree, Trash, Download, Upload, Loader } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useGetProductsQuery, useAddProductMutation, useGetCategoriesQuery, useDeleteProductMutation, useUpdateProductMutation } from '../api/categoriesApi';

const Products = () => {
  const { data = [], isLoading, isError } = useGetProductsQuery();
  const { data: categoriesData = [] } = useGetCategoriesQuery();
  const [addProduct] = useAddProductMutation();
  const [deleteProduct] = useDeleteProductMutation();
  
  const productsList = data.data || data || [];
  const products = Array.isArray(productsList) ? productsList : [];
  
  const categoriesList = categoriesData.data || categoriesData || [];
  const categories = Array.isArray(categoriesList) ? categoriesList : [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProductId, setCurrentProductId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    price: '',
    image: '',
    description: '',
    status: 'Active'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [updateProduct] = useUpdateProductMutation();

  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleExportExcel = () => {
    const wsData = products.map(prod => ({
      ID: prod.id,
      Name: prod.name,
      Category_ID: prod.category_id,
      Price: prod.price,
      Image: prod.image,
      Description: prod.description,
      Status: prod.status
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, "Products.xlsx");
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg('');
    setUploadProgress(0);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const parsedData = XLSX.utils.sheet_to_json(ws);

        let successCount = 0;
        let errorCount = 0;
        let firstError = '';

        for (let i = 0; i < parsedData.length; i++) {
          const row = parsedData[i];
          const getName = () => row.Name !== undefined ? row.Name : (row.name !== undefined ? row.name : '');
          const getCategoryId = () => row.Category_ID !== undefined ? row.Category_ID : (row.category_id !== undefined ? row.category_id : '');
          const getPrice = () => row.Price !== undefined ? row.Price : (row.price !== undefined ? row.price : '');
          const getImage = () => row.Image !== undefined ? row.Image : (row.image !== undefined ? row.image : '');
          const getDescription = () => row.Description !== undefined ? row.Description : (row.description !== undefined ? row.description : '');
          const getStatus = () => row.Status !== undefined ? row.Status : (row.status !== undefined ? row.status : 'Active');
          const getId = () => row.ID !== undefined ? row.ID : (row.id !== undefined ? row.id : null);

          const payload = {
            name: getName(),
            category_id: getCategoryId(),
            price: getPrice(),
            image: getImage(),
            description: getDescription(),
            status: getStatus()
          };
          
          if (!payload.name || !payload.category_id || payload.price === '') {
            errorCount++;
            if (!firstError) firstError = `Row ${i + 1} is missing Name, Category_ID, or Price.`;
            continue;
          }

          // Validate if the category actually exists in our system right now
          const categoryExists = categories.some(cat => String(cat.id) === String(payload.category_id));
          if (!categoryExists) {
            errorCount++;
            if (!firstError) {
              firstError = `Row ${i + 1} has Category_ID '${payload.category_id}', but this Category ID does not exist in your current Categories list. You must create the category first and update the Excel file with the correct new Category ID.`;
            }
            continue;
          }

          try {
            const prodId = getId();
            if (prodId) {
              try {
                await updateProduct({ id: prodId, ...payload }).unwrap();
              } catch (updateErr) {
                if (updateErr.status === 404 || (updateErr.data?.message && updateErr.data.message.includes('No query results'))) {
                  await addProduct(payload).unwrap();
                } else {
                  throw updateErr;
                }
              }
            } else {
              await addProduct(payload).unwrap();
            }
            successCount++;
          } catch (err) {
            console.error('Failed to process product:', row, err);
            errorCount++;
            if (!firstError) {
              firstError = err.data?.message || err.data?.error || err.error || err.status || 'API Error';
            }
          }
          await new Promise(resolve => setTimeout(resolve, 300));
          setUploadProgress(Math.round(((i + 1) / parsedData.length) * 100));
        }
        
        if (errorCount > 0) {
          setErrorMsg(`Upload completed: ${successCount} successful, ${errorCount} failed. Details: ${firstError}`);
        } else {
          setErrorMsg('');
        }
      } catch (err) {
        console.error('Error reading excel file:', err);
        setErrorMsg('Invalid Excel file format.');
      } finally {
        setIsUploading(false);
        e.target.value = null;
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleClearAll = async () => {
    setIsClearAllModalOpen(false);
    setIsUploading(true);
    setErrorMsg('');
    setUploadProgress(0);
    
    let successCount = 0;
    let errorCount = 0;
    let firstError = '';
    
    if (!products || products.length === 0) {
      setIsUploading(false);
      return;
    }
    
    for (let i = 0; i < products.length; i++) {
      try {
        await deleteProduct(products[i].id).unwrap();
        successCount++;
      } catch (err) {
        console.error('Failed to delete product:', products[i].id, err);
        errorCount++;
        if (!firstError) {
          firstError = err.data?.message || err.data?.error || err.error || err.status || 'API Error';
        }
      }
      setUploadProgress(Math.round(((i + 1) / products.length) * 100));
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    if (errorCount > 0) {
      setErrorMsg(`Clear completed: ${successCount} successful, ${errorCount} failed. Details: ${firstError}`);
    } else {
      setErrorMsg('');
    }
    
    setTimeout(() => setIsUploading(false), 500);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      if (isEditing) {
        await updateProduct({ id: currentProductId, ...formData }).unwrap();
      } else {
        await addProduct(formData).unwrap();
      }
      resetForm();
    } catch (err) {
      console.error('Failed to save product:', err);
      setErrorMsg(err.data?.message || 'Failed to save product. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (product) => {
    setIsEditing(true);
    setCurrentProductId(product.id);
    setFormData({
      name: product.name || '',
      category_id: product.category_id || '',
      price: product.price || '',
      image: product.image || '',
      description: product.description || '',
      status: product.status || 'Active'
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setIsClearAllModalOpen(false);
    setCurrentProductId(null);
    setFormData({
      name: '',
      category_id: '',
      price: '',
      image: '',
      description: '',
      status: 'Active'
    });
    setErrorMsg('');
  };

  const handleDelete = (id) => {
    setProductToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct(productToDelete).unwrap();
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    } catch (err) {
      console.error('Failed to delete product:', err);
    }
  };

  return (
    <div className="animate-fade-in" style={{ position: 'relative' }}>
      <Header title="Menu Management" />

      {/* Upload Progress */}
      {isUploading && (
        <div className="glass" style={{ padding: '1rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: '500' }}>Processing...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'var(--primary)', transition: 'width 0.3s ease' }} />
          </div>
        </div>
      )}

      {/* Global Error message above toolbar */}
      {errorMsg && !isModalOpen && !isSubmitting && (
        <div className="glass" style={{ padding: '1rem', marginBottom: '1rem', color: '#f87171', borderLeft: '4px solid #f87171' }}>
          {errorMsg}
        </div>
      )}

      {/* Toolbar */}
      <div className="page-toolbar">
        <div className="toolbar-left">
          <div className="glass search-bar">
            <Search size={17} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <input type="text" placeholder="Search products…" />
          </div>
          <button className="btn-icon glass">
            <Filter size={18} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn-secondary" style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.5)' }} onClick={() => setIsClearAllModalOpen(true)} disabled={isUploading || isLoading || products.length === 0}>
            <Trash2 size={18} /> Clear All
          </button>
          <button className="btn-secondary" onClick={handleExportExcel} disabled={isUploading || isLoading}>
            <Download size={18} /> Export
          </button>
          <label className="btn-secondary" style={{ cursor: isUploading || isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: isUploading || isLoading ? 0.7 : 1 }}>
            <Upload size={18} /> Import
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              style={{ display: 'none' }} 
              onChange={handleImportExcel}
              disabled={isUploading || isLoading}
            />
          </label>
          <button className="btn-primary" onClick={() => { setIsEditing(false); setIsModalOpen(true); }} disabled={isUploading || isLoading}>
            <Plus size={18} /> Add Product
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass" style={{ overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table className="responsive-table">
            <thead>
              <tr>
                <th>Product</th>
                <th className="col-hide-mobile">Category</th>
                <th>Price</th>
                <th className="col-hide-mobile">Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Loading products...</td>
                </tr>
              ) : products.length > 0 ? (
                products.map(product => (
                  <tr key={product.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img
                          src={product.image || 'https://via.placeholder.com/36?text=' + product.name}
                          alt={product.name}
                          style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem', objectFit: 'cover', flexShrink: 0 }}
                        />
                        <span style={{ fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '10rem' }}>
                          {product.name}
                        </span>
                      </div>
                    </td>
                    <td className="col-hide-mobile" style={{ color: 'var(--text-muted)' }}>
                      <span>{product.category?.name || 'Uncategorized'}</span>
                    </td>
                    <td style={{ color: '#fff', fontWeight: 600 }}>${product.price}</td>
                    <td className="col-hide-mobile">
                      <span className={`badge ${product.status === 'Active' ? 'badge-green' : 'badge-red'}`}>
                        {product.status || 'Active'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
                        <button 
                          className="btn-icon" 
                          style={{ color: 'var(--text-muted)' }}
                          onClick={() => handleEdit(product)}
                        ><Edit2 size={15} /></button>
                        <button 
                          className="btn-icon" 
                          style={{ color: 'var(--text-muted)' }}
                          onClick={() => handleDelete(product.id)}
                        ><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content glass animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
              <button className="btn-icon" onClick={resetForm}>
                <X size={20} />
              </button>
            </div>
            
            {errorMsg && (
              <div style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '1.5rem', padding: '0.75rem', background: 'rgba(248, 113, 113, 0.1)', borderRadius: '0.5rem', border: '1px solid rgba(248, 113, 113, 0.2)' }}>
                {errorMsg}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label><FolderTree size={16} /> Category</label>
                  <select 
                    name="category_id" 
                    value={formData.category_id} 
                    onChange={handleInputChange} 
                    required
                    className="glass-input"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label><FileText size={16} /> Product Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    placeholder="e.g. Chicken Burger" 
                    required 
                    className="glass-input"
                  />
                </div>

                <div className="form-group">
                  <label><DollarSign size={16} /> Price</label>
                  <input 
                    type="number" 
                    name="price" 
                    value={formData.price} 
                    onChange={handleInputChange} 
                    placeholder="0.00" 
                    required 
                    className="glass-input"
                  />
                </div>

                <div className="form-group">
                  <label><ImageIcon size={16} /> Image URL</label>
                  <input 
                    type="text" 
                    name="image" 
                    value={formData.image} 
                    onChange={handleInputChange} 
                    placeholder="https://..." 
                    className="glass-input"
                  />
                </div>

                <div className="form-group">
                  <label><Filter size={16} /> Status</label>
                  <select 
                    name="status" 
                    value={formData.status} 
                    onChange={handleInputChange} 
                    className="glass-input"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label><FileText size={16} /> Description</label>
                  <textarea 
                    name="description" 
                    value={formData.description} 
                    onChange={handleInputChange} 
                    placeholder="Describe your product..." 
                    rows="3"
                    className="glass-input"
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update Product' : 'Add Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="modal-content glass animate-scale-in" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Delete</h2>
              <button className="btn-icon" onClick={() => setIsDeleteModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ margin: '1rem 0 2rem 0' }}>
              <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
                Are you sure you want to delete this product? This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
              <button 
                className="btn-primary" 
                style={{ background: '#ef4444' }} 
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {isClearAllModalOpen && (
        <div className="modal-overlay">
          <div className="glass modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, color: '#ef4444' }}>Clear All Products</h3>
              <button className="btn-icon" onClick={resetForm}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#cbd5e1', lineHeight: 1.6 }}>
                Are you absolutely sure you want to delete ALL products? This will remove <strong>{products.length}</strong> items. This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={resetForm}>Cancel</button>
              <button 
                className="btn-primary" 
                style={{ background: '#ef4444' }} 
                onClick={handleClearAll}
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1.5rem;
        }
        .modal-content {
          width: 100%;
          max-width: 600px;
          background: rgba(30, 30, 40, 0.8) !important;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 1.5rem;
          padding: 2rem;
          color: #fff;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        .modal-header h2 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #fff 0%, #aab 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .modal-form .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .form-group.full-width {
          grid-column: span 2;
        }
        .form-group label {
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .glass-input {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.75rem;
          padding: 0.75rem 1rem;
          color: #fff;
          font-size: 0.95rem;
          transition: all 0.2s ease;
        }
        .glass-input:focus {
          outline: none;
          background: rgba(255, 255, 255, 0.08);
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        select.glass-input option {
          background: #1e1e28;
          color: #fff;
        }
        
        /* Responsiveness */
        @media (max-width: 768px) {
          .page-toolbar {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
          }
          .toolbar-left {
            width: 100%;
          }
          .search-bar {
            width: 100%;
          }
        }

        @media (max-width: 640px) {
          .modal-form .form-grid {
            grid-template-columns: 1fr;
          }
          .form-group.full-width {
            grid-column: span 1;
          }
          .col-hide-mobile {
            display: none;
          }
          .modal-content {
            padding: 1.5rem;
            margin: 1rem;
          }
        }
      `}} />
    </div>
  );
};

export default Products;
