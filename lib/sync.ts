// lib/sync.ts (quick fix)
import { db } from './db'

export async function syncOrders() {
  // กรองด้วย predicate แทน where().equals(false)
  const unsyncedOrders = await db.orders
    .filter(o => !o.synced || o.synced === 0)
    .toArray()



  for (const order of unsyncedOrders) {
  try {
    const { synced, ...orderData } = order

    const res = await fetch('http://54.169.154.143:3470/ecommerce-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    })

    if (res.ok) {
      await db.orders.update(order.id!, { synced: true })
      console.log(`Order ${order.id} synced ✅`)
    }
  } catch (err) {
    console.error('Sync failed for order:', order.id, err)
  }
}

}
