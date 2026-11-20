import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import { CATEGORIES_LIST, PRODUCTS_DATA, StoreProduct, StoreCategory, getDefaultProductCommands } from "@/data/mockProducts";

// Resolve DB path outside of web to prevent Turbopack watch reload loops
const rawDbPath = process.env.DATABASE_FILE_PATH || "../data/store.db";
const dbPath = path.isAbsolute(rawDbPath)
  ? rawDbPath
  : path.resolve(process.cwd(), rawDbPath);

const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

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

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      original_price REAL,
      discount INTEGER,
      image TEXT NOT NULL,
      description TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      picture TEXT,
      google_id TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL DEFAULT 'OWNER',
      created_at TEXT NOT NULL,
      last_login_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      admin_email TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      ip TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS store_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_mp_id ON orders(mp_payment_id);
    CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
    CREATE INDEX IF NOT EXISTS idx_admin_email ON admin_users(email);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
  `);

  // Migrate CentralCart extended product columns if needed
  try { db.exec("ALTER TABLE products ADD COLUMN commands TEXT;"); } catch {}
  try { db.exec("ALTER TABLE products ADD COLUMN cost REAL;"); } catch {}
  try { db.exec("ALTER TABLE products ADD COLUMN stock INTEGER DEFAULT 0;"); } catch {}
  try { db.exec("ALTER TABLE products ADD COLUMN min_quantity INTEGER DEFAULT 0;"); } catch {}
  try { db.exec("ALTER TABLE products ADD COLUMN limit_per_user INTEGER DEFAULT 0;"); } catch {}
  try { db.exec("ALTER TABLE products ADD COLUMN quantity_limit INTEGER DEFAULT 0;"); } catch {}
  try { db.exec("ALTER TABLE products ADD COLUMN remove_after TEXT;"); } catch {}
  try { db.exec("ALTER TABLE products ADD COLUMN discord_actions TEXT;"); } catch {}
  try { db.exec("ALTER TABLE order_expirations ADD COLUMN discord_actions TEXT;"); } catch {}
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS order_expirations (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        character_id TEXT NOT NULL,
        discord_id TEXT,
        discord_username TEXT,
        product_id TEXT NOT NULL,
        product_name TEXT NOT NULL,
        commands TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        processed_at TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_expirations_status ON order_expirations(status, expires_at);
    `);
  } catch {}

  // Seed default coupons if not present
  try {
    const now = new Date().toISOString();
    const insertCoupon = db.prepare(
      "INSERT OR IGNORE INTO coupons (code, discount_percent, max_uses, used_count, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    );
    insertCoupon.run("DPRP10", 10, 1000, 0, 1, now);
    insertCoupon.run("VIP20", 20, 500, 0, 1, now);
    insertCoupon.run("DISTRITO10", 10, 1000, 0, 1, now);
    insertCoupon.run("BEMVINDO10", 10, 1000, 0, 1, now);
    insertCoupon.run("PAULISTA20", 20, 500, 0, 1, now);
  } catch {
    // Ignore seed conflicts
  }

  // Seed default categories if empty
  try {
    const catCount = db.prepare("SELECT COUNT(*) as count FROM categories").get() as { count: number } | undefined;
    if (!catCount || catCount.count === 0) {
      const now = new Date().toISOString();
      const insertCat = db.prepare("INSERT INTO categories (id, label, display_order, created_at) VALUES (?, ?, ?, ?)");
      CATEGORIES_LIST.forEach((cat, index) => {
        insertCat.run(cat.id, cat.label, index, now);
      });
    }
  } catch (err) {
    console.error("Failed to seed categories:", err);
  }

  // Seed default products if empty
  try {
    const prodCount = db.prepare("SELECT COUNT(*) as count FROM products").get() as { count: number } | undefined;
    if (!prodCount || prodCount.count === 0) {
      const now = new Date().toISOString();
      const insertProd = db.prepare(`
        INSERT INTO products (
          id, slug, name, category, price, original_price, discount, image, description, is_active, display_order, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
      `);
      PRODUCTS_DATA.forEach((prod, index) => {
        insertProd.run(
          prod.id,
          prod.slug,
          prod.name,
          prod.category,
          prod.price,
          prod.originalPrice ?? null,
          prod.discount ?? null,
          prod.image,
          prod.description ?? null,
          index,
          now,
          now
        );
      });
    }
  } catch (err) {
    console.error("Failed to seed products:", err);
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

export function parseDurationMs(durationStr?: string | null): number | null {
  if (!durationStr || typeof durationStr !== "string") return null;
  const clean = durationStr.toLowerCase().trim();
  if (clean === "" || clean.includes("nunca")) return null;

  const numMatch = clean.match(/(\d+)/);
  const num = numMatch ? parseInt(numMatch[1], 10) : 1;

  if (clean.includes("hora") || clean.includes("hour") || clean.endsWith("h")) {
    return num * 60 * 60 * 1000;
  }
  if (clean.includes("minuto") || clean.includes("min") || (clean.endsWith("m") && !clean.includes("mês") && !clean.includes("mes"))) {
    return num * 60 * 1000;
  }
  if (clean.includes("semana") || clean.includes("week") || clean.endsWith("w")) {
    return num * 7 * 24 * 60 * 60 * 1000;
  }
  if (clean.includes("mês") || clean.includes("mes") || clean.includes("meses") || clean.includes("month")) {
    return num * 30 * 24 * 60 * 60 * 1000;
  }
  return num * 24 * 60 * 60 * 1000;
}

export const dbRepository = {
  getDbSync(): DatabaseSync {
    return getDatabase();
  },
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
      // Increment coupon usage if order had a coupon
      try {
        db.prepare(`
          UPDATE coupons
          SET used_count = used_count + 1
          WHERE code = (SELECT coupon_code FROM orders WHERE id = ?)
        `).run(id);
      } catch {
        // ignore
      }

      // Create pending delivery record
      const deliveryId = `deliv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      db.prepare(`
        INSERT OR IGNORE INTO deliveries (id, order_id, status, attempts, created_at, updated_at)
        VALUES (?, ?, 'PENDING', 0, ?, ?)
      `).run(deliveryId, id, now, now);

      // Schedule expirations for items with "Quando expirar" or remove_after
      try {
        const orderRow = db.prepare("SELECT character_id, discord_id, discord_username FROM orders WHERE id = ?").get(id) as any;
        const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(id) as any[];

        for (const it of items) {
          const prodRow = db.prepare("SELECT commands, remove_after, category, slug, name, discord_actions FROM products WHERE id = ?").get(it.product_id) as any;
          let prodCmds: any[] = [];
          try {
            if (prodRow?.commands) prodCmds = JSON.parse(prodRow.commands);
          } catch {}
          if (!prodCmds || prodCmds.length === 0) {
            prodCmds = getDefaultProductCommands(prodRow || { category: it.category, slug: it.product_slug, name: it.product_name });
          }

          const expCmds = prodCmds.filter((c: any) => {
            const timing = typeof c === "object" && c ? c.timing : "Após a confirmação";
            return timing === "Quando expirar";
          });

          let expDiscordActions: any[] = [];
          try {
            if (prodRow?.discord_actions) {
              const parsed = JSON.parse(prodRow.discord_actions);
              expDiscordActions = Array.isArray(parsed) ? parsed.filter((a: any) => a.timing === "Quando expirar") : [];
            }
          } catch {}

          let durationMs = parseDurationMs(prodRow?.remove_after);
          if (!durationMs && (expCmds.length > 0 || expDiscordActions.length > 0)) {
            const isWipe = (it.product_name?.toLowerCase().includes("wipe") || it.product_slug?.toLowerCase().includes("wipe"));
            if (!isWipe) {
              durationMs = 30 * 24 * 60 * 60 * 1000; // 30 dias padrão para VIP mensal
            }
          }

          if (durationMs && durationMs > 0 && (expCmds.length > 0 || expDiscordActions.length > 0)) {
            const expiresAt = new Date(Date.now() + durationMs).toISOString();
            const expId = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            db.prepare(`
              INSERT OR REPLACE INTO order_expirations (
                id, order_id, character_id, discord_id, discord_username,
                product_id, product_name, commands, expires_at, status, created_at, discord_actions
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
            `).run(
              expId, id, orderRow?.character_id || "", orderRow?.discord_id || null, orderRow?.discord_username || null,
              it.product_id, it.product_name, JSON.stringify(expCmds), expiresAt, now, prodRow?.discord_actions || null
            );
          }
        }
      } catch (expErr) {
        console.error("Erro ao registrar expiração do pedido:", expErr);
      }

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
      SELECT o.id, o.character_id, o.customer_name, o.discord_id, o.discord_username,
             o.total_amount, o.paid_at, o.created_at
      FROM orders o
      JOIN deliveries d ON o.id = d.order_id
      WHERE o.status = 'PAID' AND d.status = 'PENDING'
      ORDER BY o.paid_at ASC
    `).all() as unknown as (DbOrder & { id: string })[];

    const activeDeliveries = rows.map((order) => {
      const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(order.id) as unknown as DbOrderItem[];
      return {
        orderId: order.id,
        characterId: order.character_id,
        customerName: order.customer_name,
        discordId: order.discord_id,
        discordUsername: order.discord_username,
        totalAmount: order.total_amount,
        paidAt: order.paid_at,
        items: items.map((it) => {
          const prodRow = db.prepare("SELECT commands FROM products WHERE id = ?").get(it.product_id) as any;
          let prodCmds: any[] = [];
          try {
            if (prodRow?.commands) prodCmds = JSON.parse(prodRow.commands);
          } catch {}
          if (!prodCmds || prodCmds.length === 0) {
            prodCmds = getDefaultProductCommands({ category: it.category, slug: it.product_slug, name: it.product_name });
          }

          const resolvedCommands = prodCmds.map((c: any) => {
            const timing = typeof c === "object" && c ? (c.timing || "Após a confirmação") : "Após a confirmação";
            const rawCmd = typeof c === "object" && c ? c.command : String(c);
            const executable = rawCmd
              .replace(/\{client_identifier\}/gi, order.character_id)
              .replace(/\{citizenid\}/gi, order.character_id)
              .replace(/\[citizenid\]/gi, order.character_id);
            return {
              timing,
              command: executable,
            };
          });

          return {
            productId: it.product_id,
            productSlug: it.product_slug,
            productName: it.product_name,
            category: it.category,
            quantity: it.quantity,
            unitPrice: it.unit_price,
            commands: resolvedCommands,
          };
        }),
      };
    });

    const dueExpirations = this.processDueExpirations();
    return [...activeDeliveries, ...dueExpirations];
  },

  processDueExpirations() {
    const db = getDatabase();
    const now = new Date().toISOString();
    try {
      const dueRows = db.prepare(`
        SELECT * FROM order_expirations
        WHERE status = 'ACTIVE' AND expires_at <= ?
      `).all(now) as any[];

      if (!dueRows || dueRows.length === 0) return [];

      const expiredDeliveries: any[] = [];

      for (const row of dueRows) {
        db.prepare(`
          UPDATE order_expirations
          SET status = 'PROCESSED', processed_at = ?
          WHERE id = ?
        `).run(now, row.id);

        let cmds: any[] = [];
        try {
          if (row.commands) cmds = JSON.parse(row.commands);
        } catch {}

        const resolvedCommands = cmds.map((c: any) => {
          const rawCmd = typeof c === "object" && c ? c.command : String(c);
          const executable = rawCmd
            .replace(/\{client_identifier\}/gi, row.character_id)
            .replace(/\{citizenid\}/gi, row.character_id)
            .replace(/\[citizenid\]/gi, row.character_id);
          return {
            timing: "Após a confirmação",
            command: executable,
          };
        });

        expiredDeliveries.push({
          orderId: `EXP-${row.id}`,
          characterId: row.character_id,
          discordId: row.discord_id,
          discordUsername: row.discord_username,
          totalAmount: 0,
          paidAt: now,
          items: [
            {
              productId: row.product_id,
              productSlug: "expiracao",
              productName: `${row.product_name} (EXPIRADO)`,
              category: "vips",
              quantity: 1,
              unitPrice: 0,
              commands: resolvedCommands,
            },
          ],
        });

        // Trigger Discord notification asynchronously
        import("@/lib/discordNotifier")
          .then(({ sendDiscordExpirationNotification }) => {
            sendDiscordExpirationNotification({
              orderId: row.order_id,
              characterId: row.character_id,
              discordId: row.discord_id,
              productName: row.product_name,
              expiredAt: now,
            }).catch((err) => console.error("Erro ao enviar webhook de expiração Discord:", err));
          })
          .catch((err) => console.error("Erro ao carregar discordNotifier:", err));

        // Automatically revoke Discord VIP roles if configured
        if (row.discord_id && row.discord_actions) {
          import("@/lib/discordBot")
            .then(({ processDiscordActionsOnExpiration }) => {
              processDiscordActionsOnExpiration(row.discord_id, row.discord_actions).catch((err) =>
                console.error("Erro ao revogar cargos no Discord:", err)
              );
            })
            .catch((err) => console.error("Erro ao carregar discordBot:", err));
        }
      }

      return expiredDeliveries;
    } catch (e) {
      console.error("Erro ao processar expirações:", e);
      return [];
    }
  },

  markExpirationProcessed(expId: string, responseData?: string) {
    const db = getDatabase();
    const now = new Date().toISOString();
    try {
      db.prepare(`
        UPDATE order_expirations
        SET status = 'PROCESSED', processed_at = ?
        WHERE id = ?
      `).run(now, expId);
    } catch (e) {
      console.error(e);
    }
  },

  getAllExpirations(limit = 100) {
    const db = getDatabase();
    try {
      return db.prepare(`
        SELECT * FROM order_expirations
        ORDER BY created_at DESC
        LIMIT ?
      `).all(limit) as any[];
    } catch {
      return [];
    }
  },

  triggerExpirationNow(id: string) {
    const db = getDatabase();
    const past = new Date(Date.now() - 60000).toISOString();
    try {
      db.prepare(`
        UPDATE order_expirations
        SET expires_at = ?, status = 'ACTIVE'
        WHERE id = ?
      `).run(past, id);
      return true;
    } catch {
      return false;
    }
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

  // ================= CATEGORIES =================
  getAllCategories(): (StoreCategory & { productCount: number })[] {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT c.id, c.label, c.display_order as displayOrder, c.created_at as createdAt,
             COUNT(p.id) as productCount
      FROM categories c
      LEFT JOIN products p ON c.id = p.category AND p.is_active = 1
      GROUP BY c.id
      ORDER BY c.display_order ASC, c.label ASC
    `).all() as any[];

    return rows.map((r) => ({
      id: r.id,
      label: r.label,
      displayOrder: Number(r.displayOrder || 0),
      createdAt: r.createdAt,
      productCount: Number(r.productCount || 0),
    }));
  },

  getCategoryById(id: string): StoreCategory | null {
    const db = getDatabase();
    const row = db.prepare("SELECT id, label, display_order as displayOrder, created_at as createdAt FROM categories WHERE id = ?").get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      label: row.label,
      displayOrder: Number(row.displayOrder || 0),
      createdAt: row.createdAt,
    };
  },

  createCategory(data: { id: string; label: string; displayOrder?: number }): StoreCategory {
    const db = getDatabase();
    const now = new Date().toISOString();
    const cleanId = data.id.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "-");
    const displayOrder = data.displayOrder ?? 0;

    db.prepare("INSERT INTO categories (id, label, display_order, created_at) VALUES (?, ?, ?, ?)").run(
      cleanId,
      data.label.trim(),
      displayOrder,
      now
    );

    return {
      id: cleanId,
      label: data.label.trim(),
      displayOrder,
      createdAt: now,
      productCount: 0,
    };
  },

  updateCategory(id: string, data: { label: string; displayOrder?: number }): boolean {
    const db = getDatabase();
    const existing = db.prepare("SELECT id FROM categories WHERE id = ?").get(id);
    if (!existing) return false;

    db.prepare("UPDATE categories SET label = ?, display_order = COALESCE(?, display_order) WHERE id = ?").run(
      data.label.trim(),
      data.displayOrder ?? null,
      id
    );
    return true;
  },

  deleteCategory(id: string): boolean {
    const db = getDatabase();
    const result = db.prepare("DELETE FROM categories WHERE id = ?").run(id);
    return result.changes > 0;
  },

  // ================= PRODUCTS =================
  getAllProducts(options?: { category?: string; includeInactive?: boolean }): StoreProduct[] {
    const db = getDatabase();
    let query = "SELECT * FROM products WHERE 1=1";
    const params: any[] = [];

    if (!options?.includeInactive) {
      query += " AND is_active = 1";
    }

    if (options?.category && options.category !== "all" && options.category !== "todos") {
      query += " AND category = ?";
      params.push(options.category);
    }

    query += " ORDER BY display_order ASC, name ASC";

    const rows = db.prepare(query).all(...params) as any[];
    return rows.map((r) => {
      let cmds: any[] = [];
      try {
        if (r.commands) cmds = JSON.parse(r.commands);
      } catch {}
      if (!cmds || cmds.length === 0) {
        cmds = getDefaultProductCommands(r);
      } else {
        cmds = cmds.map((c: any) => {
          if (typeof c === "object" && c !== null) {
            return {
              timing: c.timing || "Após a confirmação",
              command: c.command || "",
            };
          }
          return {
            timing: "Após a confirmação",
            command: String(c || ""),
          };
        });
      }

      return {
        id: r.id,
        slug: r.slug,
        name: r.name,
        category: r.category,
        price: Number(r.price),
        originalPrice: r.original_price != null ? Number(r.original_price) : undefined,
        discount: r.discount != null ? Number(r.discount) : undefined,
        image: r.image,
        description: r.description || undefined,
        isActive: r.is_active === 1,
        displayOrder: Number(r.display_order || 0),
        commands: cmds,
        cost: r.cost != null ? Number(r.cost) : undefined,
        stock: r.stock === 1,
        minQuantity: r.min_quantity === 1,
        limitPerUser: r.limit_per_user === 1,
        quantityLimit: r.quantity_limit === 1,
        removeAfter: r.remove_after || undefined,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };
    });
  },

  getProductByIdOrSlug(idOrSlug: string): StoreProduct | null {
    const db = getDatabase();
    const decoded = decodeURIComponent(idOrSlug);
    const row = db.prepare("SELECT * FROM products WHERE id = ? OR slug = ? OR slug = ?").get(idOrSlug, idOrSlug, decoded) as any;
    if (!row) return null;

    let cmds: any[] = [];
    try {
      if (row.commands) cmds = JSON.parse(row.commands);
    } catch {}
    if (!cmds || cmds.length === 0) {
      cmds = getDefaultProductCommands(row);
    } else {
      cmds = cmds.map((c: any) => {
        if (typeof c === "object" && c !== null) {
          return {
            timing: c.timing || "Após a confirmação",
            command: c.command || "",
          };
        }
        return {
          timing: "Após a confirmação",
          command: String(c || ""),
        };
      });
    }

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      category: row.category,
      price: Number(row.price),
      originalPrice: row.original_price != null ? Number(row.original_price) : undefined,
      discount: row.discount != null ? Number(row.discount) : undefined,
      image: row.image,
      description: row.description || undefined,
      isActive: row.is_active === 1,
      displayOrder: Number(row.display_order || 0),
      commands: cmds,
      cost: row.cost != null ? Number(row.cost) : undefined,
      stock: row.stock === 1,
      minQuantity: row.min_quantity === 1,
      limitPerUser: row.limit_per_user === 1,
      quantityLimit: row.quantity_limit === 1,
      removeAfter: row.remove_after || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  createProduct(data: Omit<StoreProduct, "createdAt" | "updatedAt">): StoreProduct {
    const db = getDatabase();
    const now = new Date().toISOString();
    const id = data.id || `pkg-${Date.now()}`;
    const slug = data.slug.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "-");
    const displayOrder = data.displayOrder ?? 0;
    const isActive = data.isActive === false ? 0 : 1;
    const commandsJson = data.commands && data.commands.length > 0 ? JSON.stringify(data.commands) : null;

    db.prepare(`
      INSERT INTO products (
        id, slug, name, category, price, original_price, discount, image, description, is_active, display_order,
        commands, cost, stock, min_quantity, limit_per_user, quantity_limit, remove_after, discord_actions, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      slug,
      data.name.trim(),
      data.category,
      data.price,
      data.originalPrice ?? null,
      data.discount ?? null,
      data.image.trim(),
      data.description || null,
      isActive,
      displayOrder,
      commandsJson,
      data.cost ?? null,
      data.stock ? 1 : 0,
      data.minQuantity ? 1 : 0,
      data.limitPerUser ? 1 : 0,
      data.quantityLimit ? 1 : 0,
      data.removeAfter || null,
      now,
      now
    );

    return {
      id,
      slug,
      name: data.name.trim(),
      category: data.category,
      price: data.price,
      originalPrice: data.originalPrice,
      discount: data.discount,
      image: data.image.trim(),
      description: data.description,
      isActive: isActive === 1,
      displayOrder,
      commands: data.commands || [],
      cost: data.cost,
      stock: Boolean(data.stock),
      minQuantity: Boolean(data.minQuantity),
      limitPerUser: Boolean(data.limitPerUser),
      quantityLimit: Boolean(data.quantityLimit),
      removeAfter: data.removeAfter,
      createdAt: now,
      updatedAt: now,
    };
  },

  updateProduct(id: string, data: Partial<StoreProduct>): boolean {
    const db = getDatabase();
    const existing = db.prepare("SELECT * FROM products WHERE id = ?").get(id) as any;
    if (!existing) return false;

    const now = new Date().toISOString();
    const name = data.name !== undefined ? data.name.trim() : existing.name;
    const slug = data.slug !== undefined ? data.slug.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "-") : existing.slug;
    const category = data.category !== undefined ? data.category : existing.category;
    const price = data.price !== undefined ? data.price : existing.price;
    const originalPrice = data.originalPrice !== undefined ? data.originalPrice : existing.original_price;
    const discount = data.discount !== undefined ? data.discount : existing.discount;
    const image = data.image !== undefined ? data.image.trim() : existing.image;
    const description = data.description !== undefined ? data.description : existing.description;
    const isActive = data.isActive !== undefined ? (data.isActive ? 1 : 0) : existing.is_active;
    const displayOrder = data.displayOrder !== undefined ? data.displayOrder : existing.display_order;
    const commandsJson = data.commands !== undefined ? JSON.stringify(data.commands) : existing.commands;
    const cost = data.cost !== undefined ? data.cost : existing.cost;
    const stock = data.stock !== undefined ? (data.stock ? 1 : 0) : existing.stock;
    const minQuantity = data.minQuantity !== undefined ? (data.minQuantity ? 1 : 0) : existing.min_quantity;
    const limitPerUser = data.limitPerUser !== undefined ? (data.limitPerUser ? 1 : 0) : existing.limit_per_user;
    const quantityLimit = data.quantityLimit !== undefined ? (data.quantityLimit ? 1 : 0) : existing.quantity_limit;
    const removeAfter = data.removeAfter !== undefined ? data.removeAfter : existing.remove_after;
    const discordActionsJson = (data as any).discordActions !== undefined ? JSON.stringify((data as any).discordActions) : existing.discord_actions;

    db.prepare(`
      UPDATE products SET
        name = ?, slug = ?, category = ?, price = ?, original_price = ?, discount = ?,
        image = ?, description = ?, is_active = ?, display_order = ?,
        commands = ?, cost = ?, stock = ?, min_quantity = ?, limit_per_user = ?, quantity_limit = ?, remove_after = ?, discord_actions = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      name, slug, category, price, originalPrice ?? null, discount ?? null,
      image, description ?? null, isActive, displayOrder,
      commandsJson, cost ?? null, stock, minQuantity, limitPerUser, quantityLimit, removeAfter ?? null, discordActionsJson ?? null,
      now, id
    );

    return true;
  },

  deleteProduct(id: string): boolean {
    const db = getDatabase();
    const result = db.prepare("DELETE FROM products WHERE id = ?").run(id);
    return result.changes > 0;
  },

  // ================= ADMIN STATS & ORDERS =================
  getAdminStats() {
    const db = getDatabase();
    const totalProducts = (db.prepare("SELECT COUNT(*) as c FROM products").get() as any)?.c || 0;
    const totalCategories = (db.prepare("SELECT COUNT(*) as c FROM categories").get() as any)?.c || 0;
    const totalOrders = (db.prepare("SELECT COUNT(*) as c FROM orders").get() as any)?.c || 0;
    const paidOrders = (db.prepare("SELECT COUNT(*) as c, COALESCE(SUM(total_amount), 0) as rev FROM orders WHERE status IN ('PAID', 'DELIVERED')").get() as any) || { c: 0, rev: 0 };
    const pendingDeliveries = (db.prepare("SELECT COUNT(*) as c FROM deliveries WHERE status = 'PENDING'").get() as any)?.c || 0;

    return {
      totalProducts,
      totalCategories,
      totalOrders,
      paidOrdersCount: paidOrders.c,
      totalRevenue: paidOrders.rev,
      pendingDeliveries,
    };
  },

  getAllOrders(limit = 100): DbOrder[] {
    const db = getDatabase();
    const rows = db.prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT ?").all(limit) as unknown as DbOrder[];
    return rows.map((order) => {
      const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(order.id) as unknown as DbOrderItem[];
      return {
        ...order,
        items,
      };
    });
  },

  getAllCoupons() {
    const db = getDatabase();
    return db.prepare("SELECT code, discount_percent as discountPercent, max_uses as maxUses, used_count as usedCount, is_active as isActive, created_at as createdAt FROM coupons ORDER BY created_at DESC").all() as any[];
  },

  createCoupon(coupon: { code: string; discountPercent: number; maxUses?: number }) {
    const db = getDatabase();
    const now = new Date().toISOString();
    const cleanCode = coupon.code.trim().toUpperCase();
    db.prepare(`
      INSERT INTO coupons (code, discount_percent, max_uses, used_count, is_active, created_at)
      VALUES (?, ?, ?, 0, 1, ?)
      ON CONFLICT(code) DO UPDATE SET discount_percent = excluded.discount_percent, max_uses = excluded.max_uses, is_active = 1
    `).run(cleanCode, coupon.discountPercent, coupon.maxUses ?? null, now);
    return { code: cleanCode, discountPercent: coupon.discountPercent, maxUses: coupon.maxUses ?? null, isActive: true };
  },

  toggleCouponActive(code: string, isActive: boolean) {
    const db = getDatabase();
    db.prepare("UPDATE coupons SET is_active = ? WHERE code = ?").run(isActive ? 1 : 0, code.toUpperCase());
    return true;
  },

  deleteCoupon(code: string) {
    const db = getDatabase();
    db.prepare("DELETE FROM coupons WHERE code = ?").run(code.toUpperCase());
    return true;
  },

  // ================= ADMIN GOOGLE USERS =================
  getAdminUserCount(): number {
    const db = getDatabase();
    const row = db.prepare("SELECT COUNT(*) as count FROM admin_users").get() as { count: number } | undefined;
    return row?.count || 0;
  },

  getOwnerUser(): AdminUser | null {
    const db = getDatabase();
    const row = db.prepare("SELECT * FROM admin_users WHERE role = 'OWNER' LIMIT 1").get() as AdminUser | undefined;
    return row || null;
  },

  getAdminUserByEmail(email: string): AdminUser | null {
    const db = getDatabase();
    const row = db.prepare("SELECT * FROM admin_users WHERE email = ?").get(email.toLowerCase().trim()) as AdminUser | undefined;
    return row || null;
  },

  handleGoogleAdminLogin(profile: { googleId: string; email: string; name?: string; picture?: string }): {
    success: boolean;
    isNewOwner?: boolean;
    user?: AdminUser;
    error?: string;
  } {
    const db = getDatabase();
    const now = new Date().toISOString();
    const cleanEmail = profile.email.toLowerCase().trim();

    // Check optional ADMIN_OWNER_EMAIL whitelist in environment
    const pinnedOwner = process.env.ADMIN_OWNER_EMAIL?.toLowerCase().trim();
    if (pinnedOwner && cleanEmail !== pinnedOwner) {
      return {
        success: false,
        error: `Acesso negado: a conta Google (${cleanEmail}) não tem permissão para administrar esta loja.`,
      };
    }

    // Check how many admin users exist
    const countRow = db.prepare("SELECT COUNT(*) as count FROM admin_users").get() as { count: number } | undefined;
    const adminCount = countRow?.count || 0;

    // Case 1: First login EVER -> register as the official OWNER!
    if (adminCount === 0) {
      const id = `admin_${Date.now()}`;
      db.prepare(`
        INSERT INTO admin_users (id, email, name, picture, google_id, role, created_at, last_login_at)
        VALUES (?, ?, ?, ?, ?, 'OWNER', ?, ?)
      `).run(
        id,
        cleanEmail,
        profile.name || null,
        profile.picture || null,
        profile.googleId,
        now,
        now
      );

      const created = db.prepare("SELECT * FROM admin_users WHERE id = ?").get(id) as unknown as AdminUser;
      return {
        success: true,
        isNewOwner: true,
        user: created,
      };
    }

    // Case 2: Owner already exists -> check if this email or googleId matches
    const existing = db.prepare(`
      SELECT * FROM admin_users WHERE email = ? OR google_id = ?
    `).get(cleanEmail, profile.googleId) as AdminUser | undefined;

    if (!existing) {
      return {
        success: false,
        error: `Acesso negado: a conta Google (${cleanEmail}) não tem permissão para acessar este painel. Apenas o proprietário registrado pode entrar.`,
      };
    }

    // Update last login, name, picture
    db.prepare(`
      UPDATE admin_users SET
        name = COALESCE(?, name),
        picture = COALESCE(?, picture),
        google_id = ?,
        last_login_at = ?
      WHERE id = ?
    `).run(profile.name || null, profile.picture || null, profile.googleId, now, existing.id);

    const updated = db.prepare("SELECT * FROM admin_users WHERE id = ?").get(existing.id) as unknown as AdminUser;
    return {
      success: true,
      isNewOwner: false,
      user: updated,
    };
  },

  // ================= AUDIT LOGS =================
  logAdminAction(adminEmail: string, action: string, details?: string, ip?: string) {
    try {
      const db = getDatabase();
      const id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO audit_logs (id, admin_email, action, details, ip, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, adminEmail, action, details || null, ip || null, now);
    } catch (e) {
      console.error("Failed to write audit log:", e);
    }
  },

  getRecentAuditLogs(limit = 40) {
    const db = getDatabase();
    return db.prepare("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?").all(limit) as any[];
  },

  // ================= STORE SETTINGS =================
  getSetting(key: string): string | null {
    try {
      const db = getDatabase();
      const row = db.prepare("SELECT value FROM store_settings WHERE key = ?").get(key) as { value: string } | undefined;
      return row ? row.value : null;
    } catch {
      return null;
    }
  },

  setSetting(key: string, value: string): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO store_settings (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).run(key, value, now);
  },
};

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  google_id: string;
  role: string;
  created_at: string;
  last_login_at: string;
}

