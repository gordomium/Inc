/*eslint no-console: 0*/

var serverUrl = '';
var cdnUrl = '';

/**
 * 设置服务器url
 * @param url
 */
var setUrl = function (url) {
    serverUrl = url;
};

/**
 * 设置cdn url
 * @param url
 */
var setCdnUrl = function (url) {
    cdnUrl = url;
};

/**
 * 合并算法
 * @param oldContent
 * @param incData
 * @return String 合并后的内容
 */
var _merge = function (oldContent, incData) {
    var reContent = '';
    var dataArray = incData;
    var lastArray = null;
    for (var i = 0; i < dataArray.length; i++) {
        var jObj = dataArray[i];
        if (typeof jObj === 'object') {
            var start = jObj[0] - 1;
            var len = jObj[1];
            if (lastArray) {
                start = start + lastArray[0];
            }
            lastArray = jObj;
            reContent += oldContent.substring(start, start + len);
        } else {
            reContent += jObj;
        }
    }
    return reContent;
};

/**
 * xhr
 * @return
 */
var _xhr = function (url, callback) {
    // var r = window.ActiveXObject ? new window.ActiveXObject('Microsoft.XMLHTTP'): new window.XMLHttpRequest()
    var r = new window.XMLHttpRequest();
    r.open('GET', url, true);
    r.onreadystatechange = function () {
        if (r.readyState === 4) {
            if (r.status === 200) {
                callback(r.responseText);
            } else {
                callback();
            }
        }
    };
    return r.send(null);
};

/**
 * 获取 Diff 信息
 * @param source
 * @param target
 * @param callback({
 *            code: 1, // 0 失败 1 增量 2 全量 3 没有变化
 *            data: {}
 *        })
 * @return
 */
var _getMixDiff = function (source, target, callback) {
    var isProxy = serverUrl === '' || cdnUrl === '' || !source || source === '';
    // var eRealUrl = isProxy ? serverUrl + 'proxy?target=' + target : serverUrl + '?source=' + source + '&target=' + target;
    var eRealUrl = isProxy ? target : cdnUrl + target.replace(/(http:|https:|\/)/g, '') + '-' + source.replace(/(http:|https:|\/)/g, '');
    _xhr(eRealUrl, function (responseText) {
        if (responseText && responseText !== '') {
            if (isProxy) {
                callback({
                    code: 2,
                    data: responseText
                });
            } else {
                var code = responseText[responseText.length - 1];
                if (Number(code) === 1 || Number(code) === 2) {
                    callback({
                        code: Number(code),
                        data: responseText.substr(0, responseText.length - 1)
                    });
                } else {
                    callback({
                        code: Number(code)
                    });
                }
            }
        } else {
            if (!isProxy) {
                _xhr(serverUrl + '?target=' + target + '&source=' + source, function () {
                    return true;
                });
            }
            callback({
                code: 0
            });
        }
    });
};

/**
 * 获取改变后的内容
 * @param source
 * @param target
 * @param oldConetnt
 * @param callback(content)
 * @return
 */
var merge = function (source, target, oldConetnt, callback) {
    if (!serverUrl || serverUrl === '') {
        if (console && console.error) {
            console.error('In Error :: Server url not set');
        }
    }

    try {
        _getMixDiff(source, target, function (payload) {
            if (payload.code === 1) {
                callback(_merge(oldConetnt, JSON.parse(payload.data)));
            } else if (payload.code === 2) {
                callback(payload.data);
            } else if (payload.code === 3) {
                callback(oldConetnt);
            } else {
                callback();
            }
        });
    } catch (e) {
        callback();
    }
};

// _ 前缀为私有方法，这里只是为了方便单元测试
module.exports = {
    _merge: _merge,
    _getMixDiff: _getMixDiff,
    setUrl: setUrl,
    setCdnUrl: setCdnUrl,
    merge: merge
};
