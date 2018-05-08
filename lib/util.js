exports.toType = function (obj) {
    // https://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
}

/**
 * Returns the next block [x, z] from a vector given by the angle.
 * 
 * N = 0 = -Z
 * W = 0.5 PI = -X
 * S = PI = +Z
 * E = 1.5 PI = +X
 * @param {*} x 
 * @param {*} z 
 * @param {*} angle 
 */
exports.next_block = function(x, z, angle) {
    var base = [Math.floor(x), Math.floor(z)];
    var frac = [x - base[0], z - base[1]];
    var vect = [-1 * Math.sin(angle), -1 * Math.cos(angle)];

    // General idea is to calculate the angles to each corner (bottom left, 
    // top left, etc). Our vector will have the smallest angle between the
    // two corners nearest its edge intersect, so we sort the angles to find
    // those two corners. Next each corner defines a delta (x+1, z+1 for the 
    // top right) so by combining the deltas we get the net effect.

    var corners = { // dx, dz, angle
        bl: [-1, -1, exports.calc_angle(vect, [-1 * frac[0], -1 * frac[1]])],
        tl: [-1, 1, exports.calc_angle(vect, [-1 * frac[0], 1 - frac[1]])],
        br: [1, -1, exports.calc_angle(vect, [1 - frac[0], -1 * frac[1]])],
        tr: [1, 1, exports.calc_angle(vect, [1 - frac[0], 1 - frac[1]])]
    };

    var sorted_corners = Object.keys(corners).sort((a, b) => {
        return corners[a][2] - corners[b][2];
    });
    var a = corners[sorted_corners[0]];
    var b = corners[sorted_corners[1]];
    return base.map((n, i) => n + (a[i] == b[i] ? a[i] : a[i] + b[i]));
}

exports.calc_angle = function (a, b) {
    var dot_prod = a[0]*b[0] + a[1]*b[1];
    var mag_a = calc_magnitude(a);
    var mag_b = calc_magnitude(b);
    return Math.acos(dot_prod / (mag_a * mag_b));
}

function calc_magnitude(vec) {
    var sum = 0;
    vec.forEach(n => {
        sum += Math.pow(n, 2);
    });
    var mag = Math.pow(sum, 0.5);
    return mag;
}

/**
 * Safely perform a mathematical operation on a value.
 * 
 * @param {*} left 
 * @param {*} right 
 * @param {*} ops - 'add', 'sub', 'mult', 'div', 'pow', 'mod'
 */
exports.safe_math = function (left, right, op) {
    // convert bools to ints
    if (typeof left == 'boolean') left = Number(left);
    if (typeof right == 'boolean') right = Number(right);

    var left_type = exports.toType(left);
    var right_type = exports.toType(right);

    // nulls and objects are not allowed
    var safe_types = ['number', 'string', 'array'];
    ([left_type, right_type]).forEach(t => {
        if (safe_types.indexOf(t) == -1) {
            throw Error(`Illegal type for operation: ${t}`);
        }
    });

    var bitmask = 0;
    safe_types.forEach((item, i) => {
        bitmask |= (left_type === item || right_type === item) * Math.pow(2, i);
    })

    if (bitmask == 1) { // booleans and numbers - straight math
        switch (op) {
            case 'add': return left + right;
            case 'sub': return left - right;
            case 'mult': return left * right;
            case 'div': return left / right;
            case 'pow': return Math.pow(left, right);
            case 'mod': return left % right;
        }
        throw Error(`Unrecognized value: ${op}`)
    }

    if (bitmask == 2) { // two strings
        if (op == 'add') return left + right;
        throw Error(`String operation not recognized: ${op}`)
    }

    if (bitmask == 3) { // number + string
        if (op == 'mult') {
            if (left_type == 'string') {
                let swap = left;
                left = right;
                right = swap;
            }
            let result = '';
            for (let i = 0; i<left; i++) {
                result += right;
            }
            return result;
        }
    }

    if (bitmask == 4) {
        if (left.length != right.length) {
            throw Error("Arrays are of uneven size.")
        }
        let result = [];
        result.push(left.forEach((item, i) => {
            exports.safe_math(item, right[i], op);
        }));
        return result;
    }

    if (bitmask == 5) {
        let result = [];
        result.push(left.forEach((item) => {
            exports.safe_math(item, right, op);
        }));
        return result;
    }

    if (bitmask == 6) {
        throw Error("Operations between strings and arrays not defined.")
    }
}