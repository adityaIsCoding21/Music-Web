let audioPlayer = new Audio();
let currentIndex = -1;
let playPauseBtn = document.getElementById("playPause");
let prevBtn = document.getElementById("prevSong");
let nextBtn = document.getElementById("nextSong");
let progressBarContainer = document.getElementById("progressBarContainer");
let progressBar = document.getElementById("progressBar");
let currentTimeDisplay = document.getElementById("currentTime");
let durationDisplay = document.getElementById("duration");
let songTitleDisplay = document.getElementById("songTitle");
let volumeSlider = document.getElementById("volumeSlider");
let volumeIcon = document.getElementById("volumeIcon");

let songList = [];
let listItems = [];
let currentCategory = "";

// ✅ **Fetch Songs from Folder**
async function getSongs(category) {
    try {
        let response = await fetch(`http://127.0.0.1:5500/songs/${category}/`);
        // let response = await fetch(`https://my-musics-player.netlify.app/${category}/`);
        let text = await response.text();
        let parser = new DOMParser();
        let doc = parser.parseFromString(text, "text/html");
        let links = doc.querySelectorAll("a");

        let songs = [];
        links.forEach(link => {
            let fileName = link.href.split("/").pop();
            if (fileName.endsWith(".mp3")) {
                songs.push(link.href);
            }
        });

        return songs;
    } catch (error) {
        console.error("Error fetching songs:", error);
        return [];
    }
}

// ✅ **Load Category Songs**
async function loadCategory(category) {
    if (category === currentCategory) return; // Agar same category pe click ho raha hai to kuch na kare

    currentCategory = category;
    let newSongs = await getSongs(category);

    if (newSongs.length === 0) {
        console.warn("No songs found in", category);
        return;
    }

    songList = newSongs;
    displaySongs();

    // ✅ **Agar pehle se koi song play ho raha hai, toh state maintain kare**
    if (currentIndex !== -1 && !audioPlayer.paused) {
        return; // Agar song play ho raha hai, toh list update ho, lekin song change na ho
    }

    // ✅ **Agar koi song play nahi ho raha, toh first song set kare**
    currentIndex = 0;
    audioPlayer.src = songList[0];
    audioPlayer.load();
    songTitleDisplay.textContent = formatSongName(songList[0]);
    playPauseBtn.classList.replace("fa-pause", "fa-play");
}

// ✅ **Display Songs**
function displaySongs() {
    let ulElement = document.querySelector(".lib2 ul");
    if (!ulElement) return;

    ulElement.innerHTML = "";
    listItems = [];

    songList.forEach((song, index) => {
        let fileName = formatSongName(song);

        let li = document.createElement("li");
        let box = document.createElement("div");
        box.classList.add("box");

        let icon = document.createElement("i");
        icon.classList.add("fa-solid", "fa-circle-play");
        icon.style.color = "#f7f7f7";

        let songInfo = document.createElement("div");
        songInfo.classList.add("songinfo");
        songInfo.textContent = fileName;

        box.appendChild(icon);
        box.appendChild(songInfo);
        li.appendChild(box);

        // ✅ Store category & song in dataset
        li.dataset.category = currentCategory;  
        li.dataset.song = fileName;  

        // ✅ **Maintain playing icon if this song is currently playing**
        if (currentCategory === playingCategory && fileName === playingSong) {
            icon.classList.replace("fa-circle-play", "fa-circle-pause");
        }

        // ✅ **Add Click Event to Play Song**
        li.addEventListener("click", function () {
            playSong(song, fileName, index, icon, currentCategory);
        });

        ulElement.appendChild(li);
        listItems.push({ li, icon, category: currentCategory, song: fileName });
    });

    console.log("Songs loaded:", songList);
}



// ✅ **Play Selected Song**
let playingCategory = "";  // ✅ Store currently playing song's category
let playingSong = "";  // ✅ Store currently playing song's name

function playSong(songURL, songName, index, clickedIcon, category) {
    if (!songURL || !songURL.endsWith(".mp3")) {
        console.error("Invalid song URL:", songURL);
        return;
    }

    if (currentIndex === index && !audioPlayer.paused) {
        audioPlayer.pause();
        playPauseBtn.classList.replace("fa-pause", "fa-play");
        clickedIcon?.classList.replace("fa-circle-pause", "fa-circle-play");
        return;
    }

    audioPlayer.src = songURL;
    audioPlayer.load();
    audioPlayer.play().then(() => {
        console.log("Playing:", songURL);
    }).catch(err => {
        console.error("Playback failed:", err);
    });

    currentIndex = index;
    playingCategory = category;  // ✅ Save playing category
    playingSong = songName;  // ✅ Save playing song
    songTitleDisplay.textContent = songName;
    playPauseBtn.classList.replace("fa-play", "fa-pause");
    updateListIcons(clickedIcon);
}


