const populationSizeCrossOver = document.querySelectorAll("#new-generation div").length;
let populationMutacao = [];

function randomColor() {
    let r = Math.floor(Math.random() * 256);
    let g = Math.floor(Math.random() * 256);
    let b = Math.floor(Math.random() * 256);
    return { r, g, b, color: `rgb(${r}, ${g}, ${b})` };
}

function crossoverOnePoint(parent1, parent2) {
    let midpoint = Math.floor(Math.random() * 3); 
    let childRGB = [parent1.r, parent1.g, parent1.b];
    childRGB[midpoint] = [parent2.r, parent2.g, parent2.b][midpoint];
    return { r: childRGB[0], g: childRGB[1], b: childRGB[2], color: `rgb(${childRGB[0]}, ${childRGB[1]}, ${childRGB[2]})` };
}

function crossoverUniform(parent1, parent2) {
    let childRGB = {
        r: Math.random() < 0.5 ? parent1.r : parent2.r,
        g: Math.random() < 0.5 ? parent1.g : parent2.g,
        b: Math.random() < 0.5 ? parent1.b : parent2.b,
    };
    console.log(childRGB,parent1, parent2 );
    childRGB.color = `rgb(${childRGB.r}, ${childRGB.g}, ${childRGB.b})`;
    return childRGB;
}

function crossoverArithmetic(parent1, parent2, alpha = 0.5) {
    let childRGB = {
        r: Math.round(alpha * parent1.r + (1 - alpha) * parent2.r),
        g: Math.round(alpha * parent1.g + (1 - alpha) * parent2.g),
        b: Math.round(alpha * parent1.b + (1 - alpha) * parent2.b),
    };
    childRGB.color = `rgb(${childRGB.r}, ${childRGB.g}, ${childRGB.b})`;
    return childRGB;
}

function selectParents() {
    if (populationCrossOver.length < 2) return null;
    let parent1 = populationCrossOver[Math.floor(Math.random() * populationCrossOver.length)];
    let parent2 = populationCrossOver[Math.floor(Math.random() * populationCrossOver.length)];

    // if(parent1.r === parent2.r  &&  parent1.g === parent2.g  &&  parent1.b === parent2.b && parent1.color === parent2.color) {
    //     selectParents();
    // }
    return [parent1, parent2];
}

function generateOffspring() {
    let parents = selectParents();
    if (!parents){ return};
    
    // One-Point
    let child_point_1 = crossoverOnePoint(parents[0], parents[1]);
    let child_point_2 = crossoverOnePoint(parents[1], parents[0]);

    let child2 = crossoverUniform(parents[0], parents[1]);
    let child3 = crossoverArithmetic(parents[0], parents[1]);
    addToNextGenerationMutacao(parents[0]);
    addToNextGenerationMutacao(parents[1]);

    addToNextGenerationCrossOver(parents[0], parents[1], child_point_1, "One-Point 1");
    addToNextGenerationMutacao(child_point_1);
    addToNextGenerationCrossOver(parents[1], parents[0], child_point_2, "One-Point 2");
    addToNextGenerationMutacao(child_point_2);


    addToNextGenerationCrossOver(parents[0], parents[1], child2, "Uniform");
    addToNextGenerationMutacao(child2);
    addToNextGenerationCrossOver(parents[0], parents[1], child3, "Arithmetic");
    addToNextGenerationMutacao(child3);
}


function addToNextGenerationMutacao(beetle) {
    const newGenContainer = document.getElementById("new-generation-mutacao");
    let newBeetle = document.createElement("div");
    newBeetle.className = "beetle";
    newBeetle.innerHTML = bug_svg(beetle.color);
    populationMutacao.push(beetle);
    newGenContainer.appendChild(newBeetle);
  }

// populationMutacao

function addToNextGenerationCrossOver(parent1, parent2, child, method) {
    const newGenContainer = document.getElementById("new-generation-cross-over");
    let row = document.createElement("div");
    row.className = "crossover-row";
    row.innerHTML = `
        <h2>${method}</h2>
        <div>
        <div class="beetle">${bug_svg(parent1.color)} P1</div>
        <span> + </span>
        <div class="beetle">${bug_svg(parent2.color)} P2</div>
        <span> → </span>
        <div class="beetle">${bug_svg(child.color)} F </div>
        </div>
        <hr>
    `;
    newGenContainer.appendChild(row);
}

document.getElementById("offspringBtn").addEventListener("click", generateOffspring);