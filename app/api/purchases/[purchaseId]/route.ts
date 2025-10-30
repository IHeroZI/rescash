import { NextRequest, NextResponse } from 'next/server';
import { getDbPool, queryDbSingle } from '@/lib/db/connection';

interface PurchaseRow {
  purchase_id: number;
  total_amount: number;
  notes: string | null;
  purchase_datetime: string;
  is_deleted: boolean;
  create_datetime: string;
  update_datetime: string;
}

interface PurchaseIngredientRow {
  ingredient_id: number;
  ingredient_name: string;
  quantity_purchased: number;
  unit_cost: number;
  unit_of_measure: string;
}

interface RouteParams {
  params: Promise<{
    purchaseId: string;
  }>;
}

// GET /api/purchases/[purchaseId] - Get a single purchase by ID with details
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { purchaseId } = await params;
    const purchaseIdNum = parseInt(purchaseId);

    if (isNaN(purchaseIdNum)) {
      return NextResponse.json(
        {
          success: false,
          error: 'รหัสการซื้อไม่ถูกต้อง'
        },
        { status: 400 }
      );
    }

    const pool = getDbPool();

    // Get purchase
    const purchaseResult = await pool.query(
      `SELECT 
        purchase_id, 
        total_amount, 
        notes, 
        purchase_datetime, 
        is_deleted, 
        create_datetime, 
        update_datetime
       FROM purchase
       WHERE purchase_id = $1`,
      [purchaseIdNum]
    );

    if (purchaseResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบการซื้อ'
        },
        { status: 404 }
      );
    }

    const purchase = purchaseResult.rows[0] as PurchaseRow;

    // Get ingredient items for this purchase
    const itemsResult = await pool.query(
      `SELECT 
        pi.ingredient_id,
        i.ingredient_name,
        pi.quantity_purchased,
        pi.unit_cost,
        i.unit_of_measure
       FROM "purchaseIngredient" pi
       JOIN ingredient i ON pi.ingredient_id = i.ingredient_id
       WHERE pi.purchase_id = $1`,
      [purchaseIdNum]
    );

    const items = itemsResult.rows as PurchaseIngredientRow[];

    const purchaseDetail = {
      ...purchase,
      items
    };

    return NextResponse.json({
      success: true,
      data: purchaseDetail
    });
  } catch (error) {
    console.error('Error fetching purchase:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการซื้อ'
      },
      { status: 500 }
    );
  }
}

// PUT /api/purchases/[purchaseId] - Update a purchase with items
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  const pool = getDbPool();
  const client = await pool.connect();

  try {
    const { purchaseId } = await params;
    const purchaseIdNum = parseInt(purchaseId);

    if (isNaN(purchaseIdNum)) {
      return NextResponse.json(
        {
          success: false,
          error: 'รหัสการซื้อไม่ถูกต้อง'
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { total_amount, notes, purchase_datetime, is_deleted, items } = body;

    // Check if purchase exists
    const existingPurchase = await queryDbSingle<PurchaseRow>(
      'SELECT purchase_id FROM purchase WHERE purchase_id = $1',
      [purchaseIdNum]
    );

    if (!existingPurchase) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบการซื้อ'
        },
        { status: 404 }
      );
    }

    // Start transaction
    await client.query('BEGIN');

    // Build update query dynamically for purchase table
    const updates: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const values: any[] = [];
    let paramIndex = 1;

    if (total_amount !== undefined) {
      updates.push(`total_amount = $${paramIndex}`);
      values.push(total_amount);
      paramIndex++;
    }

    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex}`);
      values.push(notes);
      paramIndex++;
    }

    if (purchase_datetime !== undefined) {
      updates.push(`purchase_datetime = $${paramIndex}`);
      values.push(purchase_datetime);
      paramIndex++;
    }

    if (is_deleted !== undefined) {
      updates.push(`is_deleted = $${paramIndex}`);
      values.push(is_deleted);
      paramIndex++;
    }

    updates.push(`update_datetime = NOW()`);
    values.push(purchaseIdNum);

    const query = `
      UPDATE purchase
      SET ${updates.join(', ')}
      WHERE purchase_id = $${paramIndex}
      RETURNING purchase_id, total_amount, notes, purchase_datetime, is_deleted, create_datetime, update_datetime
    `;

    const result = await client.query(query, values);
    const updatedPurchase = result.rows[0] as PurchaseRow;

    // Update purchase ingredients if provided
    if (items !== undefined && Array.isArray(items)) {
      // Delete old items
      await client.query(
        'DELETE FROM "purchaseIngredient" WHERE purchase_id = $1',
        [purchaseIdNum]
      );

      // Insert new items
      if (items.length > 0) {
        for (const item of items) {
          await client.query(
            `INSERT INTO "purchaseIngredient" (purchase_id, ingredient_id, quantity_purchased, unit_cost)
             VALUES ($1, $2, $3, $4)`,
            [purchaseIdNum, item.ingredient_id, item.quantity_purchased, item.unit_cost]
          );
        }
      }
    }

    // Commit transaction
    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      data: updatedPurchase,
      message: 'อัปเดตการซื้อสำเร็จ'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating purchase:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการอัปเดตการซื้อ'
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// DELETE /api/purchases/[purchaseId] - Delete a purchase (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { purchaseId } = await params;
    const purchaseIdNum = parseInt(purchaseId);

    if (isNaN(purchaseIdNum)) {
      return NextResponse.json(
        {
          success: false,
          error: 'รหัสการซื้อไม่ถูกต้อง'
        },
        { status: 400 }
      );
    }

    // Check if purchase exists
    const existingPurchase = await queryDbSingle<PurchaseRow>(
      'SELECT purchase_id FROM purchase WHERE purchase_id = $1',
      [purchaseIdNum]
    );

    if (!existingPurchase) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบการซื้อ'
        },
        { status: 404 }
      );
    }

    // Soft delete
    const pool = getDbPool();
    await pool.query(
      'UPDATE purchase SET is_deleted = TRUE, update_datetime = NOW() WHERE purchase_id = $1',
      [purchaseIdNum]
    );

    return NextResponse.json({
      success: true,
      message: 'ลบการซื้อสำเร็จ'
    });
  } catch (error) {
    console.error('Error deleting purchase:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการลบการซื้อ'
      },
      { status: 500 }
    );
  }
}
