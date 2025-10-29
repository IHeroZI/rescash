// Validation error type
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Helper functions
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  // Thai phone number format (10 digits starting with 0)
  const phoneRegex = /^0\d{9}$/;
  return phoneRegex.test(phone.replace(/[-\s]/g, ''));
}

export function isValidPrice(price: number): boolean {
  return price > 0 && price <= 999999.99;
}

export function isValidQuantity(quantity: number): boolean {
  return quantity > 0 && quantity <= 9999;
}

// User validation
export interface UserValidationData {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  role?: string;
}

export function validateUser(data: UserValidationData, isUpdate = false): ValidationResult {
  const errors: ValidationError[] = [];

  if (!isUpdate || data.name !== undefined) {
    if (!data.name || data.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'กรุณากรอกชื่อ' });
    } else if (data.name.trim().length < 2) {
      errors.push({ field: 'name', message: 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร' });
    } else if (data.name.trim().length > 100) {
      errors.push({ field: 'name', message: 'ชื่อต้องไม่เกิน 100 ตัวอักษร' });
    }
  }

  if (!isUpdate || data.email !== undefined) {
    if (!data.email || data.email.trim().length === 0) {
      errors.push({ field: 'email', message: 'กรุณากรอกอีเมล' });
    } else if (!isValidEmail(data.email)) {
      errors.push({ field: 'email', message: 'รูปแบบอีเมลไม่ถูกต้อง' });
    } else if (data.email.length > 100) {
      errors.push({ field: 'email', message: 'อีเมลต้องไม่เกิน 100 ตัวอักษร' });
    }
  }

  if (!isUpdate || data.phone !== undefined) {
    if (data.phone && data.phone.trim().length > 0) {
      if (!isValidPhone(data.phone)) {
        errors.push({ field: 'phone', message: 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (ต้องเป็นเลข 10 หลัก)' });
      }
    }
  }

  if (data.password !== undefined && data.password.length > 0) {
    if (data.password.length < 6) {
      errors.push({ field: 'password', message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
    } else if (data.password.length > 255) {
      errors.push({ field: 'password', message: 'รหัสผ่านต้องไม่เกิน 255 ตัวอักษร' });
    }
  }

  if (data.role !== undefined) {
    const validRoles = ['customer', 'staff', 'admin'];
    if (!validRoles.includes(data.role)) {
      errors.push({ field: 'role', message: 'บทบาทไม่ถูกต้อง' });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Menu validation
export interface MenuValidationData {
  menu_name?: string;
  description?: string;
  price?: number;
  recipe?: string;
}

export function validateMenu(data: MenuValidationData, isUpdate = false): ValidationResult {
  const errors: ValidationError[] = [];

  if (!isUpdate || data.menu_name !== undefined) {
    if (!data.menu_name || data.menu_name.trim().length === 0) {
      errors.push({ field: 'menu_name', message: 'กรุณากรอกชื่อเมนู' });
    } else if (data.menu_name.trim().length < 2) {
      errors.push({ field: 'menu_name', message: 'ชื่อเมนูต้องมีอย่างน้อย 2 ตัวอักษร' });
    } else if (data.menu_name.trim().length > 100) {
      errors.push({ field: 'menu_name', message: 'ชื่อเมนูต้องไม่เกิน 100 ตัวอักษร' });
    }
  }

  if (!isUpdate || data.price !== undefined) {
    if (data.price === undefined || data.price === null) {
      errors.push({ field: 'price', message: 'กรุณากรอกราคา' });
    } else if (!isValidPrice(data.price)) {
      errors.push({ field: 'price', message: 'ราคาต้องมากกว่า 0 และไม่เกิน 999,999.99 บาท' });
    }
  }

  if (data.description !== undefined && data.description && data.description.length > 1000) {
    errors.push({ field: 'description', message: 'คำอธิบายต้องไม่เกิน 1000 ตัวอักษร' });
  }

  if (data.recipe !== undefined && data.recipe && data.recipe.length > 5000) {
    errors.push({ field: 'recipe', message: 'สูตรต้องไม่เกิน 5000 ตัวอักษร' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Ingredient validation
export interface IngredientValidationData {
  ingredient_name?: string;
  unit_of_measure?: string;
}

export function validateIngredient(data: IngredientValidationData, isUpdate = false): ValidationResult {
  const errors: ValidationError[] = [];

  if (!isUpdate || data.ingredient_name !== undefined) {
    if (!data.ingredient_name || data.ingredient_name.trim().length === 0) {
      errors.push({ field: 'ingredient_name', message: 'กรุณากรอกชื่อวัตถุดิบ' });
    } else if (data.ingredient_name.trim().length < 2) {
      errors.push({ field: 'ingredient_name', message: 'ชื่อวัตถุดิบต้องมีอย่างน้อย 2 ตัวอักษร' });
    } else if (data.ingredient_name.trim().length > 100) {
      errors.push({ field: 'ingredient_name', message: 'ชื่อวัตถุดิบต้องไม่เกิน 100 ตัวอักษร' });
    }
  }

  if (!isUpdate || data.unit_of_measure !== undefined) {
    if (!data.unit_of_measure || data.unit_of_measure.trim().length === 0) {
      errors.push({ field: 'unit_of_measure', message: 'กรุณาเลือกหน่วยวัด' });
    } else if (data.unit_of_measure.trim().length > 50) {
      errors.push({ field: 'unit_of_measure', message: 'หน่วยวัดต้องไม่เกิน 50 ตัวอักษร' });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Order validation
export interface OrderValidationData {
  user_id?: number;
  total_amount?: number;
  appointment_time?: string;
  items?: Array<{ menu_id: number; quantity: number; price_at_order_time: number }>;
}

export function validateOrder(data: OrderValidationData, isUpdate = false): ValidationResult {
  const errors: ValidationError[] = [];

  if (!isUpdate || data.user_id !== undefined) {
    if (!data.user_id || data.user_id <= 0) {
      errors.push({ field: 'user_id', message: 'กรุณาระบุผู้ใช้' });
    }
  }

  if (!isUpdate || data.total_amount !== undefined) {
    if (data.total_amount === undefined || data.total_amount === null) {
      errors.push({ field: 'total_amount', message: 'กรุณาระบุยอดรวม' });
    } else if (!isValidPrice(data.total_amount)) {
      errors.push({ field: 'total_amount', message: 'ยอดรวมต้องมากกว่า 0 และไม่เกิน 999,999.99 บาท' });
    }
  }

  if (!isUpdate || data.appointment_time !== undefined) {
    if (!data.appointment_time) {
      errors.push({ field: 'appointment_time', message: 'กรุณาระบุเวลานัดรับ' });
    } else {
      const appointmentDate = new Date(data.appointment_time);
      if (isNaN(appointmentDate.getTime())) {
        errors.push({ field: 'appointment_time', message: 'รูปแบบเวลาไม่ถูกต้อง' });
      }
    }
  }

  if (!isUpdate && data.items !== undefined) {
    if (!data.items || data.items.length === 0) {
      errors.push({ field: 'items', message: 'กรุณาเลือกเมนูอย่างน้อย 1 รายการ' });
    } else {
      data.items.forEach((item, index) => {
        if (!item.menu_id || item.menu_id <= 0) {
          errors.push({ field: `items[${index}].menu_id`, message: `รายการที่ ${index + 1}: menu_id ไม่ถูกต้อง` });
        }
        if (!isValidQuantity(item.quantity)) {
          errors.push({ field: `items[${index}].quantity`, message: `รายการที่ ${index + 1}: จำนวนต้องมากกว่า 0` });
        }
        if (!isValidPrice(item.price_at_order_time)) {
          errors.push({ field: `items[${index}].price_at_order_time`, message: `รายการที่ ${index + 1}: ราคาไม่ถูกต้อง` });
        }
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Purchase validation
export interface PurchaseValidationData {
  total_amount?: number;
  purchase_datetime?: string;
  items?: Array<{ ingredient_id: number; quantity_purchased: number; unit_cost: number }>;
}

export function validatePurchase(data: PurchaseValidationData, isUpdate = false): ValidationResult {
  const errors: ValidationError[] = [];

  if (!isUpdate || data.total_amount !== undefined) {
    if (data.total_amount === undefined || data.total_amount === null) {
      errors.push({ field: 'total_amount', message: 'กรุณาระบุยอดรวม' });
    } else if (!isValidPrice(data.total_amount)) {
      errors.push({ field: 'total_amount', message: 'ยอดรวมต้องมากกว่า 0 และไม่เกิน 999,999.99 บาท' });
    }
  }

  if (!isUpdate || data.purchase_datetime !== undefined) {
    if (!data.purchase_datetime) {
      errors.push({ field: 'purchase_datetime', message: 'กรุณาระบุวันที่ซื้อ' });
    } else {
      const purchaseDate = new Date(data.purchase_datetime);
      if (isNaN(purchaseDate.getTime())) {
        errors.push({ field: 'purchase_datetime', message: 'รูปแบบวันที่ไม่ถูกต้อง' });
      }
    }
  }

  if (!isUpdate && data.items !== undefined) {
    if (!data.items || data.items.length === 0) {
      errors.push({ field: 'items', message: 'กรุณาเลือกวัตถุดิบอย่างน้อย 1 รายการ' });
    } else {
      data.items.forEach((item, index) => {
        if (!item.ingredient_id || item.ingredient_id <= 0) {
          errors.push({ field: `items[${index}].ingredient_id`, message: `รายการที่ ${index + 1}: ingredient_id ไม่ถูกต้อง` });
        }
        if (!isValidQuantity(item.quantity_purchased)) {
          errors.push({ field: `items[${index}].quantity_purchased`, message: `รายการที่ ${index + 1}: จำนวนต้องมากกว่า 0` });
        }
        if (!isValidPrice(item.unit_cost)) {
          errors.push({ field: `items[${index}].unit_cost`, message: `รายการที่ ${index + 1}: ราคาต่อหน่วยไม่ถูกต้อง` });
        }
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
