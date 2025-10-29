import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db/connection';
import { validatePurchase } from '@/lib/validation/validationSchemas';

interface PurchaseRow {
  purchase_id: number;
  total_amount: number;
  notes: string | null;
  purchase_datetime: string;
  is_deleted: boolean;
  create_datetime: string;
  update_datetime: string;
}

interface PurchaseIngredientItem {
  ingredient_id: number;
  quantity_purchased: number;
  unit_cost: number;
}

// GET /api/purchases - Get all purchases
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isDeleted = searchParams.get('is_deleted');

    let query = `
      SELECT 
        purchase_id, 
        total_amount, 
        notes, 
        purchase_datetime, 
        is_deleted, 
        create_datetime, 
        update_datetime
      FROM purchase
      WHERE 1=1
    `;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any[] = [];
    let paramIndex = 1;

    if (isDeleted !== null && isDeleted !== undefined) {
      query += ` AND is_deleted = $${paramIndex}`;
      params.push(isDeleted === 'true');
      paramIndex++;
    }

    query += ' ORDER BY purchase_datetime DESC';

    const pool = getDbPool();
    const result = await pool.query(query, params);
    const purchases = result.rows as PurchaseRow[];

    return NextResponse.json({
      success: true,
      data: purchases
    });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการซื้อ'
      },
      { status: 500 }
    );
  }
}

// POST /api/purchases - Create a new purchase
export async function POST(request: NextRequest) {
  const pool = getDbPool();
  const client = await pool.connect();

  try {
    const body = await request.json();
    const { total_amount, notes, purchase_datetime, items } = body;

    // Validate input
    const validation = validatePurchase({ total_amount, purchase_datetime, items });
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'ข้อมูลไม่ถูกต้อง',
          errors: validation.errors
        },
        { status: 400 }
      );
    }

    // Start transaction
    await client.query('BEGIN');

    // Insert purchase
    const purchaseResult = await client.query(
      `INSERT INTO purchase (
        total_amount, 
        notes, 
        purchase_datetime,
        is_deleted,
        create_datetime, 
        update_datetime
      )
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING purchase_id, total_amount, notes, purchase_datetime, is_deleted, create_datetime, update_datetime`,
      [total_amount, notes || null, purchase_datetime, false]
    );

    const purchase = purchaseResult.rows[0] as PurchaseRow;

    // Insert purchase ingredient items
    if (items && items.length > 0) {
      for (const item of items as PurchaseIngredientItem[]) {
        await client.query(
          `INSERT INTO "purchaseIngredient" (purchase_id, ingredient_id, quantity_purchased, unit_cost)
           VALUES ($1, $2, $3, $4)`,
          [purchase.purchase_id, item.ingredient_id, item.quantity_purchased, item.unit_cost]
        );
      }
    }

    // Commit transaction
    await client.query('COMMIT');

    return NextResponse.json(
      {
        success: true,
        data: purchase,
        message: 'สร้างการซื้อสำเร็จ'
      },
      { status: 201 }
    );
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating purchase:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการสร้างการซื้อ'
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
