import { NextRequest, NextResponse } from 'next/server';
import { queryDbSingle } from '@/lib/db/connection';
import { validateUser } from '@/lib/validation/validationSchemas';

interface UserRow {
  user_id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  profile_image_url: string | null;
  create_datetime: string;
  update_datetime: string;
}

interface RouteParams {
  params: Promise<{
    userId: string;
  }>;
}

// GET /api/users/[userId] - Get a single user by ID
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { userId } = await params;
    const userIdNum = parseInt(userId);

    if (isNaN(userIdNum)) {
      return NextResponse.json(
        {
          success: false,
          error: 'รหัสผู้ใช้ไม่ถูกต้อง'
        },
        { status: 400 }
      );
    }

    const user = await queryDbSingle<UserRow>(
      `SELECT 
        user_id, 
        name, 
        email, 
        phone, 
        role, 
        profile_image_url, 
        create_datetime, 
        update_datetime
       FROM users
       WHERE user_id = $1`,
      [userIdNum]
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบผู้ใช้'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้'
      },
      { status: 500 }
    );
  }
}

// PUT /api/users/[userId] - Update a user
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { userId } = await params;
    const userIdNum = parseInt(userId);

    if (isNaN(userIdNum)) {
      return NextResponse.json(
        {
          success: false,
          error: 'รหัสผู้ใช้ไม่ถูกต้อง'
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, email, phone, role, profile_image_url } = body;

    // Validate input
    const validation = validateUser({ name, email, phone, role }, true);
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

    // Check if user exists
    const existingUser = await queryDbSingle<UserRow>(
      'SELECT user_id FROM users WHERE user_id = $1',
      [userIdNum]
    );

    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบผู้ใช้'
        },
        { status: 404 }
      );
    }

    // Check if email is being changed and if it's already taken
    if (email) {
      const emailTaken = await queryDbSingle<UserRow>(
        'SELECT user_id FROM users WHERE email = $1 AND user_id != $2',
        [email, userIdNum]
      );

      if (emailTaken) {
        return NextResponse.json(
          {
            success: false,
            error: 'อีเมลนี้ถูกใช้งานแล้ว',
            errors: [{ field: 'email', message: 'อีเมลนี้ถูกใช้งานแล้ว' }]
          },
          { status: 400 }
        );
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      values.push(name.trim());
      paramIndex++;
    }

    if (email !== undefined) {
      updates.push(`email = $${paramIndex}`);
      values.push(email.trim());
      paramIndex++;
    }

    if (phone !== undefined) {
      updates.push(`phone = $${paramIndex}`);
      values.push(phone?.trim() || null);
      paramIndex++;
    }

    if (role !== undefined) {
      updates.push(`role = $${paramIndex}`);
      values.push(role);
      paramIndex++;
    }

    if (profile_image_url !== undefined) {
      updates.push(`profile_image_url = $${paramIndex}`);
      values.push(profile_image_url);
      paramIndex++;
    }

    updates.push(`update_datetime = NOW()`);
    values.push(userIdNum);

    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE user_id = $${paramIndex}
      RETURNING user_id, name, email, phone, role, profile_image_url, create_datetime, update_datetime
    `;

    const updatedUser = await queryDbSingle<UserRow>(query, values);

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'อัปเดตผู้ใช้สำเร็จ'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการอัปเดตผู้ใช้'
      },
      { status: 500 }
    );
  }
}
