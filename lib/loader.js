/*eslint no-console: 0, no-eval: 0, no-useless-call: 0, no-loop-func: 0*/
var store = require('./store');
var merge = require('./merge');
var sha1 = require('./sha1');

var loader = {};

loader.store = store;
loader.merge = merge;

/**
 * bizname 用来区分不用业务的存储空间
 * store 是否使用本地存储
 * serverUrl 增量代理服务器地址
 * cdnUrl cdn地址
 */
var configure = { 
    bizname: '', 
    isStore: false, 
    clearStoreIfCantSave: true, // setItem 遇到状况的时候是否清除当前 bizname 匹配的缓存（配有设置 prefix 的情况则不处理
    validateAssetSignIfGiven: true,
    serverUrl: '', 
    cdnUrl: ''
};
var configureMaps = {
    bizname: function (name) {
        store.setPrefix(name + ':');
    },
    serverUrl: merge.setUrl,
    cdnUrl: merge.setCdnUrl
};


// 加载队列
var loadQueue = {};

var loaded = {};
var loading = {};
var afreshLoaded = {};
var modules = {};
var retries = {}


// eval js
var globalEval = function (data) {
    if (data && /\S/.test(data)) {
        // (window.execScript || function(data) {
        window.eval.call(window, data);
        // })(data)
    }
};

// apply css
var globalApply = function (data) {
    var style = document.createElement('style');
    style.textContent = data;
    document.head.appendChild(style);
}

// script方式载入js
var scriptCall = function (url, callback) {
    var script = document.createElement('script');
    script.async = true;
    script.onload = callback;
    script.src = url;
    document.head.appendChild(script);
};

// 统一的执行js 方式
var jsCall = function (options) {
    var url = options.url
    var content = options.content
    var module = options.name
    var callback = options.callback

    setTimeout(function () {
        if (content) {
            modules[url] = content;
            globalEval(content);
            callback();
            return
        }

        var data =  modules[url]
        if (data) {
            try {
                globalEval(modules[url]);
                callback();
            } catch (e) {
                store.removeItem(module);
                scriptCall(url, callback);
            }
        } else {
            store.removeItem(module);
            scriptCall(url, callback);
        }
    }, 0);
};

// link 方式加载 css
var linkCall = function (url, callback) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = url;
    link.onload = callback;
    document.head.appendChild(link);
};

// 统一的应用 css 方式
var cssCall = function (options) {
    var url = options.url
    var content = options.content
    var module = options.name
    var callback = options.callback

    setTimeout(function () {
        if (content) {
            modules[url] = content;
            globalApply(content);
            callback();
            return
        }

        var data = modules[url];
        if (data) {
            globalApply(data);
            callback();
        } else {
            store.removeItem(module);
            linkCall(url, callback);
        }
    })
};

// 自动判断文件类型加载资源
var assetCall = function (options) {
    var url = options.url
    var module = options.name
    var sign = options.sign
    var callback = options.callback

    var extname = url.substring(url.lastIndexOf('.') + 1).toLowerCase()
    var handle = extname === 'js' ? jsCall : extname === 'css' ? cssCall : null

    if (sign) {
        pullRawContent(url, sign, function (content) {
            if (!content) {
                // @TODO retry ?
                callback();
                return;
            }
            if (handle) handle({ url: url, name: module, sign: sign, callback: callback });
            else callback();
        });
    } else {
        if (handle) handle({ url: url, name: module, callback: callback });
        else callback();
    }

};

// 遍历出需要加载的 modules
var ergodicModules = function (scripts, assets, callback) {
    var length = assets.length;
    var hook = function () {
        if (!--length && callback) {
            callback(scripts);
        }
    };

    if (length === 0) {
        if (callback) {
            callback();
        }
        return;
    }

    for (var i = 0; i < assets.length; i++) {
        var moduleName = assets[i];
        var current = loadQueue[moduleName];

        if (typeof (module) !== 'function' && typeof (current) !== 'undefined') {
            if (current.rely && current.rely.length !== 0) {
                ergodicModules(scripts, current.rely, (function (_current) {
                    return function () {
                        scripts.push(moduleName);
                        hook();
                    };
                })(current));
            } else {
                scripts.push(moduleName);
                hook();
            }
        } else {
            hook();
        }
    }
};

// 对内容签名 （目前只支持 sha1
var signContent = function (content) {
    if (!content) return
    return 'sha1:' + sha1(content)
};

// 检查是否签名无效 （目前只支持 sha1
var isSignNotValid = function (specifiedSign, calculatedSign) {
    return configure.validateAssetSignIfGiven && specifiedSign
        ? specifiedSign !== calculatedSign
        : false
};

// 直接拉取完整资源
var pullRawContent = function (url, sign, callback) {
    merge.merge('', url, '', function (content) {
        if (isSignNotValid(sign, signContent(content))) {
            callback();
            return;
        }

        callback(content);
    });
};

