//test script for parent and child documents.
const nigma = require("../../index");
const message = "Encode this text please";

//-------------------------------------CAESAR UNIT TEST-------------------------------------
const method1 = "Caesar Shift";
const key1 = "1";
const encoded1 = "Pbvlfp jtdz jpxj vhpbzp";
const generator1 = new nigma.Shift.caesarShift(message, key1);
test(`Should Encode message Using ${method1} module and return a perfect Match`, () => {
  console.log(`Running test ${method1}`);
  expect(generator1.encode()).toBe(encoded1);
});

//-------------------------------------ROT5 UNIT TEST-------------------------------------
const method2 = "ROT 5 Shift";
const encoded2 = "Jshtij ymnx yjcy uqjfxj";
const generator2 = new nigma.Shift.rot5(message);
test(`Should Encode message Using ${method2} module and return a perfect Match`, () => {
  console.log(`Running test ${method2}`);
  expect(generator2.encode()).toBe(encoded2);
});
