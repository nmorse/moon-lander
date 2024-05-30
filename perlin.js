// Perlin noise function
function perlin(x, y) {
    var X = Math.floor(x) & 255,
        Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    var u = fade(x),
        v = fade(y);
    var A = p[X] + Y,
        AA = p[A],
        AB = p[A + 1],
        B = p[X + 1] + Y,
        BA = p[B],
        BB = p[B + 1];

    return lerp(v, lerp(u, grad(p[AA], x, y),
                               grad(p[BA], x - 1, y)),
                       lerp(u, grad(p[AB], x, y - 1),
                               grad(p[BB], x - 1, y - 1)));
}

function fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(t, a, b) {
    return a + t * (b - a);
}

function grad(hash, x, y) {
    var h = hash & 15;
    var u = h < 8 ? x : y,
        v = h < 4 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

var p = [];
for (var i = 0; i < 256; i++) {
    p[i] = Math.floor(Math.random() * 256);
}
for (var i = 0; i < 256; i++) {
    var j = Math.floor(Math.random() * 256);
    var temp = p[i];
    p[i] = p[j];
    p[j] = temp;
}

// // Generate a bumpy circle
// var numPoints = 100; // Number of points around the circle
// var radius = 100; // Radius of the circle
// var noiseScale = 0.1; // Scale factor for the Perlin noise

// for (var i = 0; i < numPoints; i++) {
//     var angle = (i / numPoints) * Math.PI * 2;
//     var x = Math.cos(angle) * radius;
//     var y = Math.sin(angle) * radius;

//     // Use Perlin noise to add bumps to the circle
//     var noiseValue = perlin(x * noiseScale, y * noiseScale);
//     var height = radius + noiseValue * 20; // Adjust the amplitude of the bumps here

//     console.log(angle, height)
//     // Draw the point at (x, y, height)
//     // You can use this height value to draw or manipulate your bumpy circle
// }