import { NextRequest, NextResponse } from 'next/server';
import { queryDb, getDbPool } from '@/lib/db/connection';

interface MenuIngredientRow {
  menu_id: number;
  ingredient_id: number;
  quantity_required: number;
  ingredient_name?: string;
  unit_of_measure?: string;
}

interface RouteParams {
  params: Promise<{
    menuId: string;
  }>;
}

// GET /api/menus/[menuId]/ingredients - Get all ingredients for a menu
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { menuId } = await params;
    const menuIdNum = parseInt(menuId);

    if (isNaN(menuIdNum)) {
      return NextResponse.json(
        {
          success: false,
          error: 'รหัสเมนูไม่ถูกต้อง'
        },
        { status: 400 }
      );
    }

    // Get menu ingredients with ingredient details
    const ingredients = await queryDb<MenuIngredientRow>(
      `SELECT 
        mi.menu_id,
        mi.ingredient_id,
        mi.quantity_required,
        i.ingredient_name,
        i.unit_of_measure
      FROM "menuIngredient" mi
      JOIN ingredient i ON mi.ingredient_id = i.ingredient_id
      WHERE mi.menu_id = $1
      ORDER BY i.ingredient_name`,
      [menuIdNum]
    );

    return NextResponse.json({
      success: true,
      data: ingredients
    });
  } catch (error) {
    console.error('Error fetching menu ingredients:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลวัตถุดิบของเมนู'
      },
      { status: 500 }
    );
  }
}

// PUT /api/menus/[menuId]/ingredients - Replace all ingredients for a menu
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  const pool = getDbPool();
  const client = await pool.connect();

  try {
    const { menuId } = await params;
    const menuIdNum = parseInt(menuId);

    if (isNaN(menuIdNum)) {
      return NextResponse.json(
        {
          success: false,
          error: 'รหัสเมนูไม่ถูกต้อง'
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { ingredients } = body;

    // Validate ingredients array
    if (!Array.isArray(ingredients)) {
      return NextResponse.json(
        {
          success: false,
          error: 'ข้อมูลวัตถุดิบไม่ถูกต้อง'
        },
        { status: 400 }
      );
    }

    // Validate each ingredient
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

    // Start transaction
    await client.query('BEGIN');

    // Delete old menu ingredients
    await client.query(
      'DELETE FROM "menuIngredient" WHERE menu_id = $1',
      [menuIdNum]
    );

    // Insert new menu ingredients
    if (ingredients.length > 0) {
      const values: (number | string)[] = [];
      const placeholders: string[] = [];
      let paramIndex = 1;

      ingredients.forEach((ing) => {
        placeholders.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2})`);
        values.push(menuIdNum, ing.ingredient_id, ing.quantity_required);
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

    // Fetch updated ingredients with details
    const updatedIngredients = await queryDb<MenuIngredientRow>(
      `SELECT 
        mi.menu_id,
        mi.ingredient_id,
        mi.quantity_required,
        i.ingredient_name,
        i.unit_of_measure
      FROM "menuIngredient" mi
      JOIN ingredient i ON mi.ingredient_id = i.ingredient_id
      WHERE mi.menu_id = $1
      ORDER BY i.ingredient_name`,
      [menuIdNum]
    );

    return NextResponse.json({
      success: true,
      data: updatedIngredients,
      message: 'อัปเดตวัตถุดิบของเมนูสำเร็จ'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating menu ingredients:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการอัปเดตวัตถุดิบของเมนู'
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
