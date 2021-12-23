
let canvas = document.querySelector("canvas");
canvas.style.display = "none";
canvas.width = 1000;
canvas.height = 1000;
let cx = canvas.getContext("2d");
cx.font = "15px Arial";
cx.textAlign = "center";



class Bank{
    constructor(ref, x, y){
        this.ref = ref;
        this.capitalBuffer = 4;

        this.interbankAssets = 20; //This is the total loans given out by the current bank to other banks.
        this.interbankAssetsSplit = null; //This is the total loans given out by this bank to each of the banks in "inEdges". the loan is split evenly between them.
        this.illiquidExternalAssets = 80; //This is the total loans given out by the current bank to other people e.g. mortgages
        this.resalePriceFactorOfIEA = 1; //Since illiquidExternalAssets are illiquid, they will need to be sold at a smaller price. this factor can be changed to reflect that.

        this.interbankLoans = 0;
        this.externalLiabilites = this.interbankAssets + this.illiquidExternalAssets - this.capitalBuffer; //This is money that we have taken as loans, not from other banks e.g. people's deposits
        

        this.inEdges = []; //the interbankAssets are divided evenly amongst the inEdges, inEdges i
        this.outEdges = [];
        this.outEdgesLoans = [];

        this.default = false;

        this.x = x;
        this.y = y;
    }

    setInEdges(inEdges){
        this.inEdges = inEdges;
        this.inEdges.forEach((bank)=>{
            let loan = this.interbankAssets/this.inEdges.length;
            this.interbankAssetsSplit = loan;
            bank.setLoans(loan);
            bank.setOutEdges(this, loan);
        });
    }

    setLoans(interbankLoans){
        this.interbankLoans += interbankLoans;
        this.externalLiabilites -= interbankLoans;
    }

    setOutEdges(outEdge, interbankLoans){
        this.outEdges.push(outEdge);
    }

    getCoords(){
        return [this.x, this.y];
    }

    shock(){
        this.illiquidExternalAssets = 0;
        this.default = true;
        this.capitalBuffer = 0;
        this.cascade();
    }
    
    cascade(){
        this.outEdges.forEach((bank) => {
            if(bank.default){
                //return statements work the same way as continue, since this is callback function.
                return;
            }
            if(bank.interbankAssetsSplit > bank.capitalBuffer){
                bank.capitalBuffer = 0;
                bank.default = true;
                bank.cascade();
            }else{
                bank.capitalLoss();
            }
        })
    }

    capitalLoss(){
        this.capitalBuffer -= this.interbankAssetsSplit;
    }
}



function erdos(avgDegree, bankNum){
    let allBanks = [];
    for(let i = 0; i < bankNum; i++){
        let x = Math.floor(Math.random() * canvas.width);
        let y = Math.floor(Math.random() * canvas.height);
        allBanks.push(new Bank(i, x, y));
        // banks.push(new Bank(i, x, y));
    }
    allBanks.forEach((bank) => {
        let inEdges = []
        let degree = Math.random() * avgDegree; //We do not want disconnected nodes, so we add 1, (we minus 1 first to make sure the degree stays the same)
        for(let i = 0; i < degree; i++){
            let index = Math.floor(Math.random() * bankNum);
            if(index == bank.ref 
            || inEdges.indexOf(allBanks[index]) != -1 
            || allBanks[index].interbankLoans + allBanks[index].externalLiabilites + allBanks[index].capitalBuffer > 100){
                continue;
            }
            inEdges.push(allBanks[index]);
        }
        bank.setInEdges(inEdges);
    });
    return allBanks;
}



