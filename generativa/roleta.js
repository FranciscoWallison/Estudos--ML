const populationSize = 6;
let population = [];
let roulette = [];
let currentRotation = 0;
let populationCrossOver = [];

function randomColor() {
  let r = Math.floor(Math.random() * 256);
  let g = Math.floor(Math.random() * 256);
  let b = Math.floor(Math.random() * 256);
  return { r, g, b, color: `rgb(${r}, ${g}, ${b})` };
}

function brightness({ r, g, b }) {
  return (r + g + b) / 3;
}

async function generatePopulation() {
  const container = document.getElementById("container");
  container.innerHTML = "";
  population = [];
  roulette = [];

  for (let i = 0; i < populationSize; i++) {
    let beetleData = randomColor();
    let beetleContainer = document.createElement("div");
    beetleContainer.className = "beetle";
    beetleContainer.setAttribute("data_color", beetleData.color);
    beetleContainer.innerHTML = bug_svg(beetleData.color);
    population.push(beetleData);
    container.appendChild(beetleContainer);
  }
  await createRoulette();
}

async function createRoulette() {
  const roletaContainer = document.getElementById("roleta-hidde");
  roletaContainer.style.display = "block";
  const canvas = document.getElementById("roletaCanvas");
  const ctx = canvas.getContext("2d");
  let totalBrightness = population.reduce(
    (acc, beetle) => acc + (255 - brightness(beetle)),
    0
  );
  let startAngle = 0;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  roulette = [];

  for (const beetle of population) {
    let weight = (255 - brightness(beetle)) / totalBrightness;
    let sliceAngle = weight * 2 * Math.PI;
    let endAngle = startAngle + sliceAngle;
    ctx.beginPath();
    ctx.moveTo(150, 150);
    ctx.arc(150, 150, 150, startAngle, endAngle);
    ctx.fillStyle = beetle.color;
    ctx.fill();
    ctx.stroke();
    roulette.push({ beetle, weight, startAngle, endAngle });
    startAngle = endAngle;
  }
  currentRotation = 0;
  canvas.style.transform = `rotate(${currentRotation}deg)`;
}

async function spinRouletteGirar() {
  const count = document.querySelectorAll("#container div").length;
  for (let index = 0; index < count; index++) {
    await spinRoulette();
  }
}

async function spinRoulette() {
  const count = document.querySelectorAll("#new-generation div").length;
  const count2 = document.querySelectorAll("#container div").length;
  if (count >= count2) {
    return;
  }
  document.getElementById("spinBtn").disabled = true;
  let rand = Math.random();
  let selectedBeetle = null;
  let stopAngle = 0;

  for (let entry of roulette) {
    if (rand < entry.weight) {
      selectedBeetle = entry.beetle;
      stopAngle = (entry.startAngle + entry.endAngle) / 2;
      break;
    }
    rand -= entry.weight;
  }

  let stopAngleDeg = stopAngle * (180 / Math.PI);
  let baseRotation = 360 * 5;
  let finalRotation = baseRotation - stopAngleDeg;
  currentRotation = finalRotation % 360;

  const canvas = document.getElementById("roletaCanvas");

  // Girar continuamente antes de parar
  let baseSpins = 360 * 10; // Gira muitas voltas antes de parar
  canvas.style.transition = "transform 2s linear"; // Gira de forma contínua
  canvas.style.transform = `rotate(${baseSpins}deg)`;

  await new Promise((resolve) => setTimeout(resolve, 2000)); // Tempo de rotação contínua

  canvas.style.transition = "transform 3s cubic-bezier(0.25, 1, 0.5, 1)";
  canvas.style.transform = `rotate(${finalRotation}deg)`;

  await new Promise((resolve) => setTimeout(resolve, 3000));
  await addToNextGeneration(selectedBeetle);
  document.getElementById("spinBtn").disabled = false;
}

async function addToNextGeneration(beetle) {
  const newGenContainer = document.getElementById("new-generation");
  let newBeetle = document.createElement("div");
  newBeetle.className = "beetle";
  newBeetle.innerHTML = bug_svg(beetle.color);
  populationCrossOver.push(beetle);
  newGenContainer.appendChild(newBeetle);
}

