const { fetch: origFetch } = window;
window.fetch = async (...args) => {
    //console.log("fetch called with args:", args);
    const response = await origFetch(...args);
    const url = args[0];
    /* work with the cloned response in a separate promise
       chain -- could use the same chain with `await`. */
    if (/^https:\/\/api\.americanwagering\.com\/regions\/.*\/brands\/czr\/sb\/bets$/.test(String(url))) {
        response
            .clone()
            .json()
            .then(body => CZRdisplayLimit(body))
            .catch(err => console.log(err))
            ;
    }
    // Check if url matches https://gaming-us-*.draftkings/com/api/wager/v1/placeBets
    else if (/^https:\/\/gaming-us-\w+\.draftkings\.com\/api\/wager\/v1\/placeBets$/.test(String(url))) {
        response
            .clone()
            .json()
            .then(body => DKdisplayLimit(body))
            .catch(err => console.log(err))
    }
    else {
        response
            .clone()
            .json()
            .then(body => console.log(body))
            .catch(err => console.log(err))
            ;
    }
    return response;
};

function DKdisplayLimit(body) {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    });
    if (body.response && body.response.bets && body.response.bets[0].maxStake) {
        const numericMaxStake = body.response.bets[0].maxStake;
        const maxStake = formatter.format(numericMaxStake);
        const betslipElement = document.querySelector('.sportsbook__betslip');
        // Only proceed if sportsbook__betslip already exists in the DOM
        if (betslipElement) {
            const observer = new MutationObserver(() => {
                // Query for the maxStakeWarning element again in case it has been added to the DOM
                const maxStakeWarning = betslipElement.querySelector('.dk-action-required__text');
                if (maxStakeWarning) {
                    maxStakeWarning.innerText = 'The maximum stake is ' + maxStake;
                    // Stop observing once the element is found
                    observer.disconnect();

                    const actionRequiredButton = document.querySelector('.dk-action-required__button button');
                    const betSelectionElements = document.querySelectorAll('.sportsbook-outcome-cell__body.selected');
                    actionRequiredButton.click();
                    betSelectionElements.forEach(betSelectionElement => betSelectionElement.click());

                    const betslipStakeField = document.querySelector('.betslip-wager-box__input');
                    const placeBetButton = document.querySelector('.dk-place-bet-button__container');
                    if (betslipStakeField) {
                        setTimeout(() => { // timeout needed otherwise the betslip isn't fully rendered yet
                            betslipStakeField.focus();
                            document.execCommand('insertText', false, numericMaxStake);
                            // add a footer of <div class="dk-action-required__title" style="margin-top:10px">Max Stake Adjusted to $25.69</div> to the end of the dk-place-bet-button__container div
                            const footerContents = document.createElement('div');
                            footerContents.className = "dk-action-required__title";
                            footerContents.style.marginTop = "10px";
                            footerContents.innerHTML = "Max Stake Adjusted to " + maxStake;
                            footerContents.style.textAlign = "center";
                            footerContents.style.backgroundColor = "#fbd002";
                            placeBetButton.appendChild(footerContents);
                        }, 500);
                    }
                }
            });
            // Start observing betslipElement and its descendants
            observer.observe(betslipElement, {
                childList: true, // observe direct children
                subtree: true, // and lower descendants too
            });
        }
    }
}

function CZRdisplayLimit(body) {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    });
    // Check if bet was placed and maxBet exists in the body array, and if so display it.
    if (body.bets && body.bets[0].maxBet) {
        // Get max bet, subtract current bet, and divide by 100 to get the correct value.
        const maxBet = formatter.format((body.bets[0].maxBet - body.bets[0].totalStake) / 100);
        // Look for div with class betReceiptFooter and add a new div with the max bet at the top.
        const betslipFooterInfoRow = document.querySelector('.betReceiptFooter');
        if (betslipFooterInfoRow) {
            const footerContents = document.createElement('div');
            footerContents.classList.add('footerContents');
            const betslipMessages = document.createElement('div');
            betslipMessages.classList.add('betslipMessages');
            const message = document.createElement('span');
            message.classList.add('message');
            message.setAttribute('data-qa', 'betslip-message-alert-item-bet-errors-max-bet-exceeded');
            message.innerText = `Max bet remaining: ${maxBet}`;
            betslipMessages.insertBefore(message, betslipMessages.firstChild);
            footerContents.insertBefore(betslipMessages, footerContents.firstChild);
            betslipFooterInfoRow.insertBefore(footerContents, betslipFooterInfoRow.firstChild);
        }
    }
    // Check if bet was denied and maxStake exists in the body array, and if so display it.
    else if (body.errors) {
        body.errors.forEach(err => {
            if (err.details && err.details.maxStake) {
                const maxStake = formatter.format(err.details.maxStake / 100);
                //console.log("Max stake is:", maxStake);
                const betslipElement = document.querySelector('[data-qa="betslip-input-field-desktop"]');
                if (betslipElement) {
                    betslipElement.value = '';
                    betslipElement.focus();
                    document.execCommand('insertText', false, err.details.maxStake / 100); //execCommand is deprecated, but works for now.
                }
                // Look for div with class betslipFooterInfoRow and add a new div with the max stake.
                const betslipFooterInfoRow = document.querySelector('.betslipFooterInfoRow');
                if (betslipFooterInfoRow) {
                    const footerContents = document.createElement('div');
                    footerContents.classList.add('footerContents');
                    const betslipMessages = document.createElement('div');
                    betslipMessages.classList.add('betslipMessages');
                    const message = document.createElement('span');
                    message.classList.add('message');
                    message.setAttribute('data-qa', 'betslip-message-alert-item-bet-errors-max-stake-exceeded');
                    message.innerText = `Max stake is ${maxStake}. Your bet has been adjusted`;
                    betslipMessages.appendChild(message);
                    footerContents.appendChild(betslipMessages);
                    betslipFooterInfoRow.appendChild(footerContents);
                }
            }
        })
    }
}
