const { fetch: origFetch } = window;
window.fetch = async (...args) => {
    //console.log("fetch called with args:", args);
    const response = await origFetch(...args);
    const url = args[0];
    /* work with the cloned response in a separate promise
       chain -- could use the same chain with `await`. */
    if (/^https:\/\/www\.williamhill\.com\/us\/.*\/bet\/api\/bets$/.test(String(url))) {
        response
            .clone()
            .json()
            .then(body => displayLimit(body))
            .catch(err => console.log(err))
            ;
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

function displayLimit(body) {
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
