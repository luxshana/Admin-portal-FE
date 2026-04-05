import React, { useState } from 'react';
import Header from '../components/Header';
import { Plus, Search, Edit2, Trash2, Filter, Loader, X, Trash, Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  useGetCategoriesQuery, 
  useGetProductsQuery,
  useAddCategoryMutation, 
  useDeleteCategoryMutation, 
  useUpdateCategoryMutation 
} from '../api/categoriesApi';

const Categories = () => {
  const { data = [], isLoading, isError } = useGetCategoriesQuery();
  const { data: productsData = [] } = useGetProductsQuery();
  const [addCategory, { isLoading: isAdding }] = useAddCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  
  const categories = data.data || data || [];
  const allProducts = productsData.data || productsData || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    image: '',
    description: '',
    status: 'Active'
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleExportExcel = () => {
    const wsData = categories.map(cat => ({
      ID: cat.id,
      Name: cat.name,
      Image: cat.image,
      Description: cat.description,
      Status: cat.status
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Categories");
    XLSX.writeFile(wb, "Categories.xlsx");
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
        const data = XLSX.utils.sheet_to_json(ws);

        let successCount = 0;
        let errorCount = 0;
        let firstError = '';

        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          // Try to get values regardless of casing (e.g. Name, name, NAME)
          const getName = () => row.Name !== undefined ? row.Name : (row.name !== undefined ? row.name : '');
          const getImage = () => row.Image !== undefined ? row.Image : (row.image !== undefined ? row.image : '');
          const getDescription = () => row.Description !== undefined ? row.Description : (row.description !== undefined ? row.description : '');
          const getStatus = () => row.Status !== undefined ? row.Status : (row.status !== undefined ? row.status : 'Active');
          const getId = () => row.ID !== undefined ? row.ID : (row.id !== undefined ? row.id : null);

          const payload = {
            name: getName(),
            image: getImage(),
            description: getDescription(),
            status: getStatus()
          };
          
          if (!payload.name) {
            errorCount++;
            if (!firstError) firstError = `Row ${i + 1} is missing a Name.`;
            continue;
          }

          try {
            const catId = getId();
            if (catId) {
              try {
                await updateCategory({ id: catId, ...payload }).unwrap();
              } catch (updateErr) {
                if (updateErr.status === 404 || (updateErr.data?.message && updateErr.data.message.includes('No query results'))) {
                  // The ID doesn't exist anymore (e.g., deleted), so we create it as a new category
                  await addCategory(payload).unwrap();
                } else {
                  throw updateErr;
                }
              }
            } else {
              await addCategory(payload).unwrap();
            }
            successCount++;
          } catch (err) {
            console.error('Failed to process category:', row, err);
            errorCount++;
            if (!firstError) {
              const errMsg = err.data?.message || err.data?.error || err.error || err.status || 'API Error';
              firstError = `Row ${i + 1} error: ${errMsg}`;
            }
          }
          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 300));
          setUploadProgress(Math.round(((i + 1) / data.length) * 100));
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (cat) => {
    setIsEditing(true);
    setCurrentId(cat.id);
    setFormData({
      name: cat.name || '',
      image: cat.image || '',
      description: cat.description || '',
      status: cat.status || 'Active'
    });
    setImagePreview(cat.image || null);
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const confirmDelete = (cat) => {
    setCurrentId(cat.id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await deleteCategory(currentId).unwrap();
      setIsDeleteModalOpen(false);
      setCurrentId(null);
    } catch (err) {
      console.error('Failed to delete category:', err);
      setErrorMsg(err.data?.message || 'Failed to delete category. Please try again.');
    }
  };

  const handleClearAll = async () => {
    setIsClearAllModalOpen(false);
    setIsUploading(true);
    setErrorMsg('');
    setUploadProgress(0);
    
    let successCount = 0;
    let errorCount = 0;
    
    if (!categories || categories.length === 0) {
      setIsUploading(false);
      return;
    }
    
    for (let i = 0; i < categories.length; i++) {
      try {
        await deleteCategory(categories[i].id).unwrap();
        successCount++;
      } catch (err) {
        console.error('Failed to delete category:', categories[i].id, err);
        errorCount++;
      }
      setUploadProgress(Math.round(((i + 1) / categories.length) * 100));
    }
    
    if (errorCount > 0) {
      setErrorMsg(`Clear completed: ${successCount} successful, ${errorCount} failed.`);
    } else {
      setErrorMsg('');
    }
    
    setTimeout(() => setIsUploading(false), 500);
  };

  const resetForm = () => {
    setIsModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsClearAllModalOpen(false);
    setIsEditing(false);
    setCurrentId(null);
    setFormData({ name: '', image: '', description: '', status: 'Active' });
    setSelectedFile(null);
    setImagePreview(null);
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!formData.name.trim()) {
      setErrorMsg('Category name is required');
      return;
    }

    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('description', formData.description || '');
    submitData.append('status', formData.status);
    
    if (selectedFile) {
      submitData.append('image', selectedFile);
    } else if (formData.image) {
      // If no new file is selected, but we have an image URL/path (existing)
      submitData.append('image', formData.image);
    }

    // Add _method for PUT spoofing in Laravel
    if (isEditing) {
      submitData.append('_method', 'PUT');
    }

    try {
      if (isEditing) {
        await updateCategory({ id: currentId, formData: submitData }).unwrap();
      } else {
        await addCategory(submitData).unwrap();
      }
      resetForm();
    } catch (err) {
      console.error('Failed to save category:', err);
      const detailedError = err.data?.error ? ` (${err.data.error})` : '';
      setErrorMsg(err.data?.message ? `${err.data.message}${detailedError}` : 'Failed to save category. Please try again.');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="animate-fade-in">
      <Header title="Category Management" />

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
      {errorMsg && !isModalOpen && (
        <div className="glass" style={{ padding: '1rem', marginBottom: '1rem', color: '#f87171', borderLeft: '4px solid #f87171' }}>
          {errorMsg}
        </div>
      )}

      {/* Toolbar */}
      <div className="page-toolbar">
        <div className="toolbar-left">
          <div className="glass search-bar">
            <Search size={17} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <input type="text" placeholder="Search categories…" />
          </div>
          <button className="btn-icon glass">
            <Filter size={18} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn-secondary" style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.5)' }} onClick={() => setIsClearAllModalOpen(true)} disabled={isUploading || isLoading || categories.length === 0}>
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
            <Plus size={18} /> Add Category
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', color: 'var(--text-muted)' }}>
          <Loader size={24} className="animate-spin" style={{ marginRight: '0.75rem' }} />
          Loading categories...
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="glass" style={{ padding: '1.5rem', color: '#f87171', borderLeft: '4px solid #f87171' }}>
          <p>Failed to load categories. Please try again.</p>
        </div>
      )}

      {/* Table */}
      {!isLoading && !isError && (
        <div className="glass" style={{ overflow: 'hidden' }}>
          <div className="table-wrapper">
            <table className="responsive-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th className="col-sm">Description</th>
                  <th>Products</th>
                  <th className="col-sm">Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories && categories.length > 0 ? (
                  categories.map(cat => (
                    <tr key={cat.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <img
                            src={cat.image || 'https://via.placeholder.com/36?text=' + cat.name}
                            alt={cat.name}
                            style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem', objectFit: 'cover', flexShrink: 0 }}
                          />
                          <span style={{ fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '10rem' }}>
                            {cat.name}
                          </span>
                        </div>
                      </td>
                      <td className="col-sm" style={{ color: 'var(--text-muted)', maxWidth: '16rem' }}>
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {cat.description || 'N/A'}
                        </span>
                      </td>
                      <td style={{ color: '#fff', fontSize: '0.85rem', maxWidth: '12rem' }}>
                        {allProducts.filter(p => String(p.category_id) === String(cat.id)).length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', color: 'var(--text-muted)' }}>
                            {allProducts
                              .filter(p => String(p.category_id) === String(cat.id))
                              .map((p, index, array) => (
                                <span key={p.id} style={{ color: '#fff', fontWeight: 500 }}>
                                  {p.name}{index < array.length - 1 ? ',' : ''}
                                </span>
                              ))}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>No products</span>
                        )}
                      </td>
                      <td className="col-sm">
                        <span className={`badge ${cat.status === 'Active' ? 'badge-green' : 'badge-red'}`}>
                          {cat.status || 'Inactive'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
                          <button
                            className="btn-icon"
                            style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                            onClick={() => handleEdit(cat)}
                          ><Edit2 size={15} /></button>
                          <button
                            className="btn-icon"
                            style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                            onClick={() => confirmDelete(cat)}
                          ><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No categories found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="glass modal-content">
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>{isEditing ? 'Edit Category' : 'Add New Category'}</h3>
              <button className="btn-icon" onClick={resetForm}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {errorMsg && (
                  <div style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem', padding: '0.75rem', background: 'rgba(248, 113, 113, 0.1)', borderRadius: '0.5rem', border: '1px solid rgba(248, 113, 113, 0.2)' }}>
                    {errorMsg}
                  </div>
                )}
                
                <div className="form-group">
                  <label className="form-label">Category Name</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    placeholder="e.g. Pizza, Burger"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category Image</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {imagePreview && (
                      <div style={{ position: 'relative', width: '100%', height: '150px', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                        <button 
                          type="button"
                          onClick={() => { setSelectedFile(null); setImagePreview(null); }}
                          style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', padding: '0.25rem', color: '#fff', cursor: 'pointer' }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                    <label className="btn-secondary" style={{ width: '100%', cursor: 'pointer', textAlign: 'center', justifyContent: 'center' }}>
                      <Upload size={18} /> {imagePreview ? 'Change Image' : 'Upload Image'}
                      <input 
                        type="file" 
                        accept="image/*" 
                        style={{ display: 'none' }} 
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description (Optional)</label>
                  <textarea
                    name="description"
                    className="form-control"
                    placeholder="Brief description of the category..."
                    rows="3"
                    style={{ resize: 'none' }}
                    value={formData.description}
                    onChange={handleInputChange}
                  ></textarea>
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    name="status"
                    className="form-control"
                    value={formData.status}
                    onChange={handleInputChange}
                    style={{ background: 'rgba(15, 23, 42, 0.5)' }}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isAdding || isUpdating}>
                  {isAdding || isUpdating ? (
                    <>
                      <Loader size={16} className="animate-spin" style={{ marginRight: '0.5rem' }} />
                      {isEditing ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    isEditing ? 'Update Category' : 'Add Category'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="glass modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Delete Category</h3>
              <button className="btn-icon" onClick={resetForm}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#cbd5e1', lineHeight: 1.6 }}>
                Are you sure you want to delete this category? This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={resetForm}>Cancel</button>
              <button 
                className="btn-primary" 
                style={{ background: '#ef4444' }} 
                onClick={handleDelete}
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
              <h3 style={{ margin: 0, color: '#ef4444' }}>Clear All Categories</h3>
              <button className="btn-icon" onClick={resetForm}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#cbd5e1', lineHeight: 1.6 }}>
                Are you absolutely sure you want to delete ALL categories? This will remove <strong>{categories.length}</strong> items. This action cannot be undone.
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
    </div>
  );
};

export default Categories;
