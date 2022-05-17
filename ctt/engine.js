let specs = {
    width: 16,
    height: 10,
    size: 50, // in pixels
    sequenceLength: 20,
    peekables: 3,
};

let startTime;
let prevClick;

let performance = {
    age: undefined,
    hash: undefined,
    successes: 0,
    mistakes: 0,
    failures: 0,
    interactions: [],
    elapsed: 0,
    user_id: null,
    observations: null,
}

let sequence = {
    coordinates: [],
    position: undefined,
};

document.addEventListener('DOMContentLoaded', () => {
    completeHtmlInformation();
    makeGrid();
    setupEvents();
});

function completeHtmlInformation() {
    document.getElementById('sequence-length').innerHTML = specs.sequenceLength;
    document.getElementById('grid-cols').innerHTML = specs.width;
    document.getElementById('grid-rows').innerHTML = specs.height;
}

function makeGrid() {
    let grid = document.getElementById('grid');

    for (let x = 0; x < specs.width; x++) {
        for (let y = 0; y < specs.height; y++) {
            let cell = document.createElement('span');
            cell.classList.add('cell');
            cell.id = `cell-${x}-${y}`;
            grid.appendChild(cell);

            let target = document.createElement('span');
            target.classList.add('target');
            target.id = `target-${x}-${y}`;
            cell.appendChild(target);
        }
    }

    grid.style.gridTemplateColumns = `repeat(${specs.width},1fr)`;
    grid.style.gridTemplateRows = `repeat(${specs.height},1fr)`;
    grid.style.width = `${specs.width * specs.size}px`;
    grid.style.height = `${specs.height * specs.size}px`;
}

function setupEvents() {
    document.querySelector('#login form').addEventListener('submit', login);
    document.querySelector('#grid').addEventListener('click', gridClick);
    document.querySelector('#results button').addEventListener('click', newSequence);
}

function login(evt) {
    evt.preventDefault();

    validateLogin() && newSequence();
}

function newSequence() {
    setupSequence().then(() => {
        startTime = Date.now();

        document.getElementById('login').style.display = 'none';
        document.getElementById('results').style.display = 'none';
        document.getElementById('arena').style.display = 'block';
    }).catch(errors => {
        if (Array.isArray(errors)) {
            alert(errors.join('\n'));
        } else {
            alert(errors);
        }
    });
}

async function getSequence() {
    if (location.protocol == 'file:') {
        return Promise.resolve(getLocalSequence());
    }

    const response = await fetch(
        'http://areasgrupo.alunos.di.fc.ul.pt/~ipm000/projb/get_sequence.php',
        {
            method: 'POST',
            body: JSON.stringify({
                width: specs.width,
                height: specs.height,
                length: specs.sequenceLength,
            }),
        }
    );

    let result = await response.json();

    if (result.success) {
        return result.data
    } else {
        throw result.errors;
    }
}

function getLocalSequence() {
    let coordinates = [];

    for (let i = 0; i < specs.sequenceLength; i++) {
        coordinates.push([
            Math.floor(Math.random() * specs.width),
            Math.floor(Math.random() * specs.height),
        ]);
    }

    return {
        coordinates,
        hash: undefined
    };
}

async function setupSequence() {
    let { coordinates, hash } = await getSequence();

    sequence.coordinates = coordinates;
    sequence.position = -1;

    performance.hash = hash;
    performance.successes = 0;
    performance.failures = 0;
    performance.mistakes = 0;
    performance.interactions = [];

    prevClick = Date.now();

    advanceSequence();
}

function advanceSequence() {
    // Remove the goal-n classes from all targets
    for (const el of document.getElementsByClassName('target')) {
        el.className = 'target';
    }

    // Advance inside the sequence
    sequence.position++;
    document.getElementById('position').innerHTML = sequence.position;

    // If we are at the end of the sequence, stop collecting data
    if (sequence.position == sequence.coordinates.length) {
        stopSequence();
        return
    }

    // Otherwise, annotate the new targets with the goal-n classes
    for (
        let i = 0;
        i < specs.peekables && sequence.position + i < sequence.coordinates.length;
        i++
    ) {
        let [x, y] = sequence.coordinates[sequence.position + i];
        document.getElementById(`target-${x}-${y}`).classList.add(`goal-${i}`);
    }
}

