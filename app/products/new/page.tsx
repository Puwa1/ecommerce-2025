'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Textarea from '@/components/ui/Textarea'
import Select from '@/components/ui/Select'
import { createProduct } from '@/lib/api'

export default function NewProductPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    imageUrl: '',
    imageAlt: '',
    currency: 'THB',
    brand: ''
  })

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    try {
      const productData = {
        name: form.name,
        category: form.category,
        price: Number(form.price),
        currency: form.currency || undefined,
        stock: Number(form.stock),
        description: form.description || undefined,
        brand: form.brand || undefined,
        image: form.imageUrl,
        imageAlt: form.imageAlt || undefined,
      }

      const result = await createProduct(productData)
      // รีเฟรชแคชสินค้าให้หน้าแรกและหน้าสินค้าดึงข้อมูลล่าสุด
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      await queryClient.refetchQueries({ queryKey: ['products'] })
      alert(`เพิ่มสินค้าสำเร็จ!\n${result.message || ''}`)
      router.push('/products')
    } catch (err: any) {
      alert(`เพิ่มสินค้าไม่สำเร็จ: ${err?.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">เพิ่มสินค้าใหม่</h1>
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">ชื่อสินค้า</label>
              <Input name="name" value={form.name} onChange={onChange} placeholder="เช่น iPhone 15" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">หมวดหมู่</label>
                <Select name="category" value={form.category} onChange={onChange} required>
                  <option value="">เลือกหมวดหมู่</option>
                  <option value="อิเล็กทรอนิกส์">อิเล็กทรอนิกส์</option>
                  <option value="เสื้อผ้า">เสื้อผ้า</option>
                  <option value="เฟอร์นิเจอร์">เฟอร์นิเจอร์</option>
                  <option value="อาหารและเครื่องดื่ม">อาหารและเครื่องดื่ม</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ราคา</label>
                <Input name="price" type="number" min="0" value={form.price} onChange={onChange} placeholder="เช่น 42900" required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">สกุลเงิน</label>
                <Select name="currency" value={form.currency} onChange={onChange}>
                  <option value="THB">THB (บาท)</option>
                  <option value="USD">USD (ดอลลาร์)</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">สต็อก</label>
                <Input name="stock" type="number" min="0" value={form.stock} onChange={onChange} placeholder="เช่น 25" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">รายละเอียด</label>
              <Textarea name="description" value={form.description} onChange={onChange} placeholder="รายละเอียดสินค้า" rows={4} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">ยี่ห้อ (ถ้ามี)</label>
              <Input name="brand" value={form.brand} onChange={onChange} placeholder="เช่น Apple" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">ลิงก์รูปภาพ</label>
              <Input name="imageUrl" value={form.imageUrl} onChange={onChange} placeholder="https://..." required />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">คำอธิบายรูป (alt)</label>
              <Input name="imageAlt" value={form.imageAlt} onChange={onChange} placeholder="คำบรรยายรูปสินค้า" />
            </div>

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="secondary" onClick={() => router.back()} disabled={loading}>ยกเลิก</Button>
              <Button type="submit" disabled={loading}>{loading ? 'กำลังบันทึก...' : 'บันทึกสินค้า'}</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}


