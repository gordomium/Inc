module.exports = function (url, callback) {
    // var r = window.ActiveXObject ? new window.ActiveXObject('Microsoft.XMLHTTP'): new window.XMLHttpRequest()
    var r = new window.XMLHttpRequest();
    r.open('GET', url, true);
    r.onreadystatechange = function () {
        if (r.readyState === 4) {
            if (r.status === 200) {
                callback(r.responseText, r);
            } else {
                callback();
            }
        }
    };
    return r.send(null);
};