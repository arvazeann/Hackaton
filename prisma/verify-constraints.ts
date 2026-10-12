import { config as loadEnv } from "dotenv";
import { randomUUID } from "node:crypto";
import { Client } from "pg";

loadEnv({ path: [".env.local", ".env"] });

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const database = await client.query<{ current_database: string }>(
      "SELECT current_database()",
    );
    if (database.rows[0]?.current_database !== "preloved_dev") {
      throw new Error(
        "Constraint verification hanya boleh dijalankan pada preloved_dev.",
      );
    }
    const fixtures = await client.query(
      `SELECT
         (SELECT id FROM users WHERE email = 'raka@demo.id') AS buyer,
         (SELECT id FROM users WHERE email = 'nadia@demo.id') AS seller,
         (SELECT id FROM categories ORDER BY slug LIMIT 1) AS category,
         (SELECT id FROM products WHERE title = 'Koleksi novel klasik Indonesia' LIMIT 1) AS free_product,
         (SELECT product_id FROM orders WHERE order_code = 'RL-2609-002') AS active_product`,
    );
    const {
      buyer,
      seller,
      category,
      free_product: freeProduct,
      active_product: activeProduct,
    } = fixtures.rows[0] ?? {};
    if (!buyer || !seller || !category || !freeProduct || !activeProduct) {
      throw new Error(
        "Jalankan seed development sebelum verifikasi constraint.",
      );
    }

    await client.query("BEGIN");
    const checks: Array<{
      label: string;
      sql: string;
      values: unknown[];
      code: string;
      constraint: string;
    }> = [
      {
        label: "harga nol ditolak",
        sql: "INSERT INTO products (seller_id, category_id, title, description, price, condition, city) VALUES ($1,$2,'Invalid price','desc',0,'good','Jakarta')",
        values: [seller, category],
        code: "23514",
        constraint: "products_price_range_check",
      },
      {
        label: "harga di atas batas ditolak",
        sql: "INSERT INTO products (seller_id, category_id, title, description, price, condition, city) VALUES ($1,$2,'Invalid price','desc',1000000001,'good','Jakarta')",
        values: [seller, category],
        code: "23514",
        constraint: "products_price_range_check",
      },
      {
        label: "buyer sama dengan seller ditolak",
        sql: "INSERT INTO orders (order_code,buyer_id,seller_id,product_id,price_at_order,product_title_snapshot,status,shipping_name,shipping_phone,shipping_address) VALUES ($1,$2,$2,$3,100,'Fixture','pending','Fixture','000','Fixture')",
        values: [
          `V${randomUUID().replaceAll("-", "").slice(0, 23)}`,
          buyer,
          freeProduct,
        ],
        code: "23514",
        constraint: "orders_buyer_seller_check",
      },
      {
        label: "pesanan aktif duplikat ditolak",
        sql: "INSERT INTO orders (order_code,buyer_id,seller_id,product_id,price_at_order,product_title_snapshot,status,shipping_name,shipping_phone,shipping_address) VALUES ($1,$2,$3,$4,100,'Fixture','pending','Fixture','000','Fixture')",
        values: [
          `V${randomUUID().replaceAll("-", "").slice(0, 23)}`,
          buyer,
          seller,
          activeProduct,
        ],
        code: "23505",
        constraint: "orders_one_active_per_product",
      },
      {
        label: "cancelled tanpa alasan ditolak",
        sql: "INSERT INTO orders (order_code,buyer_id,seller_id,product_id,price_at_order,product_title_snapshot,status,shipping_name,shipping_phone,shipping_address) VALUES ($1,$2,$3,$4,100,'Fixture','cancelled','Fixture','000','Fixture')",
        values: [
          `V${randomUUID().replaceAll("-", "").slice(0, 23)}`,
          buyer,
          seller,
          freeProduct,
        ],
        code: "23514",
        constraint: "orders_cancel_reason_check",
      },
    ];

    for (const [index, check] of checks.entries()) {
      const savepoint = `constraint_check_${index}`;
      await client.query(`SAVEPOINT ${savepoint}`);
      try {
        await client.query(check.sql, check.values);
        await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
        throw new Error(
          `GAGAL: constraint tidak menolak kasus: ${check.label}`,
        );
      } catch (error) {
        if (error instanceof Error && error.message.startsWith("GAGAL:"))
          throw error;
        const pgError = error as { code?: string; constraint?: string };
        await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
        if (
          pgError.code !== check.code ||
          pgError.constraint !== check.constraint
        ) {
          throw new Error(
            `GAGAL: ${check.label}; database menolak melalui constraint yang tidak sesuai.`,
          );
        }
        console.info(`LULUS: ${check.label}`);
      }
    }
    await client.query("ROLLBACK");
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Constraint verification gagal.",
  );
  process.exitCode = 1;
});
