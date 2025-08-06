const { appendRow } = require('./googleSheetsClient');

(async () => {
    try {
        const result = await appendRow('Sheet1', ['Test From Module', new Date().toLocaleString()]);
        console.log('Row appended:', result);
    } catch (error) {
        console.error('Error appending row:', error);
    }
})();
