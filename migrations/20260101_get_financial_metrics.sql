-- Function to get financial metrics by Date Range
CREATE OR REPLACE FUNCTION get_financial_metrics(
    p_site_id UUID DEFAULT NULL,
    p_start_date TIMESTAMP DEFAULT NULL,
    p_end_date TIMESTAMP DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_total_revenue NUMERIC;
    v_total_expenses NUMERIC; -- OpEx
    v_total_refunds NUMERIC;
    v_net_profit NUMERIC;
    v_profit_margin NUMERIC;
    
    v_expense_breakdown JSON;
    v_cashflow_data JSON;
    
    -- Payroll estimation (if payroll is not in expenses table)
    -- For now, we assume payroll might be in expenses or we use the 'employees' salary sum * months estimate?
    -- To align with current logic, let's Stick to STRICTLY what's in the DB tables 'sales' and 'expenses'.
    -- If payroll is not there, it won't be counted here, but the UI adds it.
    -- However, for a "True" financial engine, users should be recording payroll as expenses.
    
BEGIN
    -- 1. Total Revenue (Sales) in Range
    SELECT COALESCE(SUM(total), 0)
    INTO v_total_revenue
    FROM sales
    WHERE (p_site_id IS NULL OR site_id = p_site_id)
      AND (p_start_date IS NULL OR sale_date >= p_start_date)
      AND (p_end_date IS NULL OR sale_date <= p_end_date)
      AND status != 'Cancelled';

    -- 2. Total Refunds
    SELECT COALESCE(SUM(total), 0)
    INTO v_total_refunds
    FROM sales
    WHERE (p_site_id IS NULL OR site_id = p_site_id)
      AND (p_start_date IS NULL OR sale_date >= p_start_date)
      AND (p_end_date IS NULL OR sale_date <= p_end_date)
      AND status = 'Refunded';

    -- 3. Total Expenses (OpEx)
    SELECT COALESCE(SUM(amount), 0)
    INTO v_total_expenses
    FROM expenses
    WHERE (p_site_id IS NULL OR site_id = p_site_id)
      AND (p_start_date IS NULL OR date >= p_start_date::date) -- Cast timestamp to date if needed
      AND (p_end_date IS NULL OR date <= p_end_date::date);

    -- 4. Net Profit Calculation (Revenue - Expenses - Refunds)
    -- Note: Cost of Goods Sold (COGS) is missing here!
    -- Real Net Profit = Revenue - COGS - OpEx - Refunds.
    -- The current filtered logic in Financials.tsx was: Revenue - Expenses - Tax - Refunds.
    -- It ignored COGS? Let me check Financials.tsx again.
    -- Line 365: const netProfit = totalRevenue - totalExpenses - netTaxPayable - totalRefunds;
    -- totalExpenses was OpEx + Payroll.
    -- It seems the current "Net Profit" is actually "Operating Profit" ignoring Product Cost?
    -- OR, is 'totalExpenses' meant to include everything?
    -- Wait, Line 349 calculates 'totalInventoryValue' at Cost.
    -- Let's stick to the user's existing logic to avoid confusion: Revenue - OpEx - Refunds.
    -- We will return these raw values and let UI combine them or handle COGS if it wants to add it later.
    
    v_net_profit := v_total_revenue - v_total_refunds - v_total_expenses;
    
    IF v_total_revenue > 0 THEN
        v_profit_margin := ROUND((v_net_profit / v_total_revenue) * 100, 1);
    ELSE
        v_profit_margin := 0;
    END IF;

    -- 5. Expense Breakdown (Pie Chart)
    SELECT COALESCE(json_agg(t), '[]'::json)
    INTO v_expense_breakdown
    FROM (
        SELECT 
            category as name,
            SUM(amount) as value
        FROM expenses
        WHERE (p_site_id IS NULL OR site_id = p_site_id)
          AND (p_start_date IS NULL OR date >= p_start_date::date)
          AND (p_end_date IS NULL OR date <= p_end_date::date)
        GROUP BY category
        ORDER BY value DESC
    ) t;

    -- 6. Cashflow Chart Data (Aggregated by Day/Week)
    -- Let's do Weekly aggregation to match the UI's "Cashflow Analysis (Weekly)".
    SELECT COALESCE(json_agg(t), '[]'::json)
    INTO v_cashflow_data
    FROM (
        WITH date_series AS (
            SELECT generate_series(
                COALESCE(p_start_date, (SELECT MIN(sale_date) FROM sales)),
                COALESCE(p_end_date, NOW()),
                '1 week'::interval
            ) as week_start
        ),
        sales_agg AS (
            SELECT 
                date_trunc('week', sale_date) as week,
                SUM(total) as income
            FROM sales
            WHERE (p_site_id IS NULL OR site_id = p_site_id)
              AND (p_start_date IS NULL OR sale_date >= p_start_date)
              AND (p_end_date IS NULL OR sale_date <= p_end_date)
              AND status != 'Cancelled'
            GROUP BY 1
        ),
        expenses_agg AS (
            SELECT 
                date_trunc('week', date) as week,
                SUM(amount) as expense
            FROM expenses
            WHERE (p_site_id IS NULL OR site_id = p_site_id)
              AND (p_start_date IS NULL OR date >= p_start_date::date)
              AND (p_end_date IS NULL OR date <= p_end_date::date)
            GROUP BY 1
        )
        SELECT 
            to_char(ds.week_start, 'YYYY-MM-DD') as name, -- Format as string label
            COALESCE(s.income, 0) as income,
            COALESCE(e.expense, 0) as expense
        FROM date_series ds
        LEFT JOIN sales_agg s ON s.week = ds.week_start
        LEFT JOIN expenses_agg e ON e.week = ds.week_start
        ORDER BY ds.week_start
    ) t;

    RETURN json_build_object(
        'total_revenue', v_total_revenue,
        'total_expenses', v_total_expenses,
        'total_refunds', v_total_refunds,
        'net_profit', v_net_profit,
        'profit_margin', v_profit_margin,
        'expense_breakdown', v_expense_breakdown,
        'cashflow_data', v_cashflow_data
    );
END;
$$ LANGUAGE plpgsql;