function corePeriphery(avgDegree, bankNum, coreNum, avgCoreDegree, avgPeripheryDegree){
    let allBanks = [];
    
    for (let i = 0; i < coreNum; i++){
        let x = Math.floor(Math.random() * canvas.width * 0.2) + 400;
        let y = Math.floor(Math.random() * canvas.height * 0.2) + 400;
        allBanks.push(new Bank(i, x, y));
    }

    for (i = coreNum; i < bankNum; i++){
        let x = Math.floor(Math.random() * canvas.width);
        let y = Math.floor(Math.random() * canvas.height);
        allBanks.push(new Bank(i, x, y));
    }

    for (let j = 0; j < bankNum; j++){
        let bank = allBanks[j];
        let coreDegree = Math.random() * avgCoreDegree; //We do not want disconnected nodes, so we add 1\

        let inEdges = []
        if(j < coreNum){
            for(i = 0; i < coreDegree; i++){
                let index = Math.floor(Math.random() * coreNum);
                // console.log(i);
                if(index == bank.ref 
                || inEdges.indexOf(allBanks[index]) != -1 
                || allBanks[index].interbankLoans + allBanks[index].externalLiabilites + allBanks[index].capitalBuffer > 100){
                    continue;
                }
                inEdges.push(allBanks[index]);
            }
        }

        let peripheryDegree = Math.random() * avgPeripheryDegree; //We do not want disconnected nodes, so we add 1
        for(i = 0; i < peripheryDegree; i++){
            let index = Math.floor(Math.random() * bankNum);
            if(index == bank.ref 
            || inEdges.indexOf(allBanks[index]) != -1 
            || allBanks[index].interbankLoans + allBanks[index].externalLiabilites + allBanks[index].capitalBuffer > 100){
                continue;
            }
            inEdges.push(allBanks[index]);
        } 

        bank.setInEdges(inEdges);
    }
    return allBanks;
}



function drawNetwork(allBanks){
    console.log("-------------------------------");
    allBanks.forEach((bank)=>{
        cx.beginPath();
        cx.arc(bank.x, bank.y, 5, 0, 2 * Math.PI);
        bank.default? cx.fillStyle = "red": cx.fillStyle = "blue";
        cx.fillText(String(bank.ref), bank.x, bank.y)
        bank.inEdges.forEach((conBank)=>{
            cx.lineTo(conBank.x, conBank.y);
            cx.moveTo(bank.x, bank.y);
        })
        cx.stroke();
    });
    return allBanks;
}



function simulateShock(banksIndex, allBanks){
    if(banksIndex == 0) return allBanks;
    let defaultBank = allBanks[Math.floor(Math.random() * banksIndex)];
    defaultBank.shock();
    return [allBanks, defaultBank]
}



function stats(avgDegree, networkSetup, bankNum, iterations, corePercent, degreeRatio, coreShock){
    let numberOfDefaults = [];
    let numberOfGlobalCascades = 0;
    let degrees = []

    let coreNum = Math.floor(corePercent * bankNum);
    let avgPeripheryDegree = (2 * avgDegree) / (1 + degreeRatio);
    let avgCoreDegree = avgPeripheryDegree * degreeRatio;

    let banksIndex = coreShock? coreNum: bankNum;
    for(let i = 0; i<iterations; i++){
        let allBanks = simulateShock(banksIndex, networkSetup(avgDegree, bankNum, coreNum, avgCoreDegree, avgPeripheryDegree))[0];
        let defaults = allBanks.filter((bank) => bank.default).length;
        numberOfDefaults.push(defaults);
        degrees.push(actualDegree(allBanks));
        // In our model, a global cascade is said to have occurred if over 5% of an interbank network’s nodes (the banks of the network) have defaulted.
        if(defaults > bankNum * 0.05) numberOfGlobalCascades += 1; 
    }
    let avgDegrees = degrees.reduce((a, b) => a + b, 0) / degrees.length;
    let probabilityOfGC = numberOfGlobalCascades/iterations;
    return [probabilityOfGC, avgDegrees];

}



function actualDegree(allBanks){
    return allBanks.reduce((a, b) => a + b.outEdges.length + b.inEdges.length, 0) / allBanks.length;
}



