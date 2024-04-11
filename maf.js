const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 600
const H = W
const ROT_THRUST = 0.0003
canvas.width = W
canvas.height = H

let gameover = false
let gameoverReason = ""
let stabilize = true
let isRotationThrustOff = true
let colorAngle = 180
let fuel = 6000
const fuelCap = 6000

// state variables
let rotationThrust = 0.0
let rotationRate = 0.0
let rotationAngle = Math.PI / 2
let thrust = 0.0
let rate = [0.0, 0.0]
let position = [0.0, 0.0]

const resetSpace = () => {
    gameover = false
    isRotationThrustOff = true
    fuel = 6000
    rotationThrust = 0.0
    rotationRate = 0.0
    rotationAngle = Math.PI / 2
    thrust = 0.0
    rate = [0.0, 0.0]
    position = [0.0, 0.0]
}

// Initialize the moon surface

function drawScene(deltaT, elapsedT) {
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(canvas.width / 2, canvas.height / 2); // translate to center
    // ship in the center of the screen 
    ctx.save()

    ctx.rotate(rotationAngle); // rotate


    ctx.strokeStyle = `rgb(0, 0, 250)`;
    ctx.beginPath();
    const minW = -canvas.width + position[0]
    const maxW = canvas.width + position[0]
    const minH = -canvas.height + position[1]
    const maxH = canvas.height + position[1]
    for (let x = minW; x < maxW; x += 50) {
        ctx.moveTo(x, minH);
        ctx.lineTo(x, maxH);
    }
    for (let y = minH; y < maxH; y += 50) {
        ctx.moveTo(minW, y);
        ctx.lineTo(maxW, y);
    }
    ctx.stroke(); // Render the path


    ctx.translate(position[0], position[1]);

    // draw the moon
    ctx.fillStyle = `rgb(80, 80, 80)`
    ctx.beginPath();
    ctx.arc(2300, 0, 2000, 0, 2 * Math.PI);
    ctx.fill();

    ctx.restore();
    // draw the Vessel
    ctx.strokeStyle = `rgb(200, 0, 0)`;
    ctx.beginPath();
    ctx.moveTo(-10, 10);
    ctx.lineTo(10, 10);
    ctx.lineTo(10, -10);
    ctx.lineTo(-10, -10);
    ctx.lineTo(-10, 10);
    ctx.stroke();
    // draw the fuel level
    ctx.save();
    ctx.fillStyle = `rgb(20, 255, 20)`
    ctx.fillRect(-2, 10, 4, -fuel / fuelCap * 20);
    ctx.restore();

    if (fuel > 0) {
        const r1 = Math.random() * 0.4 + 0.8
        const r2 = Math.random() * 6 - 3
        const r3 = Math.random() * 6 - 3
        if (rotationThrust > 0.000002) {
            ctx.beginPath();
            ctx.moveTo(10, -9);
            ctx.lineTo((10 + 30000 * rotationThrust) * r1, -9 + r2);
            ctx.moveTo(-10, 9);
            ctx.lineTo((-10 + -30000 * rotationThrust) * r1, 9 + r3);
            ctx.stroke();
        }
        if (rotationThrust < -0.000002) {
            ctx.beginPath();
            ctx.moveTo(-10, -9);
            ctx.lineTo((-10 + 30000 * rotationThrust) * r1, -9 + r2);
            ctx.moveTo(10, 9);
            ctx.lineTo((10 + -30000 * rotationThrust) * r1, 9) + r3;
            ctx.stroke();
        }
        if (Math.abs(thrust) > 0.000001) {
            ctx.beginPath();
            ctx.moveTo(0, 10);
            ctx.lineTo(0 + r2, 30 * r1);
            ctx.stroke();
        }
    }
    ctx.restore();
    if (gameover && gameoverReason) {
        alert(gameoverReason + " Press Enter to Reset.")
        gameoverReason = ""
    }
}

function thrustOn(e) {
    e.preventDefault();
    thrust = 0.01
}
function thrustOff(e) {
    e.preventDefault();
    thrust = 0.0
}
function setRotStabilize() {
    // e.preventDefault();
    stabilize = !stabilize
}

