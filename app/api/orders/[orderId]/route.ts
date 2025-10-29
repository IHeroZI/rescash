import { NextRequest, NextResponse } from 'next/server';
import { getDbPool, queryDbSingle } from '@/lib/db/connection';

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

interface OrderDetailRow {
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
  user_name: string | null;
  user_phone: string | null;
  user_email: string | null;
  user_profile_image_url: string | null;
}

interface MenuOrderRow {
  menu_id: number;
  menu_name: string;
  quantity: number;
  price_at_order_time: number;
  menu_image_url: string | null;
}

interface RouteParams {
  params: Promise<{
    orderId: string;
  }>;
}

// GET /api/orders/[orderId] - Get a single order by ID with details
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { orderId } = await params;
    const orderIdNum = parseInt(orderId);

    if (isNaN(orderIdNum)) {
      return NextResponse.json(
        {
          success: false,
          error: 'รหัสคำสั่งซื้อไม่ถูกต้อง'
        },
        { status: 400 }
      );
    }

    const pool = getDbPool();

    // Get order with user details
    const orderResult = await pool.query(
      `SELECT 
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
        u.email as user_email,
        u.profile_image_url as user_profile_image_url
       FROM "order" o
       LEFT JOIN users u ON o.user_id = u.user_id
       WHERE o.order_id = $1`,
      [orderIdNum]
    );

    if (orderResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบคำสั่งซื้อ'
        },
        { status: 404 }
      );
    }

    const orderDetail = orderResult.rows[0] as OrderDetailRow;

    // Get menu items for this order
    const itemsResult = await pool.query(
      `SELECT 
        mo.menu_id,
        m.menu_name,
        mo.quantity,
        mo.price_at_order_time,
        m.menu_image_url
       FROM "menuOrder" mo
       JOIN menu m ON mo.menu_id = m.menu_id
       WHERE mo.order_id = $1`,
      [orderIdNum]
    );

    const items = itemsResult.rows as MenuOrderRow[];

    // Transform to match expected format
    const order = {
      order_id: orderDetail.order_id,
      user_id: orderDetail.user_id,
      total_amount: orderDetail.total_amount,
      order_status: orderDetail.order_status,
      create_datetime: orderDetail.create_datetime,
      update_datetime: orderDetail.update_datetime,
      notes: orderDetail.notes,
      appointment_time: orderDetail.appointment_time,
      public_order_id: orderDetail.public_order_id,
      qr_url: orderDetail.qr_url,
      slip_url: orderDetail.slip_url,
      user: orderDetail.user_name ? {
        name: orderDetail.user_name,
        phone: orderDetail.user_phone,
        email: orderDetail.user_email,
        profile_image_url: orderDetail.user_profile_image_url
      } : undefined,
      items
    };

    return NextResponse.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ'
      },
      { status: 500 }
    );
  }
}

// PUT /api/orders/[orderId] - Update an order
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { orderId } = await params;
    const orderIdNum = parseInt(orderId);

    if (isNaN(orderIdNum)) {
      return NextResponse.json(
        {
          success: false,
          error: 'รหัสคำสั่งซื้อไม่ถูกต้อง'
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { order_status, notes, slip_url, appointment_time } = body;

    // Check if order exists
    const existingOrder = await queryDbSingle<OrderRow>(
      'SELECT order_id FROM "order" WHERE order_id = $1',
      [orderIdNum]
    );

    if (!existingOrder) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบคำสั่งซื้อ'
        },
        { status: 404 }
      );
    }

    // Build update query dynamically
    const updates: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const values: any[] = [];
    let paramIndex = 1;

    if (order_status !== undefined) {
      updates.push(`order_status = $${paramIndex}`);
      values.push(order_status);
      paramIndex++;
    }

    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex}`);
      values.push(notes);
      paramIndex++;
    }

    if (slip_url !== undefined) {
      updates.push(`slip_url = $${paramIndex}`);
      values.push(slip_url);
      paramIndex++;
    }

    if (appointment_time !== undefined) {
      updates.push(`appointment_time = $${paramIndex}`);
      values.push(appointment_time);
      paramIndex++;
    }

    updates.push(`update_datetime = NOW()`);
    values.push(orderIdNum);

    const query = `
      UPDATE "order"
      SET ${updates.join(', ')}
      WHERE order_id = $${paramIndex}
      RETURNING order_id, user_id, total_amount, order_status, appointment_time, notes, public_order_id, qr_url, slip_url, create_datetime, update_datetime
    `;

    const pool = getDbPool();
    const result = await pool.query(query, values);
    const updatedOrder = result.rows[0] as OrderRow;

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: 'อัปเดตคำสั่งซื้อสำเร็จ'
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการอัปเดตคำสั่งซื้อ'
      },
      { status: 500 }
    );
  }
}
