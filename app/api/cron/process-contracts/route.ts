import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Types for automation results
interface GeneratedTransaction {
  contract_id: string;
  transaction_id: string;
  customer_name: string;
  contract_title: string;
  amount: number;
}

interface ProcessedRenewal {
  contract_id: string;
  old_end_date: string;
  new_end_date: string;
  customer_name: string;
  contract_title: string;
}

interface ExpiredContract {
  contract_id: string;
  customer_name: string;
  contract_title: string;
  end_date: string;
}

interface AutomationResult {
  success: boolean;
  timestamp: string;
  results: {
    generatedTransactions: GeneratedTransaction[];
    processedRenewals: ProcessedRenewal[];
    expiredContracts: ExpiredContract[];
  };
  summary: {
    transactionsGenerated: number;
    contractsRenewed: number;
    contractsExpired: number;
    totalProcessed: number;
  };
  errors: string[];
}

/**
 * POST /api/cron/process-contracts
 *
 * Processes all contract automations:
 * 1. Renews contracts that have automatic renewal enabled
 * 2. Expires contracts that have reached their end date
 * 3. Generates transactions for contracts due today
 *
 * This endpoint is designed to be called by a cron job (Vercel Cron)
 * It requires a CRON_SECRET header for authentication
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const errors: string[] = [];

  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const supabase = createAdminClient();
    const today = new Date().toISOString().split('T')[0];

    const results = {
      generatedTransactions: [] as GeneratedTransaction[],
      processedRenewals: [] as ProcessedRenewal[],
      expiredContracts: [] as ExpiredContract[],
    };

    // 1. Process renewals first
    try {
      const { data: renewals, error: renewalError } = await supabase.rpc(
        'process_contract_renewals',
        { p_date: today }
      );

      if (renewalError) {
        errors.push(`Renewal error: ${renewalError.message}`);
      } else {
        results.processedRenewals = renewals || [];
      }
    } catch (err) {
      errors.push(`Renewal exception: ${err instanceof Error ? err.message : 'Unknown'}`);
    }

    // 2. Expire contracts that don't auto-renew
    try {
      const { data: expired, error: expireError } = await supabase.rpc(
        'expire_contracts',
        { p_date: today }
      );

      if (expireError) {
        errors.push(`Expiration error: ${expireError.message}`);
      } else {
        results.expiredContracts = expired || [];
      }
    } catch (err) {
      errors.push(`Expiration exception: ${err instanceof Error ? err.message : 'Unknown'}`);
    }

    // 3. Generate transactions for active contracts
    try {
      const { data: transactions, error: transactionError } = await supabase.rpc(
        'generate_contract_transactions',
        { p_date: today }
      );

      if (transactionError) {
        errors.push(`Transaction error: ${transactionError.message}`);
      } else {
        results.generatedTransactions = transactions || [];
      }
    } catch (err) {
      errors.push(`Transaction exception: ${err instanceof Error ? err.message : 'Unknown'}`);
    }

    // 4. Log the execution
    const executionTime = Date.now() - startTime;

    // Log execution - ignore errors if table doesn't exist
    try {
      await supabase.from('automation_logs').insert({
        type: 'contract_processing',
        executed_at: new Date().toISOString(),
        execution_time_ms: executionTime,
        transactions_generated: results.generatedTransactions.length,
        contracts_renewed: results.processedRenewals.length,
        contracts_expired: results.expiredContracts.length,
        errors: errors.length > 0 ? errors : null,
        success: errors.length === 0,
      });
    } catch {
      // Ignore logging errors - table might not exist yet
    }

    const response: AutomationResult = {
      success: errors.length === 0,
      timestamp: new Date().toISOString(),
      results,
      summary: {
        transactionsGenerated: results.generatedTransactions.length,
        contractsRenewed: results.processedRenewals.length,
        contractsExpired: results.expiredContracts.length,
        totalProcessed:
          results.generatedTransactions.length +
          results.processedRenewals.length +
          results.expiredContracts.length,
      },
      errors,
    };

    return NextResponse.json(response, {
      status: errors.length === 0 ? 200 : 207, // 207 = Multi-Status (partial success)
    });
  } catch (error) {
    console.error('Contract automation failed:', error);

    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET method for manual testing and health checks
export async function GET(request: NextRequest) {
  // Verify authorization for manual calls
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      {
        status: 'ok',
        message: 'Contract automation endpoint is active',
        note: 'Use POST with authorization to execute',
      },
      { status: 200 }
    );
  }

  // If authorized, run the automation
  return POST(request);
}
