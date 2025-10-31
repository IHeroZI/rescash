import { NextRequest, NextResponse } from 'next/server';
import { queryDb, getDbPool } from '@/lib/db/connection';
import { validateMenu } from '@/lib/validation/validationSchemas';

interface MenuRow {
  menu_id: number;
  menu_name: string;
  description: string | null;
  price: number;
  recipe: string | null;
  is_available: boolean;
  menu_image_url: string | null;
  create_datetime: string;
  update_datetime: string;
}

// GET /api/menus - Get all menus
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isAvailable = searchParams.get('is_available');
    const search = searchParams.get('search');

    let query = `
      SELECT 
        menu_id, 
        menu_name, 
        description, 
        price, 
        recipe, 
        is_available, 
        menu_image_url, 
        create_datetime,  
        update_datetime 
      FROM menu 
      WHERE 1=1
    `;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any[] = [];
    let paramIndex = 1;

    if (isAvailable !== null && isAvailable !== undefined) {
      query += ` AND is_available = $${paramIndex}`;
      params.push(isAvailable === 'true');
      paramIndex++;
    }

    if (search) {
      query += ` AND menu_name ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ' ORDER BY create_datetime DESC';

    const menus = await queryDb<MenuRow>(query, params);

    return NextResponse.json({
      success: true,
      data: menus
    });
  } catch (error) {
    console.error('Error fetching menus:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลเมนู'
      },
      { status: 500 }
    );
  }
}

// POST /api/menus - Create a new menu
export async function POST(request: NextRequest) {
  const pool = getDbPool();
  const client = await pool.connect();

  try {
    const body = await request.json();
    const { menu_name, description, price, recipe, is_available = true, menu_image_url, ingredients = [] } = body;

    // Validate input
    const validation = validateMenu({ menu_name, description, price, recipe });
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

    // Validate ingredients if provided
    if (Array.isArray(ingredients) && ingredients.length > 0) {
      for (const ing of ingredients) {
        if (!ing.ingredient_id || !ing.quantity_required) {
          return NextResponse.json(
            {
              success: false,
              error: 'ข้อมูลวัตถุดิบไม่ครบถ้วน'
            },
            { status: 400 }
          );
        }
        if (ing.quantity_required <= 0) {
          return NextResponse.json(
            {
              success: false,
              error: 'จำนวนวัตถุดิบต้องมากกว่า 0'
            },
            { status: 400 }
          );
        }
      }
    }

    // Start transaction
    await client.query('BEGIN');

    // Insert new menu
    const result = await client.query<MenuRow>(
      `INSERT INTO menu (menu_name, description, price, recipe, is_available, menu_image_url, create_datetime, update_datetime)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING menu_id, menu_name, description, price, recipe, is_available, menu_image_url, create_datetime, update_datetime`,
      [
        menu_name.trim(),
        description?.trim() || null,
        price,
        recipe?.trim() || null,
        is_available,
        menu_image_url || null
      ]
    );

    const newMenu = result.rows[0];

    // Insert menu ingredients if provided
    if (Array.isArray(ingredients) && ingredients.length > 0) {
      const values: (number | string)[] = [];
      const placeholders: string[] = [];
      let paramIndex = 1;

      ingredients.forEach((ing: { ingredient_id: number; quantity_required: number }) => {
        placeholders.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2})`);
        values.push(newMenu.menu_id, ing.ingredient_id, ing.quantity_required);
        paramIndex += 3;
      });

      const insertQuery = `
        INSERT INTO "menuIngredient" (menu_id, ingredient_id, quantity_required)
        VALUES ${placeholders.join(', ')}
      `;

      await client.query(insertQuery, values);
    }

    // Commit transaction
    await client.query('COMMIT');

    return NextResponse.json(
      {
        success: true,
        data: newMenu,
        message: 'สร้างเมนูสำเร็จ'
      },
      { status: 201 }
    );
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating menu:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการสร้างเมนู'
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
