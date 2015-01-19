describe('SomeClass', function() {

  import SomeClass from './some_class';

  it('instanciates', () => {
    var someClass = new SomeClass();
    expect(someClass instanceof SomeClass).toBeTruthy();
  });

  it('adds two numbers', () => {
    var someClass = new SomeClass();
    expect(someClass.add(1, 2)).toEqual(3);
  });

});