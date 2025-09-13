const CalcCore = {
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0
        }).format(amount);
    },
    
    parseNumber(input) {
        return parseFloat(input) || 0;
    },
    
    generateBreakdownTable(items) {
        let html = '<table style="width:100%; margin-top:1rem; color:white;"><tbody>';
        items.forEach(item => {
            html += `<tr><td style="padding:0.5rem;">${item.label}</td>`;
            html += `<td style="padding:0.5rem; text-align:right;">${this.formatCurrency(item.value)}</td></tr>`;
        });
        html += '</tbody></table>';
        return html;
    }
};