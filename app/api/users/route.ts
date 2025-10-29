import { NextRequest, NextResponse } from 'next/server';
import { queryDb, queryDbSingle } from '@/lib/db/connection';
import { validateUser, ValidationError } from '@/lib/validation/validationSchemas';

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

// GET /api/users - Get all users
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role');
    const email = searchParams.get('email');

    let query = `
      SELECT 
        user_id, 
        name, 
        email, 
        phone, 
        role, 
        profile_image_url, 
        create_datetime, 
        update_datetime
      FROM users
      WHERE 1=1
    `;
    
    const params: (string | null)[] = [];
    let paramIndex = 1;

    if (role) {
      query += ` AND role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    if (email) {
      query += ` AND email = $${paramIndex}`;
      params.push(email);
      paramIndex++;
    }

    query += ' ORDER BY create_datetime DESC';

    const users = await queryDb<UserRow>(query, params);

    return NextResponse.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้'
      },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, role = 'customer', profile_image_url } = body;

    // Validate input
    const validation = validateUser({ name, email, phone, role });
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

    // Check if email already exists
    const existingUser = await queryDbSingle<UserRow>(
      'SELECT user_id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'อีเมลนี้ถูกใช้งานแล้ว',
          errors: [{ field: 'email', message: 'อีเมลนี้ถูกใช้งานแล้ว' }] as ValidationError[]
        },
        { status: 400 }
      );
    }

    // Insert new user
    const result = await queryDbSingle<UserRow>(
      `INSERT INTO users (name, email, phone, role, profile_image_url, create_datetime, update_datetime)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING user_id, name, email, phone, role, profile_image_url, create_datetime, update_datetime`,
      [name.trim(), email.trim(), phone?.trim() || null, role, profile_image_url || null]
    );

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: 'สร้างผู้ใช้สำเร็จ'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการสร้างผู้ใช้'
      },
      { status: 500 }
    );
  }
}
