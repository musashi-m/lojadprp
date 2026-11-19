import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

// Resolve DB path
const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const dbPath = process.env.DATABASE_FILE_PATH || path.join(dataDir, "store.db");

// Singleton connection in global scope for Next.js hot-reload
declare global {
  // eslint-disable-next-line no-var
  var __sqliteDbInstance: DatabaseSync | undefined;
}

function getDatabase(): DatabaseSync {
  if (!global.__sqliteDbInstance) {
    const db = new DatabaseSync(dbPath);
    // Performance optimizations
    db.exec("PRAGMA journal_mode = WAL;");
    db.exec("PRAGMA synchronous = NORMAL;");
    db.exec("PRAGMA foreign_keys = ON;");
    initSchema(db);
    global.__sqliteDbInstance = db;
  }
  return global.__sqliteDbInstance;
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      mp_payment_id TEXT UNIQUE,
      status TEXT NOT NULL DEFAULT 'PENDING',
      character_id TEXT NOT NULL,
      discord_id TEXT,
      discord_username TEXT,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_cpf TEXT NOT NULL,
      total_amount REAL NOT NULL,
      discount_amount REAL NOT NULL DEFAULT 0,
      coupon_code TEXT,
      payment_method TEXT NOT NULL DEFAULT 'pix',
      qr_code TEXT,
      qr_code_base64 TEXT,
      ticket_url TEXT,
      expires_at TEXT,
      paid_at TEXT,
      delivered_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_slug TEXT NOT NULL,
      product_name TEXT NOT NULL,
      category TEXT NOT NULL,
      unit_price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS deliveries (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'PENDING',
      attempts INTEGER NOT NULL DEFAULT 0,
      response_data TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS coupons (
      code TEXT PRIMARY KEY,
      discount_percent INTEGER NOT NULL,
      max_uses INTEGER,
      used_count INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_mp_id ON orders(mp_payment_id);
    CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
  `);

  // Seed default coupons if not present
  try {
    const existing = db.prepare("SELECT code FROM coupons WHERE code = 'DPRP10'").get();
    if (!existing) {
      const now = new Date().toISOString();
      const insertCoupon = db.prepare(
        "INSERT INTO coupons (code, discount_percent, max_uses, used_count, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?)"
      );
      insertCoupon.run("DPRP10", 10, 1000, 0, 1, now);
      insertCoupon.run("VIP20", 20, 500, 0, 1, now);
    }
  } catch {
    // Ignore seed conflicts
  }
}

export interface DbOrder {
  id: string;
  mp_payment_id: string | null;
  status: "PENDING" | "PAID" | "DELIVERED" | "CANCELLED" | "EXPIRED";
  character_id: string;
  discord_id: string | null;
  discord_username: string | null;
  customer_name: string;
  customer_email: string;
  customer_cpf: string;
  total_amount: number;
  discount_amount: number;
  coupon_code: string | null;
  payment_method: string;
  qr_code: string | null;
  qr_code_base64: string | null;
  ticket_url: string | null;
  expires_at: string | null;
  paid_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
  items?: DbOrderItem[];
}

export interface DbOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_slug: string;
  product_name: string;
  category: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

export const dbRepository = {
  createOrder(
    order: Omit<DbOrder, "created_at" | "updated_at">,
    items: Omit<DbOrderItem, "id" | "order_id">[]
  ): DbOrder {
    const db = getDatabase();
    const now = new Date().toISOString();

    const insertOrder = db.prepare(`
      INSERT INTO orders (
        id, mp_payment_id, status, character_id, discord_id, discord_username,
        customer_name, customer_email, customer_cpf, total_amount, discount_amount,
        coupon_code, payment_method, qr_code, qr_code_base64, ticket_url,
        expires_at, paid_at, delivered_at, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?
      )
    `);

    insertOrder.run(
      order.id,
      order.mp_payment_id || null,
      order.status,
      order.character_id,
      order.discord_id || null,
      order.discord_username || null,
      order.customer_name,
      order.customer_email,
      order.customer_cpf,
      order.total_amount,
      order.discount_amount,
      order.coupon_code || null,
      order.payment_method,
      order.qr_code || null,
      order.qr_code_base64 || null,
      order.ticket_url || null,
      order.expires_at || null,
      order.paid_at || null,
      order.delivered_at || null,
      now,
      now
    );

    const insertItem = db.prepare(`
      INSERT INTO order_items (
        id, order_id, product_id, product_slug, product_name, category,
        unit_price, quantity, subtotal
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertedItems: DbOrderItem[] = [];
    for (const it of items) {
      const itemId = `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      insertItem.run(
        itemId,
        order.id,
        it.product_id,
        it.product_slug,
        it.product_name,
        it.category,
        it.unit_price,
        it.quantity,
        it.subtotal
      );
      insertedItems.push({
        id: itemId,
        order_id: order.id,
        ...it,
      });
    }

    return {
      ...order,
      created_at: now,
      updated_at: now,
      items: insertedItems,
    };
  },

  getOrderById(id: string): DbOrder | null {
    const db = getDatabase();
    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id) as unknown as DbOrder | undefined;
    if (!order) return null;

    const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(id) as unknown as DbOrderItem[];
    return {
      ...order,
      items,
    };
  },

  getOrderByMpPaymentId(mpPaymentId: string): DbOrder | null {
    const db = getDatabase();
    const order = db.prepare("SELECT * FROM orders WHERE mp_payment_id = ?").get(mpPaymentId) as unknown as DbOrder | undefined;
    if (!order) return null;

    const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(order.id) as unknown as DbOrderItem[];
    return {
      ...order,
      items,
    };
  },

  updateOrderPixData(
    id: string,
    data: {
      mp_payment_id: string;
      qr_code: string;
      qr_code_base64: string;
      ticket_url?: string;
      expires_at?: string;
    }
  ) {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE orders SET
        mp_payment_id = ?,
        qr_code = ?,
        qr_code_base64 = ?,
        ticket_url = ?,
        expires_at = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      data.mp_payment_id,
      data.qr_code,
      data.qr_code_base64,
      data.ticket_url || null,
      data.expires_at || null,
      now,
      id
    );
  },

  markOrderAsPaid(id: string, mpPaymentId?: string): boolean {
    const db = getDatabase();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      UPDATE orders SET
        status = 'PAID',
        mp_payment_id = COALESCE(?, mp_payment_id),
        paid_at = ?,
        updated_at = ?
      WHERE id = ? AND status != 'PAID' AND status != 'DELIVERED'
    `);
    const result = stmt.run(mpPaymentId || null, now, now, id);

    if (result.changes > 0) {
      // Create pending delivery record
      const deliveryId = `deliv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      db.prepare(`
        INSERT OR IGNORE INTO deliveries (id, order_id, status, attempts, created_at, updated_at)
        VALUES (?, ?, 'PENDING', 0, ?, ?)
      `).run(deliveryId, id, now, now);
      return true;
    }
    return false;
  },

  markOrderAsDelivered(id: string, responseData?: string): boolean {
    const db = getDatabase();
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE orders SET
        status = 'DELIVERED',
        delivered_at = ?,
        updated_at = ?
      WHERE id = ?
    `).run(now, now, id);

    db.prepare(`
      UPDATE deliveries SET
        status = 'COMPLETED',
        response_data = ?,
        updated_at = ?
      WHERE order_id = ?
    `).run(responseData || null, now, id);

    return true;
  },

  getPendingDeliveries() {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT o.id, o.character_id, o.discord_id, o.discord_username,
             o.total_amount, o.paid_at, o.created_at
      FROM orders o
      JOIN deliveries d ON o.id = d.order_id
      WHERE o.status = 'PAID' AND d.status = 'PENDING'
      ORDER BY o.paid_at ASC
    `).all() as unknown as (DbOrder & { id: string })[];

    return rows.map((order) => {
      const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(order.id) as unknown as DbOrderItem[];
      return {
        orderId: order.id,
        characterId: order.character_id,
        discordId: order.discord_id,
        discordUsername: order.discord_username,
        totalAmount: order.total_amount,
        paidAt: order.paid_at,
        items: items.map((it) => ({
          productId: it.product_id,
          productSlug: it.product_slug,
          productName: it.product_name,
          category: it.category,
          quantity: it.quantity,
          unitPrice: it.unit_price,
        })),
      };
    });
  },

  validateCoupon(code: string) {
    const db = getDatabase();
    const clean = code.trim().toUpperCase();
    const coupon = db.prepare(`
      SELECT * FROM coupons WHERE code = ? AND is_active = 1
    `).get(clean) as { code: string; discount_percent: number; max_uses: number | null; used_count: number } | undefined;

    if (!coupon) return null;
    if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) return null;

    return {
      code: coupon.code,
      discountPercent: coupon.discount_percent,
    };
  },
};

