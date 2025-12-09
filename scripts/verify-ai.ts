/**
 * AI System Verification Script
 * Run this in your browser console to verify all AI services are working
 */

import { aiNavigationService } from './services/ai-navigation.service';
import { aiDataContextService } from './services/ai-data-context.service';
import { aiActionExecutorService } from './services/ai-action-executor.service';
import { aiReportGeneratorService } from './services/ai-report-generator.service';
import { aiSmartSearchService } from './services/ai-smart-search.service';
import { aiContextualHelpService } from './services/ai-contextual-help.service';
import { aiProactiveSuggestionsService } from './services/ai-proactive-suggestions.service';
import { aiAnomalyDetectorService } from './services/ai-anomaly-detector.service';

async function verifyAISystem() {
    console.group('🤖 AI System Verification');

    try {
        // 1. Check Services Existence
        console.log('✅ AI Navigation Service:', !!aiNavigationService);
        console.log('✅ Data Context Service:', !!aiDataContextService);
        console.log('✅ Action Executor Service:', !!aiActionExecutorService);
        console.log('✅ Report Generator Service:', !!aiReportGeneratorService);
        console.log('✅ Smart Search Service:', !!aiSmartSearchService);
        console.log('✅ Contextual Help Service:', !!aiContextualHelpService);
        console.log('✅ Proactive Suggestions Service:', !!aiProactiveSuggestionsService);
        console.log('✅ Anomaly Detector Service:', !!aiAnomalyDetectorService);

        // 2. Test Data Context
        console.group('📊 Testing Data Context');
        const context = await aiDataContextService.getDataContext('super_admin', 'WH-001');
        console.log('Data Context:', context);
        if (context.products && context.employees) console.log('✅ Data Context Fetched');
        else console.error('❌ Data Context Failed');
        console.groupEnd();

        // 3. Test Action Parsing
        console.group('⚡ Testing Action Parsing');
        const action = aiActionExecutorService.parseCommand('Create PO for 50 units');
        console.log('Parsed Action:', action);
        if (action && action.type === 'create_po') console.log('✅ Action Parsing Works');
        else console.error('❌ Action Parsing Failed');
        console.groupEnd();

        // 4. Test Report Generation
        console.group('📈 Testing Report Generation');
        const reportReq = aiReportGeneratorService.parseCommand('Generate sales report');
        if (reportReq) {
            const report = await aiReportGeneratorService.generateReport(reportReq);
            console.log('Generated Report:', report);
            if (report.title) console.log('✅ Report Generation Works');
            else console.error('❌ Report Generation Failed');
        } else {
            console.error('❌ Report Parsing Failed');
        }
        console.groupEnd();

        // 5. Test Smart Search
        console.group('🔍 Testing Smart Search');
        const searchResults = await aiSmartSearchService.search('warehouse', context);
        console.log('Search Results:', searchResults);
        if (Array.isArray(searchResults)) console.log('✅ Smart Search Works');
        else console.error('❌ Smart Search Failed');
        console.groupEnd();

        // 6. Test Contextual Help
        console.group('📚 Testing Contextual Help');
        const help = aiContextualHelpService.getHelp('/inventory');
        console.log('Help Content:', help);
        if (help && help.title) console.log('✅ Contextual Help Works');
        else console.error('❌ Contextual Help Failed');
        console.groupEnd();

        console.log('🎉 ALL SYSTEMS CHECKED!');

    } catch (error) {
        console.error('❌ Verification Failed:', error);
    }

    console.groupEnd();
}

// Expose to window for easy running
(window as any).verifyAI = verifyAISystem;

console.log('ℹ️ Run verifyAI() to start verification');