function bug_svg(color) {
  return `
                    <svg viewBox="0 0 512.004 512.004" xmlns="http://www.w3.org/2000/svg">
                        <g fill="${color}">
                            <path d="M384.768,434.717l24.294-64.785c0.828-2.219,0.7-4.693-0.358-6.81l-25.6-51.2c-0.674-1.357-1.724-2.338-2.893-3.132
                                C382.618,297.1,384,285.153,384,273.07c0-1.024,0.034-1.911,0.034-2.927L264.534,321.36v127.607
                                c31.582-15.77,59.349-38.554,82.509-67.977c11.614-14.771,20.642-31.471,26.888-49.237l17.835,35.669l-24.286,64.785
                                c-0.836,2.219-0.7,4.693,0.358,6.81l34.133,68.267c1.493,2.995,4.506,4.727,7.637,4.719c1.289,0,2.586-0.29,3.806-0.896
                                c4.224-2.108,5.931-7.236,3.823-11.452L384.768,434.717z"/>
                            <path d="M497.634,307.642l-22.827-7.612l-32.503-48.76c-1.263-1.886-3.209-3.191-5.427-3.635l-41.233-8.243l-10.334-6.161
                                c4.087-59.93,16.87-70.528,18.278-71.475c4.156-1.28,6.716-5.513,5.845-9.83c-0.896-4.514-5.222-7.501-9.762-6.741
                                c-0.026,0.009-0.051,0.017-0.077,0.017c-0.23-0.017-0.427-0.128-0.657-0.128c-34.108,0-59.238-8.636-74.709-25.677
                                c-2.987-3.277-5.402-6.724-7.441-10.206l34.756-6.955c2.219-0.444,4.164-1.749,5.427-3.635l32.171-48.256l39.202-7.842
                                c2.219-0.444,4.164-1.749,5.427-3.635l17.067-25.6c2.611-3.917,1.553-9.216-2.372-11.827c-3.934-2.628-9.225-1.553-11.827,2.364
                                L421.526,26.46l-39.202,7.842c-2.21,0.444-4.164,1.749-5.419,3.635l-32.179,48.256l-34.756,6.955
                                c-3.729-13.175-2.825-23.851-2.807-24.004c0.444-4.369-2.5-8.38-6.818-9.242l-42.667-8.533c-1.101-0.222-2.253-0.222-3.354,0
                                l-42.667,8.533c-4.301,0.862-7.245,4.873-6.818,9.242c0.017,0.171,0.964,10.846-2.714,24.021l-34.85-6.972l-32.171-48.256
                                c-1.263-1.886-3.209-3.191-5.427-3.635L90.475,26.46L75.371,3.804C72.76-0.113,67.469-1.188,63.535,1.44
                                c-3.925,2.611-4.983,7.91-2.364,11.827l17.067,25.6c1.254,1.886,3.209,3.191,5.419,3.635l39.202,7.842l32.179,48.256
                                c1.254,1.886,3.208,3.191,5.419,3.635l34.893,6.98c-2.031,3.473-4.429,6.921-7.407,10.197
                                c-15.42,17.033-40.525,25.66-74.607,25.66c-0.282,0-0.521,0.128-0.802,0.162c-0.06-0.017-0.137-0.043-0.196-0.051
                                c-4.514-0.751-8.858,2.227-9.771,6.741c-0.862,4.318,1.69,8.55,5.845,9.83c1.408,0.947,14.191,11.546,18.278,71.475
                                l-10.334,6.161l-41.233,8.243c-2.21,0.444-4.164,1.749-5.419,3.635l-32.512,48.76l-22.827,7.612
                                c-4.463,1.493-6.878,6.323-5.393,10.795c1.195,3.576,4.523,5.837,8.098,5.837c0.887,0,1.801-0.137,2.697-0.444l25.6-8.533
                                c1.801-0.597,3.354-1.784,4.403-3.362l32.171-48.256l39.202-7.842c0.947-0.188,1.86-0.538,2.688-1.033l4.873-2.901
                                l118.767,50.901V170.793c-19.413-0.563-38.767-2.953-57.651-7.398l-31.164-7.33c17.314-5.171,31.479-13.568,42.112-25.395
                                c17.809-19.797,20.941-43.401,21.257-55.433l33.98-6.793l33.988,6.793c0.358,12.032,3.55,35.635,21.419,55.433
                                c10.641,11.802,24.798,20.19,42.069,25.361l-31.3,7.364c-18.876,4.446-38.238,6.835-57.643,7.398v132.011l118.767-50.901
                                l4.864,2.901c0.836,0.495,1.741,0.845,2.688,1.033l39.202,7.842l32.179,48.256c1.05,1.579,2.594,2.765,4.395,3.362l25.6,8.533
                                c0.905,0.307,1.809,0.444,2.705,0.444c3.575,0,6.895-2.261,8.09-5.837C504.521,313.965,502.097,309.135,497.634,307.642z"/>
                            <path d="M128.001,273.071c0,12.083,1.382,24.03,3.797,35.729c-1.169,0.785-2.21,1.766-2.901,3.123l-25.6,51.2
                                c-1.058,2.116-1.186,4.591-0.358,6.81l24.294,64.785l-32.469,64.939c-2.108,4.215-0.393,9.335,3.823,11.452
                                c1.22,0.606,2.526,0.896,3.806,0.896c3.132,0,6.144-1.724,7.646-4.719l34.133-68.267c1.058-2.116,1.186-4.591,0.358-6.81
                                l-24.294-64.785l17.835-35.669c6.246,17.766,15.275,34.466,26.889,49.229c23.159,29.432,50.927,52.215,82.509,67.985V321.361
                                l-119.501-51.217C127.967,271.159,128.001,272.038,128.001,273.071z"/>

                        </g>
                    </svg>
                `;
}

document
  .getElementById("generateBtn")
  .addEventListener("click", generatePopulation);
document.getElementById("spinBtn").addEventListener("click", spinRouletteGirar);