function rotateClockwiseThrustOn(e) {
    e.preventDefault();
    rotationThrust = -ROT_THRUST
    isRotationThrustOff = false
}
function rotateThrustOff(e) {
    e.preventDefault();
    rotationThrust = 0.0
    isRotationThrustOff = true
}
function rotateCounterClockwiseThrustOn(e) {
    e.preventDefault();
    rotationThrust = ROT_THRUST
    isRotationThrustOff = false
}

function createPDController(kp, kd) {
    let prevError = 0;

    return function calculate(error, dt) {
        // Proportional term
        const p = kp * error;

        // Derivative term
        const derivative = (error - prevError) / dt;
        const d = kd * derivative;

        // Total output
        const output = p + d;

        // Update previous error for the next iteration
        prevError = error;

        return output;
    };
}
function normalizeVector(vector) {
    // Calculate the magnitude of the vector
    const magnitude = Math.sqrt(vector[0] ** 2 + vector[1] ** 2);

    // Check if the magnitude is zero to avoid division by zero
    if (magnitude === 0) {
        return [0, 0]; // If the vector is already a zero vector, return [0, 0]
    } else {
        // Normalize the vector by dividing each component by its magnitude
        const normalizedVector = [vector[0] / magnitude, vector[1] / magnitude];
        return normalizedVector;
    }
}

const scaleVector = (v, s) => ([v[0] * s, v[1] * s])

function calculateChangeInPosition(p, massOfBody, deltaTime) {
    const dx = -2300 - p[0]
    const dy = 0 - p[1]
    const nv = normalizeVector([dx, dy])
    return scaleVector(nv, 0.005)
}

const rotationalStabilizerSystem = createPDController(0.1, 0.05);

function updateState(deltaT, elapsedT) {
    if (stabilize && rotationRate) {
        const error = -rotationRate
        const pidrRotationThrust = rotationalStabilizerSystem(error, deltaT / 1000)
        if (isRotationThrustOff) {
            rotationThrust = Math.min(Math.max(pidrRotationThrust, -ROT_THRUST), ROT_THRUST)
            // console.log(error.toFixed(5), pidrRotationThrust.toFixed(5))
        }
    }

    // thrust
    if (fuel > 0) {
        rotationRate += rotationThrust
        rotationAngle += rotationRate
        // console.log(rotationThrust, thrust)
        fuel = fuel - Math.abs(thrust * 100) - Math.abs(rotationThrust * 100)
        rate = [rate[0] + Math.sin(rotationAngle) * thrust,
        rate[1] + Math.cos(rotationAngle) * thrust]
    }

    position = [position[0] + rate[0], position[1] + rate[1]]

    // crash test
    const distance = Math.sqrt((-2300 - position[0]) ** 2 + (0 - position[1]) ** 2); // Distance between the two points

    if (distance <= 2010) {
        if (rate[0] !== 0 ||
            rate[1] !== 0) {
            // console.log(rate, rotationAngle)
            if (rate[0] < -0.8) {
                fuel = 0
                // position[0] = -295
                rate[0] = 0
                rate[1] = 0
                rotationRate = 0.0
                gameover = true
                gameoverReason = "Crash Landing!"
            }
            else if (rate[0] < -0.2) {
                // bounce
                rate[0] = -rate[0] * 0.8
                rate[1] = rate[1] * 0.8
                // roll
                //position[0] = -290
            }
            else {
                rate[0] = 0
                rate[1] = 0
                rotationRate = 0.0
                //position[0] = -290
                if (fuel <= 0) {
                    gameover = true
                    gameoverReason = "Out of Fuel!"
                }
            }
        }
    }
    else {
        // gravity
        const [gvX, gvY] = calculateChangeInPosition(position, 10, deltaT)
        // console.log(gvX, gvY)
        if (gvX) {
            rate = [rate[0] + gvX, rate[1]]
        }
        if (gvY) {
            rate = [rate[0], rate[1] + gvY]
        }
    }

    drawScene(deltaT, elapsedT);
}