async function dataGeneration(bankNum, iterations, corePercent, degreeRatio){
    let corePeripheryGlobalShockData = [];
    let corePeripheryCoreShockData = [];
    let erdosGlobalShockData = [];

    let allDegreesGlobalShock = [];
    let allDegreesCoreShock = [];
    let allDegreesErdosShock = [];

    let loading = document.querySelector("#loading");
    loading.style.display = "";

    let avg = 1;
    async function dataGen(done){
        loading.innerText = (avg/14.5) * 100 + "%";
        avg += 0.5;
        let data = stats(avg, corePeriphery, bankNum, iterations, corePercent, degreeRatio, false)
        corePeripheryGlobalShockData.push(data[0]);
        allDegreesGlobalShock.push(data[1]);

        data = stats(avg, corePeriphery, bankNum, iterations, corePercent, degreeRatio, true);
        corePeripheryCoreShockData.push(data[0]);
        allDegreesCoreShock.push(data[1]);

        data = stats(avg, erdos, bankNum, iterations);
        erdosGlobalShockData.push(data[0]);
        allDegreesErdosShock.push(data[1]);

        if(avg < 15) return setTimeout(dataGen, 0, done);
        done({
            corePeripheryGlobalShockData,
            corePeripheryCoreShockData,
            erdosGlobalShockData,
            allDegreesGlobalShock, 
            allDegreesCoreShock, 
            allDegreesErdosShock
        });
    }

    return new Promise((resolve) => {
        dataGen(params => resolve(params));
    });

}



