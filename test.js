
var util = require('./lib/util');

exports.test_angle = function (test) {
  [
    [-0.5, -0.5, 45],
    [-0.5, 0.5, 135],
    [0.5, 0.5, 135],
    [0.5, -0.5, 45]
  ].forEach(angle => {
    var i = util.calc_angle([0, -0.5], [angle[0], angle[1]]) * 180 / Math.PI;
    test.equal(i.toFixed(5), angle[2], "Angle was not as expected: " + angle)
  });
  test.done();
}

exports.test_next_block = function (test) {
  test.deepEqual(util.next_block(0.5, 0.5, 0), [0, -1], "Neg Z - North");
  test.deepEqual(util.next_block(0.5, 0.5, Math.PI), [0, 1], "Pos Z - South");
  test.deepEqual(util.next_block(0.5, 0.5, Math.PI/2), [-1, 0], "Neg X - West");
  test.deepEqual(util.next_block(0.5, 0.5, 1.5*Math.PI), [1, 0], "Pos X - East");
  test.deepEqual(util.next_block(23.8, 45.2, 0.9*Math.PI), [23, 46], "Kinda SSW");
  test.deepEqual(util.next_block(23.5, 45.2, 0.75*Math.PI), [22, 45], "SW");
  test.done();
}
