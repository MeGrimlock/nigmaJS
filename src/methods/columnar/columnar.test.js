//test script for parent and child documents.
const nigma = require("../../index");
const message = "Encode this text please";

//-------------------------------------AMSCO UNIT TEST-------------------------------------
const method1 = "AMSCO";
const key = "321";
const encoded1 = "OHELENCETSTTPASEDIXE";
const generator1 = new nigma.Columnar.amsco(message, key);
test(`Should Encode message Using ${method1} module and return a perfect Match`, () => {
  console.log(`Running test ${method1}`);
  expect(generator1.encode()).toBe(encoded1);
});
