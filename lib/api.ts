import { Product, ProductSearchParams, PaginatedResponse, ApiResponse, DashboardStats } from './types'

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://54.169.154.143:3470'
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
}

// Function to transform API response to expected format
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...DEFAULT_HEADERS,
      ...(options.headers || {}),
    },
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new ApiError(`API error: ${res.statusText}`, res.status)
  }
  return res.json()
}
// Transform API response
function transformApiResponse(rawData: any): Product[] {
  if (Array.isArray(rawData)) return rawData
  if (rawData && Array.isArray(rawData.products)) return rawData.products
  return []
}

// Product API functions
export const productApi = {
  getProducts: async (params: ProductSearchParams = {}): Promise<PaginatedResponse<Product>> => {
    try {
      const query = buildQueryString(params)
      const rawData = await apiRequest<any>(`/ecommerce-products${query ? `?${query}` : ''}`)
      const products = transformApiResponse(rawData)

      const page = params.page || 1
      const limit = params.limit || 20
      const total = products.length
      const totalPages = Math.ceil(total / limit)
      const paginated = products.slice((page - 1) * limit, page * limit)

      return {
        data: paginated,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        success: true,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error loading products:', error)
      return {
        data: [],
        pagination: {
          page: params.page || 1,
          limit: params.limit || 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        },
        success: false,
        timestamp: new Date().toISOString()
      }
    }
  },
  // Create product
  createProduct: async (
    productData: Partial<Product>
  ): Promise<ApiResponse<Product>> => {
    try {
      const created = await apiRequest<any>(`/ecommerce-products`, {
        method: 'POST',
        body: JSON.stringify(productData),
      })
      return {
        data: created as Product,
        success: true,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      console.error('Error creating product:', error)
      throw handleApiError(error)
    }
  },
  // Get single product by ID
  getProduct: async (id: string): Promise<ApiResponse<Product>> => {
    try {
      const rawData = await apiRequest<any>(`/ecommerce-products/${id}`)
      const product = rawData
      if (!product) throw new Error('Product not found')
      return {
        data: product,
        success: true,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error(`Error loading product ${id}:`, error)
      throw new Error(`Product with ID ${id} not found`)
    }
  },

  // Search products
  searchProducts: async (query: string, filters: Partial<ProductSearchParams> = {}): Promise<PaginatedResponse<Product>> => {
    return productApi.getProducts({ q: query, ...filters })
  },

  // Get products by category
  getProductsByCategory: async (category: string, params: Partial<ProductSearchParams> = {}): Promise<PaginatedResponse<Product>> => {
    return productApi.getProducts({ category, ...params })
  },

  // Get featured products
  getFeaturedProducts: async (limit: number = 8): Promise<ApiResponse<Product[]>> => {
    try {
      const rawData = await apiRequest<any>(`/ecommerce-products?featured=true&limit=${limit}`)
      const products = transformApiResponse(rawData)
      
      return {
        data: products.slice(0, limit),
        success: true,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error loading featured products:', error)
      return {
        data: [],
        success: false,
        timestamp: new Date().toISOString()
      }
    }
  },

  // Get related products
  getRelatedProducts: async (productId: string, limit: number = 4): Promise<ApiResponse<Product[]>> => {
    try {
      const rawData = await apiRequest<any>(`/ecommerce-products?related=${productId}&limit=${limit}`)
      const products = transformApiResponse(rawData)
      
      return {
        data: products.slice(0, limit),
        success: true,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error loading related products:', error)
      return {
        data: [],
        success: false,
        timestamp: new Date().toISOString()
      }
    }
  }
}

// Dashboard API functions
export const dashboardApi = {
  // Get dashboard statistics
  getStats: async (): Promise<ApiResponse<DashboardStats>> => {
    return apiRequest<ApiResponse<DashboardStats>>('/dashboard/stats')
  },

  // Get category statistics
  getCategoryStats: async (): Promise<ApiResponse<any[]>> => {
    return apiRequest<ApiResponse<any[]>>('/dashboard/categories')
  }
}




// Export the API to use (use productApi only)
export const api = productApi

// Export individual functions for convenience
export const getProducts = api.getProducts
export const getProductById = api.getProduct
export const searchProducts = api.searchProducts
export const getProductsByCategory = api.getProductsByCategory
export const getDashboardStats = dashboardApi.getStats
export const createProduct = api.createProduct

// Orders API functions
export const getOrders = async () => {
  try {
    const orders = await apiRequest<any[]>('/ecommerce-orders')
    // ตรวจสอบว่าข้อมูลที่ได้รับเป็น array หรือไม่
    const validOrders = Array.isArray(orders) ? orders : []
    return {
      data: validOrders,
      success: true,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error loading orders:', error)
    return {
      data: [],
      success: false,
      timestamp: new Date().toISOString()
    }
  }
}

// Utility functions
export const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value))
    }
  })
  
  return searchParams.toString()
}

export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Error handling utilities
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export const handleApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) {
    return error
  }
  
  if (error instanceof Error) {
    return new ApiError(error.message)
  }
  
  return new ApiError('An unknown error occurred')
}

// Orders API
export const createOrder = async (payload: any): Promise<{ success: boolean; id?: string | number }> => {
  const res = await fetch(`${API_BASE_URL}/ecommerce-orders`, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    throw new ApiError(`API error: ${res.statusText}`, res.status)
  }
  const data = await res.json().catch(() => ({}))
  return { success: true, id: (data && (data.id || data.orderId)) as any }
}

// Update single product stock (absolute value)
export const updateProductStock = async (productId: string | number, stock: number): Promise<void> => {
  // ใช้วิธี UPDATE (PUT ทั้งอ็อบเจ็กต์) แทนการลด stock แบบ delta
  const pid = typeof productId === 'string' ? Number(productId) : productId
  // 1) อ่านข้อมูลสินค้าล่าสุด
  const full = await apiRequest<any>(`/ecommerce-products/${pid}`)
  // 2) รวมค่า stock ใหม่ แล้วส่ง PUT ทั้งอ็อบเจ็กต์
  const merged = { ...full, id: pid, stock }
  const res = await fetch(`${API_BASE_URL}/ecommerce-products/${pid}`, {
    method: 'PUT',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(merged),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new ApiError(`Failed to update product ${pid}: ${res.status} ${res.statusText} ${text}`)
  }
}

// Batch update helper (best-effort)
export const batchUpdateProductStocks = async (updates: Array<{ id: string | number; stock: number }>): Promise<void> => {
  const tasks = updates.map(u => updateProductStock(u.id, u.stock))
  await Promise.allSettled(tasks)
}