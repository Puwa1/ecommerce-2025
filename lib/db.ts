import Dexie, { Table } from 'dexie'

export interface Order { id?: number; items: any[]; total: number; createdAt: string; synced: number }

export class AppDB extends Dexie {
  orders!: Table<Order, number>
  constructor() {
    super('EcommerceDB')

    // ถ้ายังไม่มี synced ในเวอร์ชันก่อน ให้เพิ่ม migration เป็น v2
    this.version(1).stores({
      orders: '++id, createdAt' // ถ้าเวอร์ชันเดิมไม่มี synced
    })

    // เวอร์ชันใหม่มี synced index
    this.version(2).stores({
      orders: '++id, synced, createdAt'
    }).upgrade(async tx => {
      // แปลงค่า boolean -> number (true => 1, false => 0)
      await tx.table('orders').toCollection().modify(order => {
        if (typeof (order as any).synced === 'boolean') {
          ;(order as any).synced = (order as any).synced ? 1 : 0
        } else if ((order as any).synced === undefined) {
          ;(order as any).synced = 0
        }
      })
    })
  }
}

export const db = new AppDB()