let frames = 0
let previousTimeStamp, start
function animate(timeStamp) {
    if (previousTimeStamp === undefined) {
        previousTimeStamp = timeStamp;
    }
    const deltaT = timeStamp - previousTimeStamp;
    if (start === undefined) {
        start = timeStamp;
    }
    const elapsed = timeStamp - start;

    updateState(deltaT, elapsed);
    // frames++
    if (deltaT > 2000) { // (frames % 80 === 0) { 
        // console.log("deltaT, elapsed", deltaT, elapsed);
        previousTimeStamp = timeStamp;
        // console.log(position, rotationAngle)
        const scoreBoard = document.getElementById("score")
        scoreBoard.innerText = Math.round(fuel) + ""
    }
    requestAnimationFrame(animate);
}

const heightOutput = document.querySelector("#height");
const widthOutput = document.querySelector("#width");

// Function to handle resize events
function handleResize() {
    heightOutput.textContent = window.innerHeight;
    widthOutput.textContent = window.innerWidth;
    // Get the updated width and height of the viewport
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const viewportWidthRatio = viewportWidth / W;
    const viewportHeightRatio = viewportHeight / H;

    if (viewportWidthRatio < 1.0 || viewportHeightRatio < 1.5) {
        if (viewportWidthRatio < viewportHeightRatio) {
            //console.log("viewportWidth, Math.floor(H * viewportWidthRatio)", viewportWidth, Math.floor(canvas.height * viewportWidthRatio))
            changeCanvasSize(viewportWidth, Math.floor(H * viewportWidthRatio));
        }
        else {
            //console.log("Math.floor(W * viewportHeightRatio), viewportHeight", Math.floor(canvas.width * viewportHeightRatio), viewportHeight)
            changeCanvasSize(Math.floor(W * viewportHeightRatio), viewportHeight);
        }
        drawScene();
    }
}

function changeCanvasSize(newWidth, newHeight) {
    var canvas = document.getElementById("canvas");
    // Update canvas size
    canvas.width = newWidth;
    canvas.height = newHeight;
}

// Attach the event listener to the resize event
window.addEventListener('resize', handleResize);


handleResize()
drawScene();
animate();
function handleKeyDown(event) {
    if (event.keyCode === 37) {
        rotateCounterClockwiseThrustOn(event)
        return
    }
    if (event.keyCode === 38) {
        thrustOn(event)
        return
    }
    if (event.keyCode === 39) {
        rotateClockwiseThrustOn(event)
        return
    }
    if (event.keyCode === 40) {
        thrustOff(event)
        return
    }
    if (event.keyCode === 13) {
        resetSpace(event)
        return
    }
}
function handleKeyUp(event) {
    if (event.keyCode === 37) {
        rotateThrustOff(event)
        return
    }
    if (event.keyCode === 38) {
        thrustOff(event)
        return
    }
    if (event.keyCode === 39) {
        rotateThrustOff(event)
        return
    }
    if (event.keyCode === 40) {
        thrustOff(event)
        return
    }
}
document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);

document.getElementById('leftArrow').addEventListener("mousedown", rotateCounterClockwiseThrustOn);
document.getElementById('upArrow').addEventListener("mousedown", thrustOn);
document.getElementById('rightArrow').addEventListener("mousedown", rotateClockwiseThrustOn);
document.getElementById('leftArrow').addEventListener("mouseup", rotateThrustOff);
document.getElementById('upArrow').addEventListener("mouseup", thrustOff);
document.getElementById('rightArrow').addEventListener("mouseup", rotateThrustOff);
document.getElementById('leftArrow').addEventListener("mouseout", rotateThrustOff);
document.getElementById('upArrow').addEventListener("mouseout", thrustOff);
document.getElementById('rightArrow').addEventListener("mouseout", rotateThrustOff);

document.getElementById('leftArrow').addEventListener("touchstart", rotateCounterClockwiseThrustOn);
document.getElementById('upArrow').addEventListener("touchstart", thrustOn);
document.getElementById('rightArrow').addEventListener("touchstart", rotateClockwiseThrustOn);
document.getElementById('leftArrow').addEventListener("touchend", rotateThrustOff);
document.getElementById('upArrow').addEventListener("touchend", thrustOff);
document.getElementById('rightArrow').addEventListener("touchend", rotateThrustOff);
