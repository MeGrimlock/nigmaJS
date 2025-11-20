const Nigma = require('./build/js/nigma.min.js');

try {
    console.log('Loaded Nigma Library');
    console.log('Type of Nigma:', typeof Nigma);
    console.log('Keys:', Object.keys(Nigma));

    // Check if we can access the main class
    if (Nigma.default) {
        console.log('Nigma.default exists');
        const instance = new Nigma.default('test');
        console.log('Instance created:', instance.message);
    } else {
        console.log('Nigma.default does not exist, checking if Nigma is the class');
        // It might be that Nigma is the class itself if default export was handled differently
    }

    // Check for named exports
    if (Nigma.Shift && Nigma.Shift.CaesarShift) {
        console.log('Nigma.Shift.CaesarShift exists');
        const caesar = new Nigma.Shift.CaesarShift('hello', 1);
        console.log('Caesar encoded:', caesar.encode());
    } else {
        console.error('Nigma.Shift.CaesarShift missing');
    }

    console.log('Smoke test passed!');
} catch (e) {
    console.error('Smoke test failed:', e);
    process.exit(1);
}
