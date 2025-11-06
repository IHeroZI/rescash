"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/common/Header";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Activity } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  orderCount: number;
  completedOrderCount: number;
  monthlyData: {
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
    orders: number;
  }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Fetch orders (completed only for revenue)
      const { data: orders, error: ordersError } = await supabase
        .from("order")
        .select("total_amount, order_status, create_datetime")
        .gte("create_datetime", `${selectedYear}-01-01`)
        .lte("create_datetime", `${selectedYear}-12-31`);

      if (ordersError) throw ordersError;

      // Fetch purchases
      const { data: purchases, error: purchasesError } = await supabase
        .from("purchase")
        .select("total_amount, purchase_datetime")
        .eq("is_deleted", false)
        .gte("purchase_datetime", `${selectedYear}-01-01`)
        .lte("purchase_datetime", `${selectedYear}-12-31`);

      if (purchasesError) throw purchasesError;

      // Calculate total stats
      const completedOrders = orders?.filter((o) => o.order_status === "completed") || [];
      const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total_amount, 0);
      const totalExpenses = purchases?.reduce((sum, p) => sum + p.total_amount, 0) || 0;
      const totalProfit = totalRevenue - totalExpenses;

      // Calculate monthly data
      const monthlyData = [];
      for (let month = 1; month <= 12; month++) {
        const monthStr = month.toString().padStart(2, "0");
        const startDate = `${selectedYear}-${monthStr}-01`;
        const endDate = `${selectedYear}-${monthStr}-31`;

        const monthOrders = completedOrders.filter(
          (o) => o.create_datetime >= startDate && o.create_datetime <= endDate
        );
        const monthPurchases = purchases?.filter(
          (p) => p.purchase_datetime >= startDate && p.purchase_datetime <= endDate
        ) || [];

        const revenue = monthOrders.reduce((sum, o) => sum + o.total_amount, 0);
        const expenses = monthPurchases.reduce((sum, p) => sum + p.total_amount, 0);

        monthlyData.push({
          month: new Date(selectedYear, month - 1).toLocaleDateString("th-TH", {
            month: "short",
          }),
          revenue,
          expenses,
          profit: revenue - expenses,
          orders: monthOrders.length,
        });
      }

      setStats({
        totalRevenue,
        totalExpenses,
        totalProfit,
        orderCount: orders?.length || 0,
        completedOrderCount: completedOrders.length,
        monthlyData,
      });
    } catch (error) {
      console.log("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex flex-col h-screen bg-white">
        <Header title="Dashboard" backHref="/admin/staff-management" showNotificationIcon={true} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-600">กำลังโหลด...</div>
        </div>
      </div>
    );
  }

  const profitMargin = stats.totalRevenue > 0 ? ((stats.totalProfit / stats.totalRevenue) * 100).toFixed(1) : "0";

  return (
    <div className="flex flex-col h-screen bg-white">
      <Header title="Dashboard" backHref="/more" showNotificationIcon={true} />

      <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-6 pb-6">
        {/* Year Selector */}
        <div className="bg-white">
          <label className="block text-sm font-medium text-gray-700 mb-2">เลือกปี</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent"
          >
            {[2024, 2025, 2026].map((year) => (
              <option key={year} value={year}>
                {year + 543}
              </option>
            ))}
          </select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* Total Revenue */}
          <div className="bg-white p-4 rounded-lg border-2 border-green-500 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <DollarSign size={24} className="text-green-500" />
              <TrendingUp size={20} className="text-green-500" />
            </div>
            <p className="text-sm text-gray-600">รายรับทั้งหมด</p>
            <p className="text-2xl font-bold text-green-600">฿{stats.totalRevenue.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-gray-500 mt-1">{stats.completedOrderCount} ออร์เดอร์</p>
          </div>

          {/* Total Expenses */}
          <div className="bg-white p-4 rounded-lg border-2 border-red-500 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <Package size={24} className="text-red-500" />
              <TrendingDown size={20} className="text-red-500" />
            </div>
            <p className="text-sm text-gray-600">รายจ่ายทั้งหมด</p>
            <p className="text-2xl font-bold text-red-600">฿{stats.totalExpenses.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-gray-500 mt-1">จากการจัดซื้อ</p>
          </div>

          {/* Total Profit */}
          <div className={`bg-white p-4 rounded-lg border-2 ${stats.totalProfit >= 0 ? "border-blue-500" : "border-orange-500"} shadow-sm hover:shadow-md transition-shadow`}>
            <div className="flex items-center justify-between mb-2">
              <Activity size={24} className={stats.totalProfit >= 0 ? "text-blue-500" : "text-orange-500"} />
              {stats.totalProfit >= 0 ? <TrendingUp size={20} className="text-blue-500" /> : <TrendingDown size={20} className="text-orange-500" />}
            </div>
            <p className="text-sm text-gray-600">กำไรสุทธิ</p>
            <p className={`text-2xl font-bold ${stats.totalProfit >= 0 ? "text-blue-600" : "text-orange-600"}`}>
              {stats.totalProfit >= 0 ? "฿" : "-฿"}
              {Math.abs(stats.totalProfit).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500 mt-1">Margin: {profitMargin}%</p>
          </div>

          {/* Total Orders */}
          <div className="bg-white p-4 rounded-lg border-2 border-purple-500 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <ShoppingCart size={24} className="text-purple-500" />
              <Activity size={20} className="text-purple-500" />
            </div>
            <p className="text-sm text-gray-600">จำนวนออร์เดอร์</p>
            <p className="text-2xl font-bold text-purple-600">{stats.orderCount}</p>
            <p className="text-xs text-gray-500 mt-1">สำเร็จ: {stats.completedOrderCount}</p>
          </div>
        </div>

        {/* Revenue vs Expenses Chart */}
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold text-gray-900 mb-4">รายรับ vs รายจ่าย (รายเดือน)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => `฿${value.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#10b981" name="รายรับ" />
              <Bar dataKey="expenses" fill="#ef4444" name="รายจ่าย" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Profit Trend Chart */}
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold text-gray-900 mb-4">แนวโน้มกำไร (รายเดือน)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={stats.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => `฿${value.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="profit" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="กำไร"
                dot={{ fill: "#3b82f6", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Order Count Chart */}
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold text-gray-900 mb-4">จำนวนออร์เดอร์ (รายเดือน)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="orders" fill="#8b5cf6" name="จำนวนออร์เดอร์" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Breakdown Table */}
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold text-gray-900 mb-4">สรุปรายเดือน</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">เดือน</th>
                  <th className="text-right py-2 px-2">รายรับ</th>
                  <th className="text-right py-2 px-2">รายจ่าย</th>
                  <th className="text-right py-2 px-2">กำไร</th>
                  <th className="text-right py-2 px-2">ออร์เดอร์</th>
                </tr>
              </thead>
              <tbody>
                {stats.monthlyData.map((data, index) => (
                  <tr key={index} className="border-b hover:bg-white">
                    <td className="py-2 px-2">{data.month}</td>
                    <td className="text-right py-2 px-2 text-green-600 font-medium">
                      ฿{data.revenue.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="text-right py-2 px-2 text-red-600 font-medium">
                      ฿{data.expenses.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`text-right py-2 px-2 font-medium ${data.profit >= 0 ? "text-blue-600" : "text-orange-600"}`}>
                      {data.profit >= 0 ? "฿" : "-฿"}
                      {Math.abs(data.profit).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="text-right py-2 px-2">{data.orders}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
