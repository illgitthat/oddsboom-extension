window.addEventListener ("load", modifyPage, false);

function modifyPage () {
    var jsInitChecktimer = setInterval (checkForJS_Finish, 100);
    function checkForJS_Finish () {
        if (document.querySelector (".blurred") != null) {
            // clearInterval (jsInitChecktimer);
            // Select elements with class="blurred"
            var elements = document.querySelectorAll('.blurred');
            // Remove the class "blurred" from all of them
            for (var i = 0; i < elements.length; i++) {
                elements[i].classList.remove("blurred");
            }
        }
        // Get element with href pointing to "/r/Plus"
        var plusLink = document.querySelector ("a[href='/r/Plus']");
        // If pluslink exists, remove it
        if (plusLink != null) {
            plusLink.remove();
        }
        // Select elements with class="off"
        var elements = document.querySelectorAll('.off');
        // Remove the class "off" from all of them
        for (var i = 0; i < elements.length; i++) {
            elements[i].classList.remove("off");
        }
        // Use document.querySelector to remove display:none from all elements with class "flucs"
        var flucs = document.querySelectorAll('.flucs');
        for (var i = 0; i < flucs.length; i++) {
            flucs[i].style.display = "";
        }

        // Remove all paragraph elements that contain a link to "/r/Plus"
        var paragraphs = document.querySelectorAll('p');
        for (var i = 0; i < paragraphs.length; i++) {
            if (paragraphs[i].querySelector("a[href='/r/Plus']") != null) {
                paragraphs[i].remove();
            }
        }
        // Check for td elements that contain text "Subscribe to" and remove them
        var tds = document.querySelectorAll('td');
        for (var i = 0; i < tds.length; i++) {
            if (tds[i].innerText.includes("Subscribe to")) {
                tds[i].remove();
            }
        }
    }
}

