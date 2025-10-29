import { NextRequest, NextResponse } from 'next/server';
import { queryDb, queryDbSingle } from '@/lib/db/connection';
import { validateIngredient } from '@/lib/validation/validationSchemas';

interface IngredientRow {
  ingredient_id: number;
  ingredient_name: string;
  unit_of_measure: string;
  is_available: boolean;
  create_datetime: string;
  update_datetime: string;
}

// GET /api/ingredients - Get all ingredients
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isAvailable = searchParams.get('is_available');

    let query = `
      SELECT 
        ingredient_id, 
        ingredient_name, 
        unit_of_measure, 
        is_available, 
        create_datetime, 
        update_datetime
      FROM ingredient
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

    query += ' ORDER BY create_datetime DESC';

    const ingredients = await queryDb<IngredientRow>(query, params);

    return NextResponse.json({
      success: true,
      data: ingredients
    });
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลวัตถุดิบ'
      },
      { status: 500 }
    );
  }
}

// POST /api/ingredients - Create a new ingredient
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ingredient_name, unit_of_measure, is_available = true } = body;

    // Validate input
    const validation = validateIngredient({ ingredient_name, unit_of_measure });
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

    // Insert new ingredient
    const result = await queryDbSingle<IngredientRow>(
      `INSERT INTO ingredient (ingredient_name, unit_of_measure, is_available, create_datetime, update_datetime)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING ingredient_id, ingredient_name, unit_of_measure, is_available, create_datetime, update_datetime`,
      [ingredient_name.trim(), unit_of_measure.trim(), is_available]
    );

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: 'สร้างวัตถุดิบสำเร็จ'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating ingredient:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการสร้างวัตถุดิบ'
      },
      { status: 500 }
    );
  }
}
