function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min) ) + min;
}

function getImg(){
    return getRndInteger(1, 5).toString() + ".png"; 
}

function randomWordArtLogo(){
    let logo = document.querySelector(".center_logo > a.logo > img");
    let img = "img/wordart/" + getImg();
    logo.src = img;
}