// 加载资源
var loadAsset = function (options) {
    var url = options.url
    var module = options.name
    var version = options.version
    var callback = options.callback
    var specifiedSign = options.sign

    if (loading[url] && !afreshLoaded[url]) {
        if (callback) {
            setTimeout(function () {
                loadAsset(options);
            }, 5);
            return;
        }
        return;
    }

    if (loaded[url] && modules[url] && !afreshLoaded[url]) {
        if (callback) {
            callback(modules[url]);
            return;
        }
        return;
    }

    loading[url] = true;
    afreshLoaded[url] = false;

    // 是否使用本地存储，当 store.setItem 异常后会强制关闭这个开关所以每次有资源加载都检查
    if (configure.isStore) {
        var moduleData = store.getItem(module) || {};
        var moduleContent = moduleData.c || '';
        var moduleURL = moduleData.u || '';

        if (moduleURL === url) {
            loaded[url] = true;
            loading[url] = false;
            modules[url] = moduleContent;

            if (callback) {
                callback(moduleContent);
            }
            return;
        }

        var reload = function (allowRetries) {
            if (typeof retries[url] !== 'number') retries[url] = 0
            retries[url]++

            store.removeItem(module);

            if (retries[url] >= allowRetries) {
              // @TODO any report ?
              callback()
              return
            }

            afreshLoaded[url] = true;
            loadAsset(options);
        };

        var oldUrl = version ? moduleURL : '';
        merge.merge(oldUrl, url, moduleContent, function (content) {
            if (!content && oldUrl !== '') {
                reload(1);
                return;
            }

            var calculatedSign = signContent(content)
            if (isSignNotValid(specifiedSign, calculatedSign)) {
                reload(2);
                return
            }

            loaded[url] = true;
            loading[url] = false;
            modules[url] = content;

            // When localStorage is full, or under Safari private mode ...
            if (content && version && url && !store.setItem(module, content, version, url, calculatedSign)) {
                configure.isStore = false
                if (configure.clearStoreIfCantSave) store.clear()
                // @TODO any report?
            }

            if (callback) {
                callback(content);
            }
            return;
        });
        return;
    }

    pullRawContent(url, specifiedSign, function (content) {
        if (content) {
            loaded[url] = true;
            loading[url] = false;
            modules[url] = content;
            if (callback) {
                callback(content);
            }
        } else {
            afreshLoaded[url] = true;
            loadAsset(options);
        }
    });
};

// 加载资源文件
var loadAssets = function (assets, callback) {
    ergodicModules([], assets, function (scripts) {
        var length = scripts.length;
        var hook = function () {
            if (!--length && callback) {
                callback();
            }
        };

        if (length === 0) {
            if (callback) {
                callback();
            }
            return;
        }

        for (var i = 0; i < scripts.length; i++) {
            var moduleName = scripts[i];
            var current = loadQueue[moduleName];
            loadAsset({ url: current.path, name: moduleName, version: current.version, callback: hook, sign: current.sign  });
        }
    });
};


var loadParallel = function (assets, callback) {
    var length = assets.length;
    var hook = function () {
        if (!--length && callback) callback();
    };

    if (length === 0) {
        if (callback) {
            callback();
        }
        return;
    }

    for (var i = 0; i < assets.length; i++) {
        var module = assets[i];
        var current = loadQueue[module];
        if (typeof (module) === 'function') {
            assets[i]();
            hook();
            continue;
        }

        if (typeof (current) === 'undefined') {
            if (console && console.warn) {
                console.warn('In Error :: Module not found: ' + module);
            }
            hook();
            continue;
        }

        if (current.rely && current.rely.length !== 0) {
            loadParallel(current.rely, (function (_current) {
                return function () {
                    assetCall({ url: _current.path, name: module, sign: _current.sign, callback: hook });
                };
            })(current));
        } else {
            assetCall({ url: current.path, name: module, sign: current.sign, callback: hook });
        }
    }
};

var config = function (name, conf) {
    if (arguments.length === 0) {
        return configure;
    } else if (arguments.length === 1) {
        return configure[name];
    }

    configure[name] = conf;

    if (configureMaps[name]) {
        configureMaps[name](conf);
    }

    return conf;
};

var add = function (name, conf) {
    if (!name || !conf) {
        return;
    }

    loadQueue[name] = typeof conf === 'string' ? { path: conf } : conf;
};

var adds = function (conf) {
    if (!conf.modules) return;

    for (var module in conf.modules) {
        if (conf.modules.hasOwnProperty(module)) {
            var module_config = conf.modules[module];

            if (!conf.modules.hasOwnProperty(module)) continue;
            add(module, module_config);
        }
    }
};

var use = function () {
    var callback = function () {
        return;
    };
    var args = [].slice.call(arguments);

    if (typeof (args[args.length - 1]) === 'function') {
        callback = args.pop();
    }

    if (configure.isStore) {
        loadAssets(args, function () {
            loadParallel(args, callback);
        });
    } else {
        loadParallel(args, callback);
    }
};

loader.config = config;
loader.add = add;
loader.adds = adds;
loader.use = use;

module.exports = loader;
