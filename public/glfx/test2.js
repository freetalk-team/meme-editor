let globalVar = 42;

function originalFunction() {
    console.log(`Global variable is: ${this.globalValue}`);
}

// Wrapping the function
const wrappedFunction = originalFunction.bind({ globalValue: 100 });
wrappedFunction(); // Global variable is: 100
