
const XHR = XMLHttpRequest.prototype

const open = XHR.open
const send = XHR.send
const setRequestHeader = XHR.setRequestHeader

XHR.open = function () {
    this._requestHeaders = {}

    return open.apply(this, arguments)
}

XHR.setRequestHeader = function (header, value) {
    this._requestHeaders[header] = value
    return setRequestHeader.apply(this, arguments)
}

XHR.send = function () {

    this.addEventListener('load', function () {
        const url = this.responseURL
        if (url.endsWith("betway.com/services/api/betting/v3/LookupBets")) {
            const responseHeaders = this.getAllResponseHeaders()
            try {
                if (this.responseType != 'blob') {
                    let responseBody
                    if (this.responseType === '' || this.responseType === 'text') {
                        responseBody = JSON.parse(this.responseText)
                        // Check if bet was denied and MaxBet exists in the body, and if so display it.
                        if (responseBody.Errors[0].Message === "Your wager exceeds the maximum bet amount allowed. Please reduce your wager amount and try again") {
                            //console.log("Max bet is:", maxBet);
                            // Wait for a div with data-testid="bet-slip-alert" to be created and add edit the text with the max stake.
                            const observer = new MutationObserver(function (mutations) {
                                mutations.forEach(function (mutation) {
                                    if (mutation.addedNodes.length) {
                                        const betslipAlert = document.querySelector('[data-testid="bet-slip-alert"]');
                                        if (betslipAlert) {
                                            betslipAlert.innerHTML = betslipAlert.innerHTML.replace("Please reduce your wager amount and try again", "Max bet is: $" + (responseBody.Errors[0].BetLimitDetails[0].MaxBet / 100));
                                            observer.disconnect();
                                        }
                                    }
                                });
                            });
                            observer.observe(document.body, {
                                childList: true,
                                subtree: true
                            });
                        }
                    } else /* if (this.responseType === 'json') */ {
                        responseBody = this.response
                    }
                }
            } catch (err) {
                console.debug("Error reading or processing response.", err)
            }

        }
    })

    return send.apply(this, arguments)
}
