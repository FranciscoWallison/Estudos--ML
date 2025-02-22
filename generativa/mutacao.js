function mutateRandom(beetle) {
    let channel = Math.floor(Math.random() * 3); 
    let mutatedRGB = { ...beetle };
    mutatedRGB[['r', 'g', 'b'][channel]] = Math.floor(Math.random() * 256);
    mutatedRGB.color = `rgb(${mutatedRGB.r}, ${mutatedRGB.g}, ${mutatedRGB.b})`;
    return mutatedRGB;
}

function mutateSmall(beetle) {
    let channel = Math.floor(Math.random() * 3);
    let mutationAmount = Math.random() < 0.5 ? -20 : 20;
    let mutatedRGB = { ...beetle };
    mutatedRGB[['r', 'g', 'b'][channel]] = Math.min(255, Math.max(0, mutatedRGB[['r', 'g', 'b'][channel]] + mutationAmount));
    mutatedRGB.color = `rgb(${mutatedRGB.r}, ${mutatedRGB.g}, ${mutatedRGB.b})`;
    return mutatedRGB;
}

function mutateDirected(beetle) {
    let mutatedRGB = { ...beetle };
    mutatedRGB.r = Math.max(0, mutatedRGB.r - Math.floor(Math.random() * 30));
    mutatedRGB.g = Math.max(0, mutatedRGB.g - Math.floor(Math.random() * 30));
    mutatedRGB.b = Math.max(0, mutatedRGB.b - Math.floor(Math.random() * 30));
    mutatedRGB.color = `rgb(${mutatedRGB.r}, ${mutatedRGB.g}, ${mutatedRGB.b})`;
    return mutatedRGB;
}

function selectMutant() {
    if (populationMutacao.length === 0) return;
    let beetle = populationMutacao[Math.floor(Math.random() * populationMutacao.length)];
    let mutant1 = mutateRandom(beetle);
    let mutant2 = mutateSmall(beetle);
    let mutant3 = mutateDirected(beetle);
    
    addMutantToNextGeneration(beetle, mutant1, "Mutação Aleatória");
    addMutantToNextGeneration(beetle, mutant2, "Mutação Pequena");
    addMutantToNextGeneration(beetle, mutant3, "Mutação Dirigida");
}

function addMutantToNextGeneration(original, mutant, method) {
    const newGenContainer = document.getElementById("new-generation-genetico");
    let row = document.createElement("div");
    row.className = "mutation-row";
    row.innerHTML = `
        <h2>${method}</h2>
        <div>
            <div class="beetle">${bug_svg(original.color)} Original</div>
            <span> → </span>
            <div class="beetle">${bug_svg(mutant.color)} Mutante</div>
        </div>
        <hr>
    `;
    newGenContainer.appendChild(row);
}

document.getElementById("mutateBtn").addEventListener("click", selectMutant);
