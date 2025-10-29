import { NextRequest, NextResponse } from 'next/server';
import { queryDbSingle } from '@/lib/db/connection';

interface NotificationRow {
  noti_id: number;
  user_id: number;
  order_id: number | null;
  message: string;
  create_datetime: string;
  is_read: boolean;
}

interface RouteParams {
  params: Promise<{
    notificationId: string;
  }>;
}

// GET /api/notifications/[notificationId] - Get a single notification
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { notificationId } = await params;
    const notiIdNum = parseInt(notificationId);

    if (isNaN(notiIdNum)) {
      return NextResponse.json(
        {
          success: false,
          error: 'รหัสการแจ้งเตือนไม่ถูกต้อง'
        },
        { status: 400 }
      );
    }

    const notification = await queryDbSingle<NotificationRow>(
      `SELECT 
        noti_id, 
        user_id, 
        order_id, 
        message, 
        create_datetime, 
        is_read
       FROM notification
       WHERE noti_id = $1`,
      [notiIdNum]
    );

    if (!notification) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบการแจ้งเตือน'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error fetching notification:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการแจ้งเตือน'
      },
      { status: 500 }
    );
  }
}

// PUT /api/notifications/[notificationId] - Update notification (mark as read)
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { notificationId } = await params;
    const notiIdNum = parseInt(notificationId);

    if (isNaN(notiIdNum)) {
      return NextResponse.json(
        {
          success: false,
          error: 'รหัสการแจ้งเตือนไม่ถูกต้อง'
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { is_read } = body;

    const existingNotification = await queryDbSingle<NotificationRow>(
      'SELECT noti_id FROM notification WHERE noti_id = $1',
      [notiIdNum]
    );

    if (!existingNotification) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบการแจ้งเตือน'
        },
        { status: 404 }
      );
    }

    const updatedNotification = await queryDbSingle<NotificationRow>(
      `UPDATE notification
       SET is_read = $1
       WHERE noti_id = $2
       RETURNING noti_id, user_id, order_id, message, create_datetime, is_read`,
      [is_read !== undefined ? is_read : true, notiIdNum]
    );

    return NextResponse.json({
      success: true,
      data: updatedNotification,
      message: 'อัปเดตการแจ้งเตือนสำเร็จ'
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการอัปเดตการแจ้งเตือน'
      },
      { status: 500 }
    );
  }
}
