const headers = document.getElementsByClassName("header"),
        contents = document.getElementsByClassName("content"),
        icons = document.getElementsByClassName("icon");

for (let i = 0; i < headers.length; i++) {
        headers[i].addEventListener("click", () => {
            for (let j = 0; j < contents.length; j++) {
                if (i == j) {
                    contents[j].style.display = contents[j].style.display == "block" ? "none" : "block";
                    icons[j].innerHTML = contents[j].style.display == "block" ? "&minus;" : "&plus;";
                } else {
                    contents[j].style.display = "none";
                    icons[j].innerHTML = "&plus;";
                }
            }
        });
    }