// ✅ **Update Icons**
function updateListIcons(activeIcon = null) {
    listItems.forEach(({ li, icon, category, song }) => {
        // ✅ Only update icons if category & song match the current playing song
        if (category === currentCategory && song === songTitleDisplay.textContent) {
            if (!audioPlayer.paused) {
                icon.classList.replace("fa-circle-play", "fa-circle-pause");
            } else {
                icon.classList.replace("fa-circle-pause", "fa-circle-play");
            }
        }
    });

    // ✅ Ensure only the active song's icon updates
    if (activeIcon) {
        activeIcon.classList.replace("fa-circle-play", "fa-circle-pause");
    }
}



// ✅ **Category Click Events**
document.querySelectorAll(".c1").forEach(card => {
    card.addEventListener("click", function () {
        let category = card.getAttribute("data-folder");
        if (category !== currentCategory) {
            loadCategory(category);
        }
    });
});

// ✅ **Play/Pause Button Click**
playPauseBtn.addEventListener("click", function () {
    if (!audioPlayer.src || currentIndex === -1) return; // No song selected

    let activeIcon = listItems.find(item => 
        item.category === currentCategory && item.song === songTitleDisplay.textContent
    )?.icon;

    if (audioPlayer.paused) {
        audioPlayer.play();
        playPauseBtn.classList.replace("fa-play", "fa-pause");

        // ✅ Only update icon for current song in the correct category
        updateListIcons(activeIcon);
    } else {
        audioPlayer.pause();
        playPauseBtn.classList.replace("fa-pause", "fa-play");

        // ✅ Don't change icons of other categories
        updateListIcons();
    }
});





// ✅ **Next & Previous Buttons**
nextBtn.addEventListener("click", function () {
    if (currentIndex < songList.length - 1) {
        playSong(songList[currentIndex + 1], formatSongName(songList[currentIndex + 1]), currentIndex + 1, listItems[currentIndex + 1]?.icon);
    }
});

prevBtn.addEventListener("click", function () {
    if (currentIndex > 0) {
        playSong(songList[currentIndex - 1], formatSongName(songList[currentIndex - 1]), currentIndex - 1, listItems[currentIndex - 1]?.icon);
    }
});

// ✅ **Update Progress Bar & Current Time While Playing**
audioPlayer.addEventListener("timeupdate", function () {
    if (!isNaN(audioPlayer.duration) && audioPlayer.duration > 0) {
        let progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progressBar.style.width = `${progress}%`;
        currentTimeDisplay.textContent = formatTime(audioPlayer.currentTime);
        durationDisplay.textContent = formatTime(audioPlayer.duration);
    }
});

// ✅ **Format Time Helper Function**
function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "0:00";

    let min = Math.floor(seconds / 60);
    let sec = Math.floor(seconds % 60);

    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
}


// ✅ **Seek Functionality**
progressBarContainer.addEventListener("click", function (event) {
    let rect = progressBarContainer.getBoundingClientRect();
    let offsetX = event.clientX - rect.left;
    let newTime = (offsetX / rect.width) * audioPlayer.duration;
    audioPlayer.currentTime = newTime;
});

// ✅ **Load First Folder Songs on Page Load**
window.addEventListener("load", async function () {
    let defaultCategory = "hindi";  
    await loadCategory(defaultCategory);

    if (songList.length > 0) {
        currentIndex = 0;
        audioPlayer.src = songList[currentIndex];
        songTitleDisplay.textContent = formatSongName(songList[currentIndex]);
        playPauseBtn.classList.replace("fa-pause", "fa-play");
        updateListIcons();
    }
});

// ✅ **Format Song Name Helper Function**
function formatSongName(songURL) {
    return songURL.split("/").pop().replaceAll("%20", " ").replaceAll(".mp3", "").trim();
}



// Responsive


let bar = document.querySelector(".fa-bars");
let left = document.querySelector(".left");
let cards = document.querySelectorAll(".c1"); // Select all cards

// Function to toggle sidebar
function toggleSidebar() {
    if (left.style.left === "0px") {
        left.style.left = "-100%"; // Hide the sidebar
    } else {
        left.style.left = "0px"; // Show the sidebar
    }
}

// Click menu icon to toggle sidebar
bar.addEventListener("click", toggleSidebar);

// Click any card to open sidebar
cards.forEach(card => {
    card.addEventListener("click", () => {
        left.style.left = "0px"; // Ensure sidebar opens
    });
});

