/*eslint no-console: 0*/

/**
 * xhr
 * @return
 */
var _xhr = require('./fetch');

var serverUrl = '';
var cdnUrl = '';
var maxDiffLength = 64 * 1024;

var RESULT_TYPE ={
    FAILED: 0,
    SUCCESS_WITH_DIFF: 1,
    SUCCESS_WITH_FULL_CONTENT: 2,
    SUCCESS_WITHOUT_DIFF: 3
}

// _ 前缀为私有方法，这里只是为了方便单元测试
module.exports = {
    _merge: _merge,
    _getMixDiff: _getMixDiff,
    setUrl: setUrl,
    setCdnUrl: setCdnUrl,
    merge: merge,
    RESULT_TYPE: RESULT_TYPE
};

function invokeHook () {
    if (!module.exports.invokeHook) return function () {}
    return module.exports.invokeHook.apply(null, arguments)
}
function invokeCount () {
    if (!module.exports.invokeCount) return function () {}
    return module.exports.invokeCount.apply(null, arguments)
}
function reportError (e) {
    if (!module.exports.reportError) return
    return module.exports.reportError(e)
}

/**
 * 设置服务器url
 * @param url
 */
function setUrl (url) {
    serverUrl = url;
};

/**
 * 设置cdn url
 * @param url
 */
function setCdnUrl (url) {
    cdnUrl = url;
};

/**
 * 合并算法
 * @param oldContent
 * @param incData
 * @return String 合并后的内容
 */
function _merge (oldContent, incData) {
    var endHook = invokeHook('merge:calculation')

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

    endHook({})
    return reContent;
};

function _toPatchContentUrl (target, source) {
    return cdnUrl + 
        target.replace(/(http:|https:|\/)/g, '').replace(/[?#].*$/, '') + 
        '-' + 
        source.replace(/(http:|https:|\/)/g, '').replace(/[?#].*$/, '')
}

function _toPatchRequestUrl (target, source) {
    return serverUrl + 
        '?target=' + 
        target.replace(/[?#].*$/, '') + 
        '&source=' + 
        source.replace(/[?#].*$/, '')
}

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
function _getMixDiff (source, target, callback) {
    var endHook = invokeHook('merge:pull-diff')

    var eRealUrl = _toPatchContentUrl(target, source);
    _xhr(eRealUrl, function (responseText) {
        if (responseText) {
            var code = responseText[responseText.length - 1];
            endHook({ mergeCode: code })

            if (Number(code) === RESULT_TYPE.SUCCESS_WITH_DIFF || Number(code) === RESULT_TYPE.SUCCESS_WITH_FULL_CONTENT) {
                callback({
                    code: Number(code),
                    data: responseText.substr(0, responseText.length - 1)
                });
            } else {
                callback({
                    code: Number(code)
                });
            }
        } else {
            endHook({ mergeCode: -1 })
            reportError(new Error('Diff patch not found'))

            endHook = invokeHook('merge:request-diff')

            var requestUrl = _toPatchRequestUrl(target, source)
            _xhr(requestUrl, function (body, r) {
                if (/application\/json/i.test(r.getResponseHeader('Content-Type'))) {
                    var resp = JSON.parse(body)
                    var code = Number(resp.code)
                    var data = resp.data
                    endHook({ mergeCode: code })

                    callback({
                        code: code,
                        data: data
                    })
                } else {
                    reportError(new Error('Diff server did not response valid content with status: ' + r.status))
                    endHook({ mergeCode: -1 })
                    callback({
                        code: RESULT_TYPE.FAILED
                    });
                }
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
function merge (source, target, oldConetnt, callback) {
    if (!serverUrl || !cdnUrl) {
        reportError(new Error('Server url not set'))
        if (console && console.error) {
            console.error('In Error :: Server url not set');
        }
    }

    if (!source) {
         _xhr(target, function (responseText) {
            callback(responseText, RESULT_TYPE.SUCCESS_WITH_FULL_CONTENT)
        }); 
        return
    }

    try {
        _getMixDiff(source, target, function (payload) {
            var code = payload.code
            var data = payload.data
            invokeCount('merge:code:' + code)

            if (code === RESULT_TYPE.SUCCESS_WITH_DIFF) {
                if (data.length > maxDiffLength) {
                    invokeCount('merge:diff-fat')
                    _xhr(target, function (responseText) {
                        callback(responseText, RESULT_TYPE.SUCCESS_WITH_FULL_CONTENT)
                    });  
                } else {
                    invokeCount('merge:diff-thin')
                    callback(
                        _merge(oldConetnt, JSON.parse(data)), 
                        code
                    );
                }
            } else if (code === RESULT_TYPE.SUCCESS_WITH_FULL_CONTENT) {
                callback(data, code);
            } else if (code === RESULT_TYPE.SUCCESS_WITHOUT_DIFF) {
                callback(oldConetnt, code);
            } else {
                reportError(new Error('Illegal merge result code:' + code + '  [fallback to full-fetch]'))
                 _xhr(target, function (responseText) {
                    callback(responseText, RESULT_TYPE.SUCCESS_WITH_FULL_CONTENT)
                }); 
            }
        });
    } catch (e) {
        reportError(e)
        _xhr(target, function (responseText) {
            callback(responseText, RESULT_TYPE.SUCCESS_WITH_FULL_CONTENT)
        }); 
    }
};
