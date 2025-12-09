
import React, { useState } from 'react';
import { generateSKU, isValidSKU, getCategoryPrefix } from '../utils/skuGenerator';
import { useData } from '../contexts/DataContext';

/**
 * SKU Generator Test Component
 * Add this to any page to test SKU generation visually
 * 
 * Usage: <SKUGeneratorTest />
 */
export function SKUGeneratorTest() {
    const { allProducts } = useData();
    const [category, setCategory] = useState('Electronics');
    const [generatedSKU, setGeneratedSKU] = useState('');

    const categories = [
        'Electronics', 'Beverages', 'Food', 'Fresh', 'Accessories',
        'Clothing', 'Health', 'Beauty', 'Home', 'Sports', 'General'
    ];

    const handleGenerate = () => {
        const sku = generateSKU(category, allProducts || []);
        setGeneratedSKU(sku);
        console.log(`Generated SKU: ${sku} for category: ${category}`);
    };

    // Calculate live counters for display
    const getLiveCounters = () => {
        const counts: Record<string, number> = {};
        (allProducts || []).forEach(p => {
            if (p.sku) {
                const prefix = p.sku.split('-')[0];
                const num = parseInt(p.sku.split('-')[1]);
                if (!isNaN(num)) {
                    counts[prefix] = Math.max(counts[prefix] || 0, num);
                }
            }
        });
        return counts;
    };

    const counters = getLiveCounters();

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: '#1a1a1a',
            border: '2px solid #00ff9d',
            borderRadius: '12px',
            padding: '20px',
            color: 'white',
            zIndex: 9999,
            minWidth: '300px',
            boxShadow: '0 0 20px rgba(0,255,157,0.3)'
        }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#00ff9d' }}>🧪 SKU Generator Test</h3>
            <p style={{ fontSize: '10px', color: '#aaa', marginBottom: '10px' }}>
                Generator Mode: <strong>Live Inventory Check</strong>
            </p>

            <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>
                    Category:
                </label>
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '8px',
                        background: '#2a2a2a',
                        border: '1px solid #444',
                        borderRadius: '6px',
                        color: 'white'
                    }}
                >
                    {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            <button
                onClick={handleGenerate}
                style={{
                    width: '100%',
                    padding: '10px',
                    background: '#00ff9d',
                    color: 'black',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    marginBottom: '15px'
                }}
            >
                Generate Next SKU
            </button>

            {generatedSKU && (
                <div style={{
                    background: '#2a2a2a',
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '15px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '5px' }}>
                        Next Available SKU:
                    </div>
                    <div style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: '#00ff9d',
                        fontFamily: 'monospace'
                    }}>
                        {generatedSKU}
                    </div>
                    <div style={{
                        fontSize: '10px',
                        color: isValidSKU(generatedSKU) ? '#00ff9d' : '#ff4444',
                        marginTop: '5px'
                    }}>
                        {isValidSKU(generatedSKU) ? '✅ Valid Format' : '❌ Invalid Format'}
                    </div>
                </div>
            )}

            {Object.keys(counters).length > 0 && (
                <div style={{ fontSize: '11px' }}>
                    <div style={{ color: '#888', marginBottom: '5px' }}>Current Max Sequence (DB):</div>
                    <div style={{
                        maxHeight: '150px',
                        overflowY: 'auto',
                        background: '#2a2a2a',
                        padding: '8px',
                        borderRadius: '6px'
                    }}>
                        {Object.entries(counters)
                            .sort(([, a], [, b]) => b - a)
                            .map(([prefix, count]) => (
                                <div key={prefix} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '2px 0'
                                }}>
                                    <span style={{ color: '#00ff9d' }}>{prefix}</span>
                                    <span>{count}</span>
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default SKUGeneratorTest;
