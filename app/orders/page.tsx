'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import { ArrowLeft, Package, Calendar, Clock } from 'lucide-react'
import { getOrders } from '@/lib/api'
import { formatTHB, formatDate } from '@/lib/utils'

interface OrderItem {
  product: {
    id: number;
    name: string;
    price: number;
  };
  quantity: number;
}

interface Order {
  id: string | number;
  items: OrderItem[];
  total: number;
  createdAt: string;
  synced?: boolean;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true)
        // ดึงข้อมูลคำสั่งซื้อจาก API
        const response = await getOrders()
        if (response.success && response.data) {
          setOrders(response.data)
        } else {
          setError('ไม่สามารถโหลดประวัติการสั่งซื้อได้')
        }
      } catch (err) {
        console.error('Error fetching orders:', err)
        setError('ไม่สามารถโหลดประวัติการสั่งซื้อได้')
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">ประวัติการสั่งซื้อ</h1>
        </div>
        
        {loading ? (
          <Card className="p-6 text-center">
            <div className="animate-pulse">กำลังโหลดข้อมูล...</div>
          </Card>
        ) : error ? (
          <Card className="p-6 text-center text-red-500">
            {error}
          </Card>
        ) : orders.length === 0 ? (
          <Card className="p-6 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">ยังไม่มีประวัติการสั่งซื้อ</h2>
            <p className="text-gray-500 mb-6">เมื่อคุณสั่งซื้อสินค้า รายการสั่งซื้อจะปรากฏที่นี่</p>
            <Link href="/" className="text-blue-600 hover:underline">เลือกซื้อสินค้า</Link>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <Card className="p-4 text-center">
                <div className="text-lg font-semibold">จำนวนคำสั่งซื้อทั้งหมด</div>
                <div className="text-2xl font-bold">{orders.length}</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-lg font-semibold">มูลค่าการสั่งซื้อรวม</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatTHB(orders.reduce((sum, order) => sum + order.total, 0))}
                </div>
              </Card>
            </div>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">รายการสั่งซื้อ</h2>
            
            {orders.map((order, orderIndex) => (
              <Card key={`order-${orderIndex}-${order.id}`} className="p-4">
                <div className="flex flex-col md:flex-row justify-between mb-4">
                  <div className="flex items-center gap-2 mb-2 md:mb-0">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <span className="font-medium">วันที่สั่งซื้อ:</span>
                    <span>{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-500" />
                    <span className="font-medium">สถานะ:</span>
                    <span className="text-green-600 font-medium">
                      สำเร็จ
                    </span>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4 mt-2">
                  <h3 className="font-medium mb-2">รายการสินค้า:</h3>
                  <ul className="space-y-2">
                    {order.items.map((item, index) => (
                      <li key={`${order.id}-item-${index}`} className="flex justify-between">
                        <div>
                          <span className="font-medium">{item.product?.name || 'สินค้า'}</span>
                          <span className="text-gray-500 ml-2">x{item.quantity}</span>
                        </div>
                        <span>{formatTHB(item.product?.price * item.quantity || 0)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="border-t border-gray-200 pt-4 mt-4 flex justify-between items-center">
                  <span className="font-medium">ยอดรวม:</span>
                  <span className="text-lg font-bold text-green-600">{formatTHB(order.total)}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}