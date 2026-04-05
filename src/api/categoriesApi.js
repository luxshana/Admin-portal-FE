import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const categoriesApi = createApi({
  reducerPath: 'categoriesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://food-order.cyclescentre.com/api',
    // baseUrl: 'http://127.0.0.1:8000/api',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('admin_token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Category', 'Product', 'Order'],
  endpoints: (builder) => ({
    getCategories: builder.query({
      query: () => '/categories',
      providesTags: ['Category'],
    }),
    getCategoryById: builder.query({
      query: (id) => `/categories/${id}`,
    }),
    getProducts: builder.query({
      query: () => '/products',
      providesTags: ['Product'],
    }),
    getProductsByCategory: builder.query({
      query: (category) => `/categories/${category}/products`,
    }),
    getUser: builder.query({
      query: () => '/get-user',
    }),
    getOrders: builder.query({
      query: () => '/orders',
      providesTags: ['Order'],
    }),
    getOrderById: builder.query({
      query: (id) => `/orders/${id}`,
      providesTags: ['Order'],
    }),
    getAllOrders: builder.query({
      query: () => '/orders',
    }),
    getDashboardStats: builder.query({
      query: () => '/dashboard',
    }),
    addCategory: builder.mutation({
      query: (newCategory) => ({
        url: '/categories',
        method: 'POST',
        body: newCategory,
      }),
      invalidatesTags: ['Category'],
    }),
    deleteCategory: builder.mutation({
      query: (id) => ({
        url: `/categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Category'],
    }),
    updateCategory: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/categories/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: ['Category'],
    }),
    addProduct: builder.mutation({
      query: (newProduct) => ({
        url: '/products',
        method: 'POST',
        body: newProduct,
      }),
      invalidatesTags: ['Product'],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Product'],
    }),
    updateProduct: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/products/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: ['Product'],
    }),
    updateOrder: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/orders/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: ['Order'],
      async onQueryStarted({ id, ...patch }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          categoriesApi.util.updateQueryData('getOrders', undefined, (draft) => {
            const orders = draft?.data || draft?.data_order_list?.data || (Array.isArray(draft) ? draft : draft?.orders || []);
            const order = orders.find((o) => o.id === id);
            if (order) {
              Object.assign(order, patch);
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
  }),
});

export const { 
  useGetCategoriesQuery, 
  useGetCategoryByIdQuery, 
  useGetProductsQuery, 
  useGetProductsByCategoryQuery, 
  useGetUserQuery, 
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useGetAllOrdersQuery,
  useAddCategoryMutation,
  useDeleteCategoryMutation,
  useUpdateCategoryMutation,
  useAddProductMutation,
  useDeleteProductMutation,
  useUpdateProductMutation,
  useUpdateOrderMutation,
  useGetDashboardStatsQuery
} = categoriesApi;
