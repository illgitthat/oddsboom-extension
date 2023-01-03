const { fetch: origFetch } = window;
window.fetch = async (...args) => {
    //console.log("fetch called with args:", args);
    const response = await origFetch(...args);
    const url = args[0];
    /* work with the cloned response in a separate promise
       chain -- could use the same chain with `await`. */
    if (url.includes("/bet/api/bets")) {
    }
    response
        .clone()
        .json()
        .then(body => displayLimit(body))
        .catch(err => console.log(err))
        ;

    /* the original response can be resolved unmodified: */


    return response;

    /* or mock the response: */
    // return {
    //     ok: true,
    //     status: 200,
    //     json: async () => ({
    //         userId: 1,
    //         id: 1,
    //         title: "Mocked!!",
    //         completed: false
    //     })
    // };
};

// define displayLimit function
function displayLimit(body) {
    // console.log(body);
    // Check if maxStake exists in the body array, and if so display it.
    if (body.errors) {
        body.errors.forEach(err => {
            if (err.details && err.details.maxStake) {
                const formatter = new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                });
                // maxStake is in cents, so divide by 100 to get dollars.
                const maxStake = formatter.format(err.details.maxStake / 100);
                //console.log("Max stake is:", maxStake);
                // Select the element with data-qa attribute of "betslip-message-alert-item-bet-errors-max-stake-exceeded"
                // and replace the text with the max stake.
                const maxStakeElement = document.querySelector('[data-qa="betslip-message-alert-item-bet-errors-max-stake-exceeded"]');
                if (maxStakeElement) {
                    maxStakeElement.innerHTML = `Stake exceeds this markets maximum. Max stake is ${maxStake}`;
                }
                const betslipElement = document.querySelector('[data-qa="betslip-input-field-desktop"]');
                if (betslipElement) {
                    betslipElement.value = '';
                    betslipElement.focus();
                    document.execCommand('insertText', false, err.details.maxStake / 100); //execCommand is deprecated, but works for now.
                }
            }
        })
    }
}
