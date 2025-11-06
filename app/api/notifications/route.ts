import { NextRequest, NextResponse } from 'next/server';
import { queryDb, queryDbSingle } from '@/lib/db/connection';

interface NotificationRow {
  noti_id: number;
  user_id: number;
  order_id: number | null;
  message: string;
  create_datetime: string;
  is_read: boolean;
}

// GET /api/notifications - Get all notifications
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('user_id');
    const isRead = searchParams.get('is_read');

    let query = `
      SELECT 
        noti_id, 
        user_id, 
        order_id, 
        message, 
        create_datetime, 
        is_read
      FROM notification
      WHERE 1=1
    `;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any[] = [];
    let paramIndex = 1;

    if (userId) {
      query += ` AND user_id = $${paramIndex}`;
      params.push(parseInt(userId));
      paramIndex++;
    }

    if (isRead !== null && isRead !== undefined) {
      query += ` AND is_read = $${paramIndex}`;
      params.push(isRead === 'true');
      paramIndex++;
    }

    query += ' ORDER BY create_datetime DESC';

    const notifications = await queryDb<NotificationRow>(query, params);

    return NextResponse.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการแจ้งเตือน'
      },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create a new notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, order_id, message } = body;

    if (!user_id || !message) {
      return NextResponse.json(
        {
          success: false,
          error: 'กรุณาระบุข้อมูลให้ครบถ้วน'
        },
        { status: 400 }
      );
    }

    const result = await queryDbSingle<NotificationRow>(
      `INSERT INTO notification (user_id, order_id, message, create_datetime, is_read)
       VALUES ($1, $2, $3, NOW(), FALSE)
       RETURNING noti_id, user_id, order_id, message, create_datetime, is_read`,
      [user_id, order_id || null, message]
    );

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: 'สร้างการแจ้งเตือนสำเร็จ'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการสร้างการแจ้งเตือน'
      },
      { status: 500 }
    );
  }
}