function stopSequence() {
    performance.elapsed = (Date.now() - startTime) / 1000;

    sendResults();

    document.getElementById('arena').style.display = 'none';

    showResults();

    if (typeof processEnd == 'function') {
        processEnd(performance);
    }
}

function showResults() {
    document.getElementById('results').style.display = 'block';

    document.getElementById('results-sent').style.display =
        performance.hash ? 'block' : 'none';

    document.querySelector('#results-age').innerHTML = performance.age;
    document.querySelector('#results-successes').innerHTML = performance.successes;
    document.querySelector('#results-failures').innerHTML = performance.failures;
    document.querySelector('#results-mistakes').innerHTML = performance.mistakes;
    document.querySelector('#results-time').innerHTML = Math.floor(performance.elapsed);
}

function sendResults() {
    if (performance.hash) {
        fetch(
            'http://areasgrupo.alunos.di.fc.ul.pt/~ipm000/projb/store_results.php',
            {
                method: 'POST',
                body: JSON.stringify(performance),
            }
        );
    }
}

function gridClick(evt) {
    let target = evt.target;

    let grid = document.getElementById('grid');
    let xGrid = grid.getBoundingClientRect().x
    let yGrid = grid.getBoundingClientRect().y

    let goal = document.querySelector('.goal-0');
    let xGoal = goal.getBoundingClientRect().x - xGrid;
    let yGoal = goal.getBoundingClientRect().y - yGrid;

    let x = evt.clientX - xGrid;
    let y = evt.clientY - yGrid;

    let interaction = {
        x: x,
        y: y,
        distance: Math.sqrt((xGoal - x) * (xGoal - x) + (yGoal - y) * (yGoal - y)),
        elapsed: (Date.now() - prevClick) / 1000,
    };

    const onTarget = target.id.startsWith('target');

    if (!onTarget) {
        performance.mistakes++;
        interaction.type = 'mistake';
        interaction.class = null;
    }
    else if (target.classList.contains('goal-0')) {
        performance.successes++;
        interaction.type = 'success';
        interaction.class = getClassName(target);
    }
    else {
        performance.failures++;
        interaction.type = 'failure';
        interaction.class = getClassName(target);
    }

    performance.interactions.push(interaction);

    prevClick = Date.now();

    if (onTarget) {
        advanceSequence();
    }

    if (typeof processClick === 'function') {
        interaction.target = target;
        processClick(interaction);
        delete interaction.target;
    }
}

function getClassName(el) {
    return Array.from(el.classList).filter(x => x !== 'target').join(' ');
}

function validateLogin() {
    let age = document.querySelector('#login input').value;

    if (!age.match(/^\d+$/)) {
        document.getElementById('error-age').innerText = 'Wrong age format: age must consist of digits only (0-9)';
        document.getElementById('error-age').style.display = 'block';
        return false;
    }

    performance.age = parseInt(age);

    if (performance.age <= 6) {
        document.getElementById('error-age').innerText = 'You must be at least 7 to play!';
        document.getElementById('error-age').style.display = 'block';
        return false;
    }

    performance.user_id = getUserId();

    if (typeof processStart == 'function') {
        processStart(performance);
    }

    return true;
}

function setObservation(observations) {
    performance.observations = observations;
}

function getUserId() {
    return localStorage.userId ? localStorage.userId : generateUserId();
}

function generateUserId() {
    const length = 16;

    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = [];

    for (let i = 0; i < length; i++) {
        result.push(
            characters.charAt(Math.floor(Math.random() * characters.length))
        );
    }

    return result.join('');
}
