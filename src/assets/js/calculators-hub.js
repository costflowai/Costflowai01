/**
 * CostFlowAI Calculator Hub - Manual-Only Framework
 */

(function(window) {
    'use strict';

    // Global configuration
    window.CALC_TRIGGER_MODE = 'manual_all';
    window.lastCalculation = null;
    window.lastCalculationByType = {};

    // Global event gate
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        
        const section = btn.closest('[data-calc],[id$="-calc"]');
        if (!section) return;
        
        const slug = section.dataset.calc || section.id.replace('-calc', '');
        const action = btn.dataset.action;
        
        const doCompute = () => requestCompute(section, slug, 'manual');
        
        ({
            calculate: doCompute,
            design: doCompute,
            save: () => saveCalc(slug),
            export: () => exportCalc(slug),
            share: () => shareCalc(slug),
            print: () => printCalc(slug),
            email: () => emailCalc(slug)
        }[action]?.());
    });

    function requestCompute(section, slug, origin) {
        if (origin !== 'manual') return;
        
        return window[slug + 'Pro']?.compute?.(section) ??
               window['compute_' + slug]?.(section) ??
               window['calculate' + slug.charAt(0).toUpperCase() + slug.slice(1)]?.(section) ??
               console.warn('No compute fn for', slug);
    }

    function saveCalc(slug) {
        const calc = window.lastCalculationByType[slug];
        if (!calc) return;
        
        const saved = JSON.parse(localStorage.getItem('costflowai_saved') || '[]');
        saved.unshift({...calc, id: Date.now()});
        localStorage.setItem('costflowai_saved', JSON.stringify(saved.slice(0, 50)));
    }

    function exportCalc(slug) {
        const calc = window.lastCalculationByType[slug];
        if (!calc || !window.ExportUtils) return;
        
        window.ExportUtils.exportCSV({
            title: slug + ' Calculation',
            type: slug,
            timestamp: calc.timestamp,
            inputs: calc.inputs,
            results: calc.results
        }, `${slug}_${Date.now()}.csv`);
    }

    function shareCalc(slug) {
        const calc = window.lastCalculationByType[slug];
        if (!calc) return;
        
        if (navigator.share) {
            navigator.share({
                title: slug + ' Calculation',
                text: 'Check out my calculation',
                url: window.location.href
            }).catch(() => copyCalc(slug));
        } else {
            copyCalc(slug);
        }
    }

    function printCalc(slug) {
        const calc = window.lastCalculationByType[slug];
        if (!calc || !window.ExportUtils) return;
        
        window.ExportUtils.print({
            title: slug + ' Calculation',
            type: slug,
            timestamp: calc.timestamp,
            inputs: calc.inputs,
            results: calc.results
        });
    }

    function emailCalc(slug) {
        const calc = window.lastCalculationByType[slug];
        if (!calc || !window.ExportUtils) return;
        
        window.ExportUtils.email({
            title: slug + ' Calculation',
            type: slug,
            timestamp: calc.timestamp,
            inputs: calc.inputs,
            results: calc.results
        });
    }

    function copyCalc(slug) {
        const calc = window.lastCalculationByType[slug];
        if (!calc || !window.ExportUtils) return;
        
        window.ExportUtils.copyToClipboard({
            title: slug + ' Calculation',
            type: slug,
            inputs: calc.inputs,
            results: calc.results
        });
    }

    window.requestCompute = requestCompute;
    window.saveCalc = saveCalc;
    window.exportCalc = exportCalc;
    window.shareCalc = shareCalc;
    window.printCalc = printCalc;
    window.emailCalc = emailCalc;

})(window);
