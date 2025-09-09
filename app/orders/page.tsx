import { getProducts } from '@/lib/api'
import { groupByCategory, countLowStock } from '@/lib/utils'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import { ArrowLeft } from 'lucide-react'

const CategoryBar = dynamic(() => import('@/components/charts/CategoryBar'), { ssr: false })

export default async function OrdersPage() {
  const data = await getProducts()
  if (!data || !data.data) {
    return <div className="text-red-500">เกิดข้อผิดพลาด: ไม่สามารถโหลดข้อมูลสินค้าได้</div>
  }
  const products = data.data
  const totalProducts = products.length
  const categories = [...new Set(products.map(p => p.category))]
  const totalCategories = categories.length
  const lowStockCount = countLowStock(products)
  const group = groupByCategory(products)
  const restockCount = lowStockCount

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        </div>
        <Card className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded shadow p-4 text-center">
              <div className="text-lg font-semibold">จำนวนสินค้าทั้งหมด</div>
              <div className="text-2xl font-bold">{totalProducts}</div>
            </div>
            <div className="bg-white rounded shadow p-4 text-center">
              <div className="text-lg font-semibold">จำนวนหมวด</div>
              <div className="text-2xl font-bold">{totalCategories}</div>
            </div>
            <div className="bg-white rounded shadow p-4 text-center">
              <div className="text-lg font-semibold">สินค้าใกล้หมด (≤10)</div>
              <div className="text-2xl font-bold text-red-500">{lowStockCount}</div>
            </div>
          </div>
          <div className="mb-4">
            <CategoryBar data={group} />
          </div>
          <div className="mt-2 text-sm text-gray-700">
            Insight: ควรเติมสต็อก <span className="font-bold">{restockCount}</span> รายการ
          </div>
        </Card>
      </div>
    </div>
  )
}