let tempBanks;
let tempCoreNum;
function userInput(){
    let form = document.querySelector("#parameters");
    form.addEventListener("change", e => {
        e.target.style.backgroundColor = "";
    });
    
    let searchBar = document.querySelector("#searchBar");
    let searchInput = document.querySelector("[name='nodeSearch'");
    let ass = document.querySelector("#ass");
    let liab= document.querySelector("#liab");
    let shockedNode = document.querySelector("#shockedNode");
    form.addEventListener("submit", e => {
        e.preventDefault();
        ass.innerText = "";
        liab.innerText = "";
        shockedNode.innerText = "";
        cx.clearRect(0, 0, canvas.width, canvas.height);
    
        let inputs = Array.from(form.elements);
        inputs.forEach((input, index) => {
            if(!input.value && input.nodeName == "INPUT"){
                input.style.backgroundColor = "pink";
            };
        });
        
        let network = form.elements["network"].value;
        let avgDegree = Number(form.elements["degree"].value);
        let bankNum = Number(form.elements["bankNum"].value);
        if (!avgDegree && !bankNum) return;
        searchInput.setAttribute("max", bankNum - 1);
        searchBar.style.display = "";
        if (network === "Core-Periphery"){
            let corePercent = Number(form.elements["corePercent"].value);
            let degreeRatio = Number(form.elements["degreeRatio"].value);
            if (!corePercent && !degreeRatio) return;
            let coreNum = Math.floor(corePercent * bankNum);
            let avgPeripheryDegree = (2 * avgDegree) / (1 + degreeRatio);
            let avgCoreDegree = avgPeripheryDegree * degreeRatio;
            canvas.style.display = "";
            tempBanks = drawNetwork(corePeriphery(avgDegree, bankNum, coreNum, avgCoreDegree, avgPeripheryDegree));
            tempCoreNum = coreNum;
            return;
        }
        canvas.style.display = "";
        tempBanks = drawNetwork(erdos(avgDegree, bankNum));
    });
    

    let networkChoice = document.querySelector("[value='Erdos']").parentElement.parentElement;
    let shockCore = document.querySelector("#coreShock");
    networkChoice.addEventListener("click", e => {
        console.log(e.target.value);
        if(e.target.value == undefined) return;
        if(e.target.value == "Erdos"){
            shockCore.style.display = "none";
            form.elements["degreeRatio"].parentElement.style.display = "none";
            form.elements["corePercent"].parentElement.style.display = "none";
            return;
        }
        shockCore.style.display = "";
        form.elements["degreeRatio"].parentElement.style.display = "";
        form.elements["corePercent"].parentElement.style.display = "";
    })
    

    let shock = document.querySelector("#shock");
    shock.addEventListener("click", e => {
        cx.clearRect(0, 0, canvas.width, canvas.height);
        let network = simulateShock(tempBanks.length, tempBanks);
        shockedNode.innerText = `The shocked node was ${network[1].ref}`
        drawNetwork(network[0]);
    });


    shockCore.addEventListener("click", e => {
        cx.clearRect(0, 0, canvas.width, canvas.height);
        console.log(tempCoreNum);
        let network = simulateShock(tempCoreNum, tempBanks);
        shockedNode.innerText = `The shocked node was ${network[1].ref}`
        drawNetwork(network[0]);
    });


    searchBar.addEventListener("submit", e => {
        e.preventDefault();
        tempBanks.forEach(bank => {
            if(bank.ref == searchInput.value){
                let inbanks = [];
                let outbanks = [];
                console.log(bank);
                bank.inEdges.forEach(inbank => inbanks.push(`\t\tBank node ${inbank.ref} owes us ${bank.interbankAssetsSplit}`));
                bank.outEdges.forEach(outbank => outbanks.push(`\t\tWe owe ${outbank.interbankAssetsSplit} to Bank node ${outbank.ref}`));
                ass.innerText = `Current bank node: ${bank.ref}\n
                    Default: ${bank.default}\n
                    Capital buffer: ${bank.capitalBuffer}\n
                    Inter-bank assets: ${bank.interbankAssets} ------> ${inbanks}\n
                    Illiquid external assets: ${bank.illiquidExternalAssets}`;

                liab.innerText = `Inter-bank loans: ${bank.interbankLoans} ------> ${outbanks}\n
                    External liabilities: ${bank.externalLiabilites}`;
            }
        });
    });


    let monteCarloForm = document.querySelector("#monteCarlo");
    monteCarloForm.addEventListener("change", e => {
        e.target.style.backgroundColor = "";
    });


    monteCarloForm.addEventListener("submit", e => {
        e.preventDefault();
        Plotly.purge('myDiv');

        let inputs = Array.from(monteCarloForm.elements);
        let simulate = true;
        inputs.forEach((input) => {
            if(!input.value && input.nodeName == "INPUT"){
                input.style.backgroundColor = "pink";
                simulate = false;
            };
        });
        if(simulate){
            let bankNum = Number(monteCarloForm.elements["bankNum"].value);
            let iterations = Number(monteCarloForm.elements["iterations"].value);
            let degreeRatio = Number(monteCarloForm.elements["degreeRatio"].value);
            let corePercent = Number(monteCarloForm.elements["corePercent"].value);
            dataGeneration(bankNum, iterations, corePercent, degreeRatio).then((defaultData) => {
                console.log(defaultData);
                let corePeripheryGlobal = {
                    x: defaultData.allDegreesGlobalShock,
                    y: defaultData.corePeripheryGlobalShockData,
                    name: 'Core-Periphery network (random shock)',
                    mode: 'lines+markers',
                    type: 'scatter'
                };
                
                let corePeripheryCore = {
                    x: defaultData.allDegreesCoreShock,
                    y: defaultData.corePeripheryCoreShockData,
                    name: 'Core-Periphery network (random shock to core)',
                    mode: 'lines+markers',
                    type: 'scatter'
                };
                
                let erdosGlobal = {
                    x: defaultData.allDegreesErdosShock,
                    y: defaultData.erdosGlobalShockData,
                    name: 'Erdos network (random shock)',
                    mode: 'lines+markers',
                    type: 'scatter'
                };
                
                let data = [corePeripheryGlobal, corePeripheryCore, erdosGlobal];
    
                let layout = {
                    title: 'Graph showing the relationship between probaility of global cascade and degree of network',
                    xaxis: {
                        title: 'Degree',
                    },
                    yaxis: {
                        title: 'Probability of global cascade',
                    }
                };
                Plotly.newPlot('myDiv', data, layout);
            });
        } 
    });
}

userInput();

