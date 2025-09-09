'use client'

import { useCart } from '@/components/providers/CartProvider'
import CartItem from '@/components/cart/CartItem'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { formatTHB } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { db } from '@/lib/db'
import { useEffect } from 'react'
import { syncOrders } from '@/lib/sync'
import { ShoppingCart, ArrowLeft } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { createOrder, batchUpdateProductStocks, getProducts, getProductById, updateProductStock } from '@/lib/api'

export default function CartPage() {
  const { items, totalItems, totalPrice, clearCart } = useCart()
  const router = useRouter()
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderError, setOrderError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    // ลอง sync ตอน mount
    syncOrders()

    // ถ้าเน็ตกลับมา → sync อีกที
    window.addEventListener('online', syncOrders)
    return () => {
      window.removeEventListener('online', syncOrders)
    }
  }, [])

  // ฟังก์ชันสั่งซื้อแบบ offline-first (เก็บ queue ออเดอร์ใน IndexedDB)
  const handleOrder = async () => {
  setOrderError(null)
  try {
    const order = {
      items,
      total: totalPrice,
      createdAt: new Date().toISOString(),
      synced: 0
    }
    await db.orders.add(order)

    // ลอง sync ทันที ถ้ามีเน็ต
    await syncOrders()

    // ยิงไปเซิร์ฟเวอร์ทันที (ถ้าออนไลน์) เพื่อบันทึกออเดอร์
    try {
      await createOrder({ items, total: totalPrice, createdAt: new Date().toISOString() })
      // ดึงสินค้าจากแคชปัจจุบัน แล้วคำนวณ stock ใหม่เพื่ออัพเดตไปเซิร์ฟเวอร์
      const productsCache: any = queryClient.getQueryData(['products'])
      const listFromCache: any[] = Array.isArray(productsCache) ? productsCache : Array.isArray(productsCache?.data) ? productsCache.data : []
      if (listFromCache && listFromCache.length) {
        const deductionById = items.reduce<Record<string, number>>((acc, item: any) => {
          const productId = (item.product?.id ?? item.productId)?.toString()
          if (productId) acc[productId] = (acc[productId] || 0) + (item.quantity || 0)
          return acc
        }, {})
        const idsNeedingUpdate = Object.keys(deductionById)
        if (idsNeedingUpdate.length) {
          // อัปเดตแบบทีละรายการเพื่อให้ไม่พลาดสินค้าที่อยู่นอกหน้าแรกของ pagination
          const tasks = idsNeedingUpdate.map(async (idStr) => {
            try {
              const res = await getProductById(idStr)
              const current = Number(res.data.stock || 0)
              const dec = deductionById[idStr] || 0
              const nextStock = Math.max(0, current - dec)
              await updateProductStock(res.data.id, nextStock)
            } catch (_) {
              // ข้ามตัวที่ล้มเหลว
            }
          })
          await Promise.allSettled(tasks)
          // รีเฟรชสินค้าให้แคชอัพเดตจากเซิร์ฟเวอร์
          await queryClient.invalidateQueries({ queryKey: ['products'] })
        }
      }
    } catch (e) {
      // ถ้า fail จะยังคงคิวไว้ให้ sync ภายหลัง
      console.warn('Create order or stock update API failed, will retry via sync later')
    }

    // อัพเดท stock แบบ optimistic ใน React Query cache
    try {
      const deductionById = items.reduce<Record<string, number>>((acc, item: any) => {
        const productId = (item.product?.id ?? item.productId)?.toString()
        if (productId) acc[productId] = (acc[productId] || 0) + (item.quantity || 0)
        return acc
      }, {})

      const applyDeduction = (list: any[]) =>
        list.map((p) => {
          const id = p?.id?.toString()
          const dec = id ? deductionById[id] || 0 : 0
          if (!dec) return p
          const nextStock = Math.max(0, (p.stock || 0) - dec)
          return { ...p, stock: nextStock }
        })

      queryClient.setQueryData(['products'], (oldData: any) => {
        if (!oldData) return oldData
        if (Array.isArray(oldData)) {
          return applyDeduction(oldData)
        }
        if (Array.isArray(oldData.data)) {
          return { ...oldData, data: applyDeduction(oldData.data) }
        }
        return oldData
      })
    } catch (e) {
      console.warn('Failed to optimistically update product stock in cache', e)
    }

    setOrderSuccess(true)
    clearCart()
    setTimeout(() => setOrderSuccess(false), 2500)
  } catch (err) {
    console.error(err)
    setOrderError('เกิดข้อผิดพลาดในการบันทึกออเดอร์ กรุณาลองใหม่')
  }
}


  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">ตะกร้าสินค้า</h1>
          </div>
          
          <Card className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">ตะกร้าสินค้าว่างเปล่า</h2>
            <p className="text-gray-500 mb-6">เพิ่มสินค้าลงในตะกร้าเพื่อเริ่มต้นการสั่งซื้อ</p>
            <Link href="/">
              <Button variant="primary">
                เลือกซื้อสินค้า
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">ตะกร้าสินค้า</h1>
          <span className="text-sm text-gray-500">({totalItems} รายการ)</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t">
              <Button
                onClick={clearCart}
                variant="secondary"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                ล้างตะกร้าทั้งหมด
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-4">
              <h3 className="text-lg font-semibold mb-4">สรุปคำสั่งซื้อ</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">จำนวนสินค้า</span>
                  <span>{totalItems} ชิ้น</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ราคารวม</span>
                  <span>{formatTHB(totalPrice)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ค่าจัดส่ง</span>
                  <span className="text-green-600">ฟรี</span>
                </div>
                
                <hr className="my-3" />
                
                <div className="flex justify-between text-lg font-semibold">
                  <span>ยอดรวมทั้งสิ้น</span>
                  <span className="text-primary-600">{formatTHB(totalPrice)}</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <Button className="w-full" size="lg" onClick={handleOrder}>
                  ดำเนินการสั่งซื้อ
                </Button>
                {orderSuccess && (
                  <div className="text-green-600 text-center mt-2">
                    สั่งซื้อสำเร็จ! ขอบคุณสำหรับการสั่งซื้อ
                  </div>
                )}
                {orderError && (
                  <div className="text-red-600 text-center mt-2">
                    {orderError}
                  </div>
                )}
                <Link href="/" className="block">
                  <Button variant="secondary" className="w-full">
                    เลือกซื้อสินค้าเพิ่ม
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}