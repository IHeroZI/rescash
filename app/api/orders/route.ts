import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db/connection';
import { validateOrder } from '@/lib/validation/validationSchemas';

interface OrderRow {
  order_id: number;
  user_id: number;
  total_amount: number;
  order_status: string;
  create_datetime: string;
  update_datetime: string;
  notes: string | null;
  appointment_time: string;
  public_order_id: string;
  qr_url: string | null;
  slip_url: string | null;
}

interface OrderWithUser extends OrderRow {
  user_name: string | null;
  user_phone: string | null;
  user_profile_image_url: string | null;
}

interface MenuOrderItem {
  menu_id: number;
  quantity: number;
  price_at_order_time: number;
}

// GET /api/orders - Get all orders
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('user_id');
    const orderStatus = searchParams.get('order_status');

    let query = `
      SELECT 
        o.order_id, 
        o.user_id, 
        o.total_amount, 
        o.order_status, 
        o.create_datetime, 
        o.update_datetime,
        o.notes,
        o.appointment_time,
        o.public_order_id,
        o.qr_url,
        o.slip_url,
        u.name as user_name,
        u.phone as user_phone,
        u.profile_image_url as user_profile_image_url
      FROM "order" o
      LEFT JOIN users u ON o.user_id = u.user_id
      WHERE 1=1
    `;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any[] = [];
    let paramIndex = 1;

    if (userId) {
      query += ` AND o.user_id = $${paramIndex}`;
      params.push(parseInt(userId));
      paramIndex++;
    }

    if (orderStatus) {
      query += ` AND o.order_status = $${paramIndex}`;
      params.push(orderStatus);
      paramIndex++;
    }

    query += ' ORDER BY o.update_datetime DESC';

    const pool = getDbPool();
    const result = await pool.query(query, params);
    const orders = result.rows as OrderWithUser[];

    // Transform to match expected format
    const transformedOrders = orders.map(order => ({
      order_id: order.order_id,
      user_id: order.user_id,
      total_amount: order.total_amount,
      order_status: order.order_status,
      create_datetime: order.create_datetime,
      update_datetime: order.update_datetime,
      notes: order.notes,
      appointment_time: order.appointment_time,
      public_order_id: order.public_order_id,
      qr_url: order.qr_url,
      slip_url: order.slip_url,
      user: order.user_name ? {
        name: order.user_name,
        phone: order.user_phone,
        profile_image_url: order.user_profile_image_url
      } : undefined
    }));

    return NextResponse.json({
      success: true,
      data: transformedOrders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ'
      },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create a new order
export async function POST(request: NextRequest) {
  const pool = getDbPool();
  const client = await pool.connect();

  try {
    const body = await request.json();
    const { 
      user_id, 
      total_amount, 
      appointment_time, 
      notes, 
      public_order_id,
      qr_url,
      items 
    } = body;

    // Validate input
    const validation = validateOrder({ user_id, total_amount, appointment_time, items });
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

    // Insert order
    const orderResult = await client.query(
      `INSERT INTO "order" (
        user_id, 
        total_amount, 
        order_status, 
        appointment_time,
        notes,
        public_order_id,
        qr_url,
        create_datetime, 
        update_datetime
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING order_id, user_id, total_amount, order_status, appointment_time, notes, public_order_id, qr_url, slip_url, create_datetime, update_datetime`,
      [user_id, total_amount, 'pending', appointment_time, notes || null, public_order_id, qr_url || null]
    );

    const order = orderResult.rows[0] as OrderRow;

    // Insert menu order items
    if (items && items.length > 0) {
      for (const item of items as MenuOrderItem[]) {
        await client.query(
          `INSERT INTO "menuOrder" (menu_id, order_id, quantity, price_at_order_time)
           VALUES ($1, $2, $3, $4)`,
          [item.menu_id, order.order_id, item.quantity, item.price_at_order_time]
        );
      }
    }

    // Commit transaction
    await client.query('COMMIT');

    return NextResponse.json(
      {
        success: true,
        data: order,
        message: 'สร้างคำสั่งซื้อสำเร็จ'
      },
      { status: 201 }
    );
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating order:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ'
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
