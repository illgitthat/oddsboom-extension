
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
                        //console.log(responseBody);
                        if (responseBody.Errors[0].Message) {
                            console.log(responseBody.Errors[0].Message);
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